# Spec 05 -- Persistent Submissions & Backend Infrastructure

> **Status:** Draft
> **Feature:** Section 6 (Persistent Submissions & Return Visits) + backend support for Section 7 (Admin Dashboard)
> **Last updated:** 2026-03-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Layer](#3-database-layer)
4. [API Endpoints](#4-api-endpoints)
5. [Email-Based Auth Flow](#5-email-based-auth-flow)
6. [Auto-Save Mechanism](#6-auto-save-mechanism)
7. [Submission Lifecycle](#7-submission-lifecycle)
8. [Return Visit Flow](#8-return-visit-flow)
9. [Data Migration](#9-data-migration)
10. [Hosting & Deployment](#10-hosting--deployment)
11. [Security](#11-security)
12. [Dependencies](#12-dependencies)
13. [Acceptance Criteria](#13-acceptance-criteria)

---

## 1. Overview

### Problem

The AgentBuilder app currently stores all user session data in `localStorage` via Zustand's `persist` middleware (key: `ucsd-agentbuilder-session`). A rudimentary auto-save mechanism (`src/hooks/use-auto-save.ts`) debounces writes to the backend, but:

- Users lose data if they clear their browser or switch devices.
- There is no authentication -- the email stored in `localStorage` (key: `ucsd-agentbuilder-email`) is purely cosmetic.
- The existing `submissions` SQLite table stores a flat JSON blob (`session_state TEXT`) with no structure, indexes, or lifecycle tracking.
- The admin dashboard (Section 7 of the brainstorm) has no backend to query against.
- There is no mechanism for magic links, return visits, or submission state transitions.

### Goal

Transition to **server-persisted submissions** while keeping the app fast and offline-capable. Specifically:

1. Every submission is durably stored server-side with structured metadata.
2. Users authenticate via email magic links -- no passwords.
3. Auto-save keeps drafts in sync without user intervention.
4. Submissions have a well-defined lifecycle (Draft through Complete).
5. Users can return via magic link or by entering their email to see all their submissions.
6. The backend supports the admin dashboard's query, filter, and state-transition needs.
7. All database and email operations go through pluggable interfaces so the team can start with SQLite + a simple email provider and swap to Postgres/Supabase and any transactional email service later.

### What Changes

| Layer | Before | After |
|-------|--------|-------|
| **Auth** | Email in localStorage, no verification | Magic link email verification, JWT session tokens |
| **Storage** | localStorage primary, SQLite backup | SQLite/Postgres primary, localStorage as offline cache |
| **Data model** | Single `submissions` table with JSON blob | Normalized tables: `users`, `submissions`, `auth_tokens`, `admin_notes`, `status_history` |
| **Auto-save** | Fire-and-forget PUT to `/api/submissions/:id` | Versioned saves with conflict detection, offline queue |
| **Submission lifecycle** | No states (implicitly "draft" or "submitted") | Draft > Submitted > In Review > Needs Info > Approved > Building > Complete |
| **Return visits** | User must remember to use same browser | Magic link deep-links; email lookup shows all submissions |
| **Admin support** | None | Filterable list, state transitions, internal notes, batch export |

---

## 2. Architecture Decisions

### 2.1 Pluggable Database Layer

All database access goes through a `DatabaseAdapter` interface. Two implementations ship:

- **`SqliteAdapter`** -- wraps the existing `better-sqlite3` setup. Default for local dev and small deployments.
- **`PostgresAdapter`** -- uses `pg` or `postgres` (the npm package). For production deployments that need concurrent writes or horizontal scaling.

The active adapter is selected via the `DB_ADAPTER` environment variable (`sqlite` | `postgres`).

### 2.2 Pluggable Email Provider

All email sending goes through an `EmailProvider` interface. The active provider is selected via `EMAIL_PROVIDER` environment variable.

- **`ResendProvider`** -- recommended default. Resend has a generous free tier (100 emails/day), a clean API, and good deliverability.
- **`SmtpProvider`** -- for UCSD SMTP relay or any standard SMTP server.
- **`ConsoleProvider`** -- logs emails to stdout. For local development and testing.

### 2.3 Session Management

JWT tokens stored in `httpOnly` cookies. No refresh tokens -- magic links are the re-auth mechanism when tokens expire. Token lifetime: 30 days (configurable).

### 2.4 Offline-First Client

The client continues to use Zustand + localStorage as a write-ahead cache. When the server is unreachable, changes queue locally and sync when connectivity returns. The server is the source of truth; localStorage is a convenience layer.

---

## 3. Database Layer

### 3.1 DatabaseAdapter Interface

```typescript
// server/src/lib/db-adapter.ts

export interface DatabaseAdapter {
  // Users
  upsertUser(email: string): Promise<UserRow>;
  getUserByEmail(email: string): Promise<UserRow | null>;
  getUserById(id: string): Promise<UserRow | null>;

  // Auth tokens
  createAuthToken(token: AuthTokenRow): Promise<void>;
  getAuthToken(token: string): Promise<AuthTokenRow | null>;
  consumeAuthToken(token: string): Promise<AuthTokenRow | null>;
  deleteExpiredTokens(): Promise<number>;

  // Submissions
  createSubmission(sub: CreateSubmissionInput): Promise<SubmissionRow>;
  getSubmission(id: string): Promise<SubmissionRow | null>;
  updateSubmission(id: string, fields: UpdateSubmissionInput): Promise<SubmissionRow | null>;
  listSubmissions(filters: SubmissionFilters): Promise<PaginatedResult<SubmissionListItem>>;
  deleteSubmission(id: string): Promise<void>;

  // Status history
  addStatusChange(entry: StatusHistoryEntry): Promise<void>;
  getStatusHistory(submissionId: string): Promise<StatusHistoryEntry[]>;

  // Admin notes
  addAdminNote(note: CreateAdminNoteInput): Promise<AdminNoteRow>;
  getAdminNotes(submissionId: string): Promise<AdminNoteRow[]>;

  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}
```

### 3.2 Schema: `users`

Stores verified email addresses. One row per unique email.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` (UUID) | `PRIMARY KEY` | Auto-generated UUID v4 |
| `email` | `TEXT` | `UNIQUE NOT NULL` | Lowercase, trimmed email |
| `display_name` | `TEXT` | `DEFAULT ''` | Optional display name |
| `role` | `TEXT` | `NOT NULL DEFAULT 'user'` | `'user'` or `'admin'` |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | First verification time |
| `last_login_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | Most recent magic link use |

**Indexes:**
- `idx_users_email` on `email` (implicit via UNIQUE)

**SQLite DDL:**

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Postgres DDL:**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 Schema: `auth_tokens`

Stores magic link tokens and JWT session tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `token` | `TEXT` | `PRIMARY KEY` | The token value (magic link: 64-char hex; JWT: the jti claim) |
| `user_id` | `TEXT` | `NOT NULL REFERENCES users(id)` | Owner |
| `type` | `TEXT` | `NOT NULL` | `'magic_link'` or `'session'` |
| `expires_at` | `TEXT` (ISO 8601) | `NOT NULL` | Expiration timestamp |
| `consumed_at` | `TEXT` (ISO 8601) | `NULL` | When the magic link was used (NULL = unused) |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | Creation time |

**Indexes:**
- `idx_auth_tokens_user_id` on `user_id`
- `idx_auth_tokens_expires` on `expires_at` (for cleanup job)

**SQLite DDL:**

```sql
CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('magic_link', 'session')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
```

### 3.4 Schema: `submissions`

Replaces the existing single-table schema. The `session_state` JSON blob is retained for full Zustand snapshot storage, but structured metadata is extracted into indexed columns for querying.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` (UUID) | `PRIMARY KEY` | Matches `sessionId` from Zustand store |
| `user_id` | `TEXT` | `NOT NULL REFERENCES users(id)` | Owning user |
| `title` | `TEXT` | `NOT NULL DEFAULT ''` | From `projectIdea.title` |
| `description` | `TEXT` | `NOT NULL DEFAULT ''` | From `projectIdea.description` |
| `status` | `TEXT` | `NOT NULL DEFAULT 'draft'` | Lifecycle state (see Section 7) |
| `protection_level` | `TEXT` | `NULL` | `P1`-`P4`, extracted from gather stage |
| `domain` | `TEXT` | `NOT NULL DEFAULT ''` | From `projectIdea.domain` |
| `vc_area` | `TEXT` | `NOT NULL DEFAULT ''` | VC area when we add that field (Section 1d of brainstorm) |
| `completeness_pct` | `INTEGER` | `NOT NULL DEFAULT 0` | 0-100, calculated server-side |
| `output_formats` | `TEXT` | `NOT NULL DEFAULT '[]'` | JSON array of selected output format strings |
| `session_state` | `TEXT` | `NOT NULL` | Full Zustand snapshot JSON |
| `version` | `INTEGER` | `NOT NULL DEFAULT 1` | Monotonically increasing, for conflict detection |
| `assigned_to` | `TEXT` | `NULL REFERENCES users(id)` | Admin assigned to review |
| `submitted_at` | `TEXT` (ISO 8601) | `NULL` | When user clicked "Submit" |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | First save |
| `updated_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | Last save |

**Indexes:**
- `idx_submissions_user_id` on `user_id`
- `idx_submissions_status` on `status`
- `idx_submissions_protection_level` on `protection_level`
- `idx_submissions_domain` on `domain`
- `idx_submissions_updated` on `updated_at DESC`
- `idx_submissions_completeness` on `completeness_pct`

**SQLite DDL:**

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','in_review','needs_info','approved','building','complete','archived')),
  protection_level TEXT CHECK (protection_level IN ('P1','P2','P3','P4')),
  domain TEXT NOT NULL DEFAULT '',
  vc_area TEXT NOT NULL DEFAULT '',
  completeness_pct INTEGER NOT NULL DEFAULT 0,
  output_formats TEXT NOT NULL DEFAULT '[]',
  session_state TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_protection_level ON submissions(protection_level);
CREATE INDEX IF NOT EXISTS idx_submissions_domain ON submissions(domain);
CREATE INDEX IF NOT EXISTS idx_submissions_updated ON submissions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_completeness ON submissions(completeness_pct);
```

### 3.5 Schema: `status_history`

Audit trail for every status transition.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` (UUID) | `PRIMARY KEY` | Auto-generated |
| `submission_id` | `TEXT` | `NOT NULL REFERENCES submissions(id) ON DELETE CASCADE` | |
| `from_status` | `TEXT` | `NOT NULL` | Previous status |
| `to_status` | `TEXT` | `NOT NULL` | New status |
| `changed_by` | `TEXT` | `NOT NULL REFERENCES users(id)` | User or admin who triggered it |
| `reason` | `TEXT` | `NOT NULL DEFAULT ''` | Optional explanation |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | When the transition happened |

**Indexes:**
- `idx_status_history_submission` on `submission_id`
- `idx_status_history_created` on `created_at DESC`

### 3.6 Schema: `admin_notes`

Internal notes visible only to admins. Never exposed to the submitting user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` (UUID) | `PRIMARY KEY` | Auto-generated |
| `submission_id` | `TEXT` | `NOT NULL REFERENCES submissions(id) ON DELETE CASCADE` | |
| `author_id` | `TEXT` | `NOT NULL REFERENCES users(id)` | Admin who wrote the note |
| `content` | `TEXT` | `NOT NULL` | Markdown content |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_admin_notes_submission` on `submission_id`

### 3.7 Schema: `gap_analysis_responses`

Persists gap analysis results separately from the session state blob so they can be queried independently (e.g., "show me all submissions with snoozed critical questions").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` (UUID) | `PRIMARY KEY` | Auto-generated |
| `submission_id` | `TEXT` | `NOT NULL REFERENCES submissions(id) ON DELETE CASCADE` | |
| `run_number` | `INTEGER` | `NOT NULL` | 1-indexed run count |
| `overall_assessment` | `TEXT` | `NOT NULL DEFAULT ''` | LLM assessment text |
| `questions` | `TEXT` | `NOT NULL` | JSON array of `GapQuestion` objects |
| `reclassification` | `TEXT` | `NULL` | JSON of `Reclassification` object or NULL |
| `created_at` | `TEXT` (ISO 8601) | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_gap_responses_submission` on `submission_id`

**Unique constraint:** `(submission_id, run_number)`

### 3.8 Completeness Calculation

The `completeness_pct` column is calculated server-side when a submission is saved. The algorithm:

```typescript
// server/src/lib/completeness.ts

interface CompletenessWeights {
  projectIdea: 20;        // title + description + domain + timeline
  gatherStage: 20;        // stage complete + details filled
  refineStage: 20;        // stage complete + refinements described
  presentStage: 15;       // stage complete + outputs selected
  gapAnalysis: 15;        // critical questions answered (not snoozed)
  detailFields: 10;       // optional enrichment fields filled
}

export function calculateCompleteness(sessionState: SessionSnapshot): number {
  let score = 0;

  // projectIdea: 20 points
  const pi = sessionState.projectIdea;
  if (pi) {
    if (pi.title) score += 5;
    if (pi.description) score += 5;
    if (pi.domain) score += 4;
    if (pi.timeline) score += 3;
    if (pi.currentProcess) score += 3;
  }

  // gatherStage: 20 points
  const gather = sessionState.stages?.GATHER;
  if (gather?.status === 'complete') score += 10;
  const gd = sessionState.gatherDetails;
  if (gd) {
    if (gd.dataType?.length > 0) score += 4;
    if (gd.sourceSystem) score += 3;
    if (gd.dataSize) score += 3;
  }

  // refineStage: 20 points
  const refine = sessionState.stages?.REFINE;
  if (refine?.status === 'complete') score += 10;
  const rd = sessionState.refineDetails;
  if (rd?.refinements?.length > 0) score += 10;

  // presentStage: 15 points
  const present = sessionState.stages?.PRESENT;
  if (present?.status === 'complete') score += 10;
  const pd = sessionState.presentDetails;
  if (pd?.outputs?.length > 0) score += 5;

  // gapAnalysis: 15 points
  const ga = sessionState.gapAnalysis;
  if (ga?.status === 'ready' && ga.questions.length > 0) {
    const critical = ga.questions.filter(q => q.priority === 'critical');
    const answeredCritical = critical.filter(q => q.status === 'answered');
    if (critical.length > 0) {
      score += Math.round(15 * (answeredCritical.length / critical.length));
    } else {
      score += 15; // no critical questions = full marks
    }
  }

  // detailFields: 10 points
  if (pi?.existingStatus) score += 2;
  if (pi?.projectGoal) score += 2;
  if (pi?.projectComplexity) score += 2;
  if (pi?.preferredTool) score += 2;
  if (gd?.regulatoryContext?.length > 0) score += 2;

  return Math.min(100, score);
}
```

### 3.9 Migration Strategy for Existing `submissions` Table

The existing `submissions` table in `server/data/agentbuilder.db` has this schema:

```sql
-- CURRENT (to be replaced)
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  session_state TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

A migration script runs once at startup (idempotent):

```typescript
// server/src/lib/migrations.ts

export async function migrateV1toV2(adapter: DatabaseAdapter): Promise<void> {
  // 1. Read all rows from old submissions table
  // 2. For each unique email, create a user row
  // 3. For each submission, create a row in the new submissions table
  //    with user_id linking to the user, and structured metadata
  //    extracted from session_state JSON
  // 4. Rename old table to submissions_v1_backup
  // 5. Create new table with full schema
}
```

The migration is wrapped in a transaction and is safe to re-run (checks for the existence of `submissions_v1_backup` before running).

---

## 4. API Endpoints

### 4.1 Conventions

**Base path:** `/api`

**Auth header:** Most endpoints require a valid JWT. The token is sent as an `httpOnly` cookie named `ab_session`. Endpoints marked `[auth: none]` are public. Endpoints marked `[auth: admin]` require `role = 'admin'` on the user.

**Error response format (all endpoints):**

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "retryable": false
}
```

**Error codes:**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request body failed Zod validation |
| `UNAUTHORIZED` | 401 | Missing or expired JWT |
| `FORBIDDEN` | 403 | Valid JWT but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Version conflict on save |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `LLM_ERROR` | 502 | OpenAI API call failed |

**Pagination (list endpoints):**

Query parameters: `page` (1-indexed, default 1), `per_page` (default 20, max 100).

Response wrapper:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

### 4.2 Auth Endpoints

#### `POST /api/auth/magic-link`

**Auth:** none

Sends a magic link email. If the email is not yet in the `users` table, creates a new user.

**Request body:**

```json
{
  "email": "user@ucsd.edu"
}
```

**Validation (Zod):**

```typescript
const magicLinkSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
});
```

**Logic:**

1. Upsert user row (create if new, update `last_login_at` if existing).
2. Generate a cryptographically random 64-character hex token (`crypto.randomBytes(32).toString('hex')`).
3. Store in `auth_tokens` with `type = 'magic_link'`, `expires_at = now + 15 minutes`.
4. Rate limit: max 5 magic link requests per email per hour.
5. Send email via the `EmailProvider` interface (see Section 5).

**Response (200):**

```json
{
  "success": true,
  "message": "Check your email for a sign-in link."
}
```

The response is always 200 whether the email exists or not (prevents email enumeration).

**Rate limit:** 5 requests per email per hour. 20 requests per IP per hour.

---

#### `GET /api/auth/verify?token=<token>&redirect=<path>`

**Auth:** none

Verifies a magic link token and sets a session cookie.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | The 64-char hex token from the email |
| `redirect` | string | no | Path to redirect to after verification (default `/`) |

**Logic:**

1. Look up token in `auth_tokens` where `type = 'magic_link'` and `consumed_at IS NULL`.
2. If not found or `expires_at < now`, redirect to `/?error=expired_link`.
3. Mark token as consumed (`consumed_at = now()`).
4. Update user `last_login_at`.
5. Generate a JWT with claims `{ sub: user.id, email: user.email, role: user.role }` and `exp` set to 30 days.
6. Store JWT's `jti` in `auth_tokens` with `type = 'session'` for revocation support.
7. Set `httpOnly`, `secure`, `sameSite=lax` cookie named `ab_session` with the JWT.
8. Redirect to `redirect` param value (validated to be a relative path starting with `/`).

**Response:** 302 redirect with `Set-Cookie` header. No JSON body.

---

#### `POST /api/auth/logout`

**Auth:** required

Invalidates the current session.

**Logic:**

1. Extract the `jti` from the JWT.
2. Delete the corresponding `auth_tokens` row.
3. Clear the `ab_session` cookie.

**Response (200):**

```json
{
  "success": true
}
```

---

#### `GET /api/auth/me`

**Auth:** required

Returns the current authenticated user.

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@ucsd.edu",
    "displayName": "",
    "role": "user",
    "createdAt": "2026-03-17T10:00:00Z",
    "lastLoginAt": "2026-03-17T14:30:00Z"
  }
}
```

**Response (401) if no valid session:**

```json
{
  "error": "Not authenticated",
  "code": "UNAUTHORIZED",
  "retryable": false
}
```

---

### 4.3 Submission Endpoints

#### `POST /api/submissions`

**Auth:** required

Creates a new submission. The client calls this when the user starts a new intake (clicks "Get Started" after entering their email and being verified).

**Request body:**

```json
{
  "sessionId": "client-generated-uuid",
  "title": "",
  "sessionState": { ... }
}
```

**Validation:**

```typescript
const createSubmissionSchema = z.object({
  sessionId: z.string().uuid().optional(), // server generates if not provided
  title: z.string().max(200).default(''),
  sessionState: z.record(z.unknown()),
});
```

**Logic:**

1. Extract `user_id` from JWT.
2. Extract structured metadata from `sessionState` (protection level, domain, output formats).
3. Calculate `completeness_pct`.
4. Insert row with `status = 'draft'`, `version = 1`.
5. Add initial status history entry.

**Response (201):**

```json
{
  "submission": {
    "id": "uuid",
    "status": "draft",
    "version": 1,
    "createdAt": "2026-03-17T10:00:00Z"
  }
}
```

---

#### `PUT /api/submissions/:id`

**Auth:** required (owner or admin)

Updates a submission. This is the auto-save target.

**Request body:**

```json
{
  "title": "My AI Project",
  "sessionState": { ... },
  "expectedVersion": 3
}
```

**Validation:**

```typescript
const updateSubmissionSchema = z.object({
  title: z.string().max(200).optional(),
  sessionState: z.record(z.unknown()).optional(),
  expectedVersion: z.number().int().positive(),
});
```

**Logic:**

1. Verify the caller is the owner (`user_id` matches JWT `sub`) or has `role = 'admin'`.
2. Fetch current row. If `version != expectedVersion`, return 409 CONFLICT.
3. Extract structured metadata from `sessionState`.
4. Recalculate `completeness_pct`.
5. Increment `version`, update `updated_at`.
6. Return the updated row.

**Response (200):**

```json
{
  "submission": {
    "id": "uuid",
    "version": 4,
    "completenessPercent": 65,
    "updatedAt": "2026-03-17T14:35:00Z"
  }
}
```

**Response (409) on version conflict:**

```json
{
  "error": "This submission has been modified since you last loaded it. Reload to get the latest version.",
  "code": "CONFLICT",
  "retryable": false,
  "serverVersion": 4,
  "clientVersion": 3
}
```

---

#### `GET /api/submissions/:id`

**Auth:** required (owner or admin)

Returns a single submission with full session state.

**Response (200):**

```json
{
  "submission": {
    "id": "uuid",
    "userId": "uuid",
    "title": "My AI Project",
    "description": "...",
    "status": "draft",
    "protectionLevel": "P2",
    "domain": "Academic Affairs",
    "vcArea": "",
    "completenessPercent": 65,
    "outputFormats": ["chat", "dashboard"],
    "sessionState": { ... },
    "version": 4,
    "assignedTo": null,
    "submittedAt": null,
    "createdAt": "2026-03-17T10:00:00Z",
    "updatedAt": "2026-03-17T14:35:00Z"
  }
}
```

---

#### `GET /api/submissions`

**Auth:** required

Lists submissions. Regular users see only their own. Admins see all (with filters).

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Results per page (max 100) |
| `status` | string | (all) | Filter by status. Comma-separated for multiple. |
| `protection_level` | string | (all) | Filter by P1-P4. Comma-separated. |
| `domain` | string | (all) | Filter by domain |
| `vc_area` | string | (all) | Filter by VC area |
| `assigned_to` | string (UUID) | (all) | Filter by assigned admin [admin only] |
| `completeness_min` | int | 0 | Minimum completeness % |
| `completeness_max` | int | 100 | Maximum completeness % |
| `sort` | string | `updated_at` | Sort field: `updated_at`, `created_at`, `title`, `completeness_pct`, `status` |
| `order` | string | `desc` | `asc` or `desc` |
| `search` | string | (none) | Full-text search on title and description |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My AI Project",
      "description": "Short description...",
      "status": "draft",
      "protectionLevel": "P2",
      "domain": "Academic Affairs",
      "completenessPercent": 65,
      "outputFormats": ["chat"],
      "createdAt": "2026-03-17T10:00:00Z",
      "updatedAt": "2026-03-17T14:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

Note: The list endpoint does NOT return `sessionState` (it is large). Use `GET /api/submissions/:id` to fetch the full blob.

---

#### `POST /api/submissions/:id/submit`

**Auth:** required (owner only)

Transitions a submission from `draft` or `needs_info` to `submitted`.

**Request body:**

```json
{
  "expectedVersion": 4
}
```

**Logic:**

1. Verify the caller is the owner.
2. Verify current status is `draft` or `needs_info`.
3. Verify version matches.
4. Update status to `submitted`, set `submitted_at = now()`.
5. Add status history entry.
6. Forward to webhook (existing `forwardToWebhook` logic).
7. Send confirmation email to user via `EmailProvider`.

**Response (200):**

```json
{
  "submission": {
    "id": "uuid",
    "status": "submitted",
    "version": 5,
    "submittedAt": "2026-03-17T15:00:00Z"
  }
}
```

---

#### `POST /api/submissions/:id/transition`

**Auth:** required (admin only)

Transitions a submission to any valid next state.

**Request body:**

```json
{
  "toStatus": "in_review",
  "reason": "Beginning review of submission"
}
```

**Validation:**

```typescript
const transitionSchema = z.object({
  toStatus: z.enum([
    'in_review', 'needs_info', 'approved', 'building', 'complete', 'archived'
  ]),
  reason: z.string().max(1000).default(''),
});
```

**Valid transitions (enforced server-side):**

```
draft        -> submitted (user only, via /submit endpoint)
submitted    -> in_review, needs_info, archived (admin)
in_review    -> needs_info, approved, archived (admin)
needs_info   -> submitted (user, via /submit), in_review (admin), archived (admin)
approved     -> building, archived (admin)
building     -> complete, needs_info (admin)
complete     -> archived (admin)
archived     -> in_review (admin, to re-open)
```

**Logic:**

1. Verify the caller has `role = 'admin'`.
2. Validate the transition is allowed from the current status.
3. Update status.
4. Add status history entry with admin's user ID and reason.
5. If transitioning to `needs_info`, send email to the submitter with the reason.
6. If transitioning to `approved`, send congratulatory email to the submitter.

**Response (200):**

```json
{
  "submission": {
    "id": "uuid",
    "status": "in_review",
    "version": 6
  }
}
```

---

#### `DELETE /api/submissions/:id`

**Auth:** required (owner while `draft`, or admin anytime)

Deletes a submission permanently. Owners can only delete drafts. Admins can delete any submission.

**Response (200):**

```json
{
  "success": true
}
```

---

### 4.4 Admin Note Endpoints

#### `POST /api/submissions/:id/notes`

**Auth:** required (admin only)

**Request body:**

```json
{
  "content": "Reached out to submitter for clarification on data sources."
}
```

**Response (201):**

```json
{
  "note": {
    "id": "uuid",
    "submissionId": "uuid",
    "authorId": "uuid",
    "authorEmail": "admin@ucsd.edu",
    "content": "...",
    "createdAt": "2026-03-17T15:30:00Z"
  }
}
```

---

#### `GET /api/submissions/:id/notes`

**Auth:** required (admin only)

**Response (200):**

```json
{
  "notes": [
    {
      "id": "uuid",
      "authorId": "uuid",
      "authorEmail": "admin@ucsd.edu",
      "content": "...",
      "createdAt": "2026-03-17T15:30:00Z"
    }
  ]
}
```

---

#### `GET /api/submissions/:id/history`

**Auth:** required (owner or admin)

Returns the status history for a submission.

**Response (200):**

```json
{
  "history": [
    {
      "id": "uuid",
      "fromStatus": "draft",
      "toStatus": "submitted",
      "changedBy": "uuid",
      "changedByEmail": "user@ucsd.edu",
      "reason": "",
      "createdAt": "2026-03-17T15:00:00Z"
    }
  ]
}
```

---

### 4.5 Gap Analysis Endpoints (Updated)

The existing `POST /api/gap-analysis` and `POST /api/generate-summary` endpoints remain unchanged in their request/response format. However, they gain:

1. **Auth requirement:** Both now require a valid JWT. The `submission_id` is extracted from `intakePayload.sessionId` and verified against the caller's ownership.
2. **Server-side persistence:** After a successful gap analysis call, the server writes the result to `gap_analysis_responses` table.
3. **Rate limit:** 10 gap analysis requests per submission per hour. 5 summary generation requests per submission per hour.

---

### 4.6 Admin Analytics Endpoint

#### `GET /api/admin/analytics`

**Auth:** required (admin only)

Returns aggregate statistics for the admin dashboard.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from` | ISO date | 30 days ago | Start of date range |
| `to` | ISO date | now | End of date range |

**Response (200):**

```json
{
  "overview": {
    "totalSubmissions": 142,
    "totalUsers": 89,
    "avgCompletenessAtSubmit": 78,
    "avgDaysToReview": 2.3
  },
  "byStatus": {
    "draft": 34,
    "submitted": 12,
    "in_review": 8,
    "needs_info": 5,
    "approved": 23,
    "building": 15,
    "complete": 40,
    "archived": 5
  },
  "byProtectionLevel": {
    "P1": 45,
    "P2": 62,
    "P3": 28,
    "P4": 7
  },
  "byDomain": [
    { "domain": "Academic Affairs", "count": 23 },
    { "domain": "Business & Financial Services", "count": 18 }
  ],
  "submissionsOverTime": [
    { "week": "2026-03-10", "count": 7 },
    { "week": "2026-03-17", "count": 4 }
  ]
}
```

---

### 4.7 Admin Batch Export

#### `GET /api/admin/export`

**Auth:** required (admin only)

Exports submissions as CSV.

**Query parameters:** Same filters as `GET /api/submissions` (status, protection_level, domain, etc.), plus:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `csv` | `csv` or `json` |

**Response:** `Content-Type: text/csv` with `Content-Disposition: attachment` header. Or JSON array if `format=json`.

CSV columns: `id, title, email, status, protection_level, domain, vc_area, completeness_pct, output_formats, submitted_at, created_at, updated_at`

---

### 4.8 Health Check (Existing, No Change)

#### `GET /api/health`

**Auth:** none

```json
{
  "status": "ok",
  "timestamp": "2026-03-17T15:00:00Z"
}
```

---

## 5. Email-Based Auth Flow

### 5.1 EmailProvider Interface

```typescript
// server/src/lib/email-provider.ts

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;  // plain-text fallback
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
```

### 5.2 Implementations

#### ConsoleProvider (Development)

```typescript
// server/src/lib/email-providers/console.ts

export class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log('--- EMAIL ---');
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body:\n${message.text}`);
    console.log('--- END EMAIL ---');
    return { success: true, messageId: `console-${Date.now()}` };
  }
}
```

#### ResendProvider (Recommended Production Default)

```typescript
// server/src/lib/email-providers/resend.ts

import { Resend } from 'resend';

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress: string) {
    this.client = new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  async send(message: EmailMessage) {
    try {
      const result = await this.client.emails.send({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { success: true, messageId: result.data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown email error',
      };
    }
  }
}
```

#### SmtpProvider

```typescript
// server/src/lib/email-providers/smtp.ts

import nodemailer from 'nodemailer';

export class SmtpProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
    fromAddress: string;
  }) {
    this.fromAddress = config.fromAddress;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  async send(message: EmailMessage) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown SMTP error',
      };
    }
  }
}
```

### 5.3 Provider Factory

```typescript
// server/src/lib/email-factory.ts

export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  switch (provider) {
    case 'resend':
      return new ResendProvider(
        process.env.RESEND_API_KEY!,
        process.env.EMAIL_FROM || 'AgentBuilder <noreply@yourdomain.com>',
      );
    case 'smtp':
      return new SmtpProvider({
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS!,
        } : undefined,
        fromAddress: process.env.EMAIL_FROM || 'AgentBuilder <noreply@yourdomain.com>',
      });
    case 'console':
    default:
      return new ConsoleProvider();
  }
}
```

### 5.4 Magic Link Flow

```
User enters email on landing page
        |
        v
POST /api/auth/magic-link { email }
        |
        v
Server: upsert user, generate token, send email
        |
        v
User clicks link in email:
  https://your-domain.com/AgentBuilder/api/auth/verify?token=abc123&redirect=/
        |
        v
Server: validate token, set JWT cookie, redirect
        |
        v
Client: GET /api/auth/me -> gets user object, stores in React context
        |
        v
Client: GET /api/submissions -> shows "Continue where you left off" or "Start new"
```

### 5.5 Email Templates

All emails use simple, branded HTML templates. Two templates needed at launch:

**Magic link email:**

```
Subject: Sign in to UCSD AgentBuilder

Hi there,

Click the link below to sign in to AgentBuilder:

[Sign In to AgentBuilder] <- link to /api/auth/verify?token=xxx&redirect=/

This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.

— The UCSD AgentBuilder Team
```

**Status change notification:**

```
Subject: Your AgentBuilder submission "{title}" has been updated

Hi there,

Your submission "{title}" has been moved to: {new_status_friendly_name}

{reason, if provided}

[View Your Submission] <- link with magic link token to deep-link

— The UCSD AgentBuilder Team
```

### 5.6 Session Management Details

**JWT structure:**

```json
{
  "sub": "user-uuid",
  "email": "user@ucsd.edu",
  "role": "user",
  "iat": 1710680400,
  "exp": 1713272400,
  "jti": "unique-token-id"
}
```

**JWT signing:** HMAC-SHA256 with `JWT_SECRET` environment variable (min 32 characters).

**Cookie settings:**

```typescript
{
  name: 'ab_session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
}
```

**"Remember me" behavior:** The 30-day JWT lifetime effectively acts as "remember me." When a JWT expires, the user re-enters their email and gets a new magic link. No separate "remember me" checkbox is needed. The client detects a 401 from `/api/auth/me` and shows the email prompt.

**Token revocation:** When an admin needs to revoke a user's access, they delete the user's session tokens from `auth_tokens`. The middleware checks `auth_tokens` for the JWT's `jti` on every request. If the `jti` is missing, the JWT is rejected even if it has not expired. This adds one DB query per request but enables immediate revocation.

---

## 6. Auto-Save Mechanism

### 6.1 Current State

The existing `use-auto-save.ts` hook:

- Subscribes to the Zustand store.
- Debounces by 2 seconds.
- Fires `PUT /api/submissions/:id` with the full session snapshot.
- Does not handle conflicts, versioning, or offline.

### 6.2 Updated Auto-Save Hook

```typescript
// src/hooks/use-auto-save.ts (revised)

const DEBOUNCE_MS = 2_000;
const MAX_OFFLINE_QUEUE = 50;

interface PendingSave {
  submissionId: string;
  sessionState: Record<string, unknown>;
  title: string;
  expectedVersion: number;
  queuedAt: number;
}

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHashRef = useRef<string>('');
  const versionRef = useRef<number>(1);
  const offlineQueueRef = useRef<PendingSave[]>([]);
  const isSavingRef = useRef(false);

  // Flush offline queue when connectivity returns
  useEffect(() => {
    const handleOnline = () => flushOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    const unsubscribe = useSessionStore.subscribe((state) => {
      const { user } = useAuthContext(); // from new auth context
      if (!user) return;
      if (!state.projectIdea) return;

      const snapshot = state.getSessionSnapshot();
      const hash = fastHash(snapshot);
      if (hash === prevHashRef.current) return;
      prevHashRef.current = hash;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        performSave(state.sessionId, snapshot, state.projectIdea?.title || '');
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function performSave(
    submissionId: string,
    sessionState: Record<string, unknown>,
    title: string,
  ) {
    if (isSavingRef.current) return; // skip if a save is in-flight
    isSavingRef.current = true;

    try {
      const result = await saveSubmission(submissionId, {
        title,
        sessionState,
        expectedVersion: versionRef.current,
      });
      versionRef.current = result.version;
    } catch (err) {
      if (isConflictError(err)) {
        // Another tab saved a newer version. Reload from server.
        await handleConflict(submissionId);
      } else if (!navigator.onLine) {
        enqueueOffline({ submissionId, sessionState, title,
          expectedVersion: versionRef.current, queuedAt: Date.now() });
      }
      // Other errors: log and retry on next change
      console.warn('[auto-save] Failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }
}
```

### 6.3 Conflict Resolution (Two Tabs Open)

**Strategy: last-write-wins with conflict detection.**

Each save includes `expectedVersion`. The server rejects saves where `expectedVersion != current version` with a 409 response.

When the client receives a 409:

1. Fetch the latest submission from `GET /api/submissions/:id`.
2. Compare the server's `sessionState` with the client's localStorage.
3. If the server version is strictly newer (user was active in another tab), replace the local state with the server state. Show a toast: "Your progress was updated from another session."
4. Update `versionRef` to the server's version.
5. Retry the save if the client has additional unsaved changes on top of the merged state.

The rationale for last-write-wins: the Zustand store is a single blob of form answers. There is no concept of "merge fields from two concurrent edits." In practice, a user with two tabs will be typing in one tab at a time, so the most recent save is the correct one. The 409 mechanism prevents a stale tab from silently overwriting a newer tab's changes.

### 6.4 Offline Handling

When `navigator.onLine` is `false`:

1. The auto-save hook queues the save into `offlineQueueRef` (max 50 entries, FIFO -- oldest are dropped).
2. The queue is also persisted to `localStorage` key `ab-offline-queue` so it survives page refreshes.
3. A `useEffect` listens for the `online` event.
4. When connectivity returns, the hook replays the queue in order, using the latest entry per `submissionId` (intermediate saves are discarded).
5. A banner at the top of the page shows "You're offline -- changes are saved locally and will sync when you're back online" using the existing layout components.

### 6.5 Optimistic Updates

All auto-save writes are **optimistic.** The client does not wait for the server to confirm before updating the UI. The Zustand store updates immediately on user interaction. If the save fails, the client retries silently. If the failure is a conflict (409), the client merges as described above.

The one exception is the "Submit" action (`POST /api/submissions/:id/submit`), which is **non-optimistic.** The client shows a loading state and waits for the server to confirm the status transition before updating the UI. This prevents a user from thinking they submitted when the server rejected it.

---

## 7. Submission Lifecycle

### 7.1 States

```
                 +----------+
                 |  draft   | <-- initial state on creation
                 +----+-----+
                      |
                      | user clicks "Submit"
                      v
                 +----------+
            +--->| submitted|
            |    +----+-----+
            |         |
            |         | admin reviews
            |         v
            |    +----------+      +----------+
            |    | in_review+----->|needs_info|
            |    +----+-----+      +-----+----+
            |         |                  |
            |         | admin approves   | user answers, re-submits
            |         v                  |
            |    +----------+            |
            |    | approved |    <-------+  (admin can also move to in_review)
            |    +----+-----+
            |         |
            |         | admin marks building
            |         v
            |    +----------+
            |    | building |
            |    +----+-----+
            |         |
            |         | admin marks complete
            |         v
            |    +----------+
            |    | complete |
            |    +----------+
            |
            |    Any state (admin) --> archived
            |                          archived --> in_review (admin re-open)
            +--- needs_info: user re-submits
```

### 7.2 State Descriptions

| Status | Who sets it | What it means | User sees |
|--------|------------|---------------|-----------|
| `draft` | System (auto) | User is still working on the intake | "In Progress" with a "Continue" button |
| `submitted` | User | User clicked "Submit" | "Submitted -- we'll review it soon" |
| `in_review` | Admin | OSI team is actively reviewing | "Under Review" |
| `needs_info` | Admin | OSI needs more info from user | "Action Needed" with specific questions |
| `approved` | Admin | Project approved for building | "Approved! We're planning your project." |
| `building` | Admin | Active development underway | "In Development" |
| `complete` | Admin | Project delivered | "Complete" |
| `archived` | Admin | Closed (rejected, withdrawn, duplicate) | "Archived" |

### 7.3 Notifications on State Changes

| Transition | Notification to user | Notification to admin |
|------------|--------------------|--------------------|
| draft -> submitted | Confirmation email: "We received your submission" | Webhook to TritonAI (existing); optional Slack/Teams notification |
| submitted -> in_review | Email: "We're reviewing your submission" | (none -- admin initiated it) |
| in_review -> needs_info | Email: "We have a few questions about your submission" with deep link | (none) |
| needs_info -> submitted | (none -- user initiated it) | Email to assigned admin: "User responded to your questions" |
| any -> approved | Email: "Great news! Your project has been approved" | (none) |
| any -> archived | Email: "Your submission has been archived" with reason | (none) |

---

## 8. Return Visit Flow

### 8.1 Landing Page Behavior

The landing page (`src/components/landing/LandingPage.tsx`) checks auth status on mount:

```
Page loads
    |
    +-- GET /api/auth/me
    |
    +-- 401: User not authenticated
    |       |
    |       v
    |   Show standard landing page with email input
    |       |
    |       v
    |   User enters email -> POST /api/auth/magic-link
    |       |
    |       v
    |   "Check your email" message
    |
    +-- 200: User authenticated
            |
            v
        GET /api/submissions (user's submissions)
            |
            +-- No submissions: Show "Start your first project" CTA
            |
            +-- Has draft submissions:
            |       Show "Continue where you left off" card
            |       with title, last updated, completeness %
            |       Plus "Start a new project" secondary CTA
            |
            +-- Has submitted/in-progress submissions:
                    Show submissions list with status badges
                    Plus "Start a new project" secondary CTA
```

### 8.2 Magic Link Deep Linking

Magic links can include a `redirect` parameter that deep-links to a specific submission:

```
https://your-domain.com/AgentBuilder/api/auth/verify
  ?token=abc123
  &redirect=/AgentBuilder/#/stage/GATHER?submission=uuid
```

After the cookie is set, the server redirects to this path. The client-side router picks up the `submission` query parameter and loads that submission's `sessionState` into the Zustand store.

### 8.3 Loading a Submission Into Client State

When the client loads a submission from the server:

```typescript
// src/lib/submission-loader.ts

export async function loadSubmission(submissionId: string): Promise<void> {
  const { submission } = await fetchSubmission(submissionId);

  // Load the server's session state into the Zustand store
  useSessionStore.getState().loadSession(submission.sessionState);

  // Update the version tracker for auto-save conflict detection
  setCurrentVersion(submission.version);

  // Store the submission ID mapping
  setActiveSubmissionId(submission.id);
}
```

### 8.4 Snoozed Gap Analysis Questions

When a user returns:

1. The client loads the submission and its `sessionState` (which includes `gapAnalysis.questions`).
2. Any questions with `status: 'snoozed'` are surfaced in a "You have unanswered questions" banner on the summary page and the gap analysis page.
3. The user can answer or re-snooze.
4. Each time they answer snoozed questions, auto-save persists the updated state.
5. If they answer enough critical questions to change the completeness score, the server recalculates `completeness_pct`.

### 8.5 Export Regeneration

When a user answers snoozed gap analysis questions:

1. The updated gap answers are included in the next `POST /api/generate-summary` call.
2. The AI summary regenerates with the new information.
3. Any previously generated exports (PDF, markdown) are invalidated.
4. The summary page shows "Your answers have changed since the last export. Regenerate?" with a button.

---

## 9. Data Migration

### 9.1 Existing localStorage Data

Users who have been using the app before the backend launches have data in:

- `localStorage['ucsd-agentbuilder-session']` -- full Zustand state (JSON)
- `localStorage['ucsd-agentbuilder-email']` -- email string

**One-time migration flow:**

```
User visits site after backend launch
    |
    +-- GET /api/auth/me -> 401 (no cookie yet)
    |
    +-- Client checks localStorage for existing session
    |
    +-- Has localStorage data?
    |       |
    |       +-- Yes:
    |       |     Show: "Welcome back! We've upgraded AgentBuilder.
    |       |     Enter your email to save your existing progress
    |       |     to your new account."
    |       |     [email input] [Save my progress]
    |       |         |
    |       |         v
    |       |     POST /api/auth/magic-link
    |       |         |
    |       |         v
    |       |     User verifies via magic link
    |       |         |
    |       |         v
    |       |     Client: POST /api/submissions with localStorage sessionState
    |       |         |
    |       |         v
    |       |     Clear localStorage session data (keep email for convenience)
    |       |     Show: "Your progress has been saved! You can now access it
    |       |     from any device."
    |       |
    |       +-- No: Normal new-user flow
```

### 9.2 Existing SQLite Data

The current `server/data/agentbuilder.db` has a `submissions` table with `email` column but no `users` table. The migration script (Section 3.9) handles this:

1. On first startup with the new schema, detect the old table format (no `user_id` column).
2. Create the `users` table.
3. For each unique email in old submissions, create a user row.
4. Create the new `submissions` table with the full schema.
5. Migrate each old submission, linking to the newly created user, extracting structured metadata from the `session_state` JSON blob.
6. Rename the old table to `submissions_v1_backup`.

This migration is **idempotent** -- if `submissions_v1_backup` already exists, skip.

### 9.3 Version Tracking

The database schema version is tracked in a `schema_meta` table:

```sql
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- On fresh install:
INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '2');
```

Each migration checks the current `schema_version` and only runs if it is behind the expected version. After completion, it updates `schema_version`.

---

## 10. Hosting & Deployment

### 10.1 Current State

- **Frontend:** Built with Vite, deployed to GitHub Pages as static files. Base path `/AgentBuilder/`. Uses `HashRouter` because GitHub Pages does not support SPA fallback.
- **Backend:** Hono server on port 3001. In development, Vite proxies `/api` to `localhost:3001`. In production, the Hono server can serve the static files directly.
- **Database:** SQLite file at `server/data/agentbuilder.db`.
- **CI/CD:** GitHub Actions builds on push to `main`/`master`/`claude/**`. Deploys to Pages from `main`/`master` only.

### 10.2 What Changes

GitHub Pages can only serve static files -- it cannot run the Hono backend. With the backend becoming essential (auth, persistence, LLM proxy), the deployment must change. Two options:

**Option A: Single-server deployment (recommended for starting)**

The Hono server serves both the API and the built frontend static files (it already has this capability in `production` mode). Deploy the entire thing to a single server or container.

```
[Browser] --HTTPS--> [Reverse Proxy (nginx/caddy)] --HTTP--> [Hono server :3001]
                                                                   |
                                                            [SQLite file]
```

**Option B: Split deployment**

Frontend on a CDN (Vercel, Netlify, Cloudflare Pages) with the backend on a separate server. This requires CORS configuration and means two deployments to coordinate.

```
[Browser] --HTTPS--> [CDN: static files]
     |
     +----HTTPS--> [API server] ---> [Database]
```

### 10.3 Deployment Recommendations

| Platform | Pros | Cons | Cost |
|----------|------|------|------|
| **UCSD Server / VM** | Full control, data stays on campus, no vendor dependency | Manual setup, patching, monitoring | Free (internal) |
| **Railway** | Git-push deploys, managed infra, persistent volumes for SQLite | Vendor lock-in, data off-campus | Free tier available, ~$5/mo for hobby |
| **Render** | Similar to Railway, free tier with auto-sleep | Cold starts on free tier | Free or $7/mo |
| **Fly.io** | Edge deployment, persistent volumes, Docker-based | More complex setup | Free tier, ~$5/mo |
| **Docker on any VM** | Portable, same setup everywhere | Need to manage the VM | Varies |

For UCSD compliance with UC data classification, a **UCSD-hosted server or VM** is the strongest choice because the data never leaves campus infrastructure. If using a cloud platform, verify that the vendor's data handling meets UC P2 requirements (the tool itself handles P1-P4 classification labels but the submission data -- emails, project descriptions -- is at least P2).

### 10.4 Docker Setup

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Build frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Build backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# SQLite data volume
VOLUME /app/server/data

CMD ["node", "server/dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  agentbuilder:
    build: .
    ports:
      - '3001:3001'
    volumes:
      - db-data:/app/server/data
    env_file:
      - .env
    restart: unless-stopped

volumes:
  db-data:
```

### 10.5 CORS Configuration

When frontend and backend are on the same origin (Option A), no CORS configuration is needed.

When split (Option B), set `CORS_ORIGIN` to the frontend's origin:

```env
CORS_ORIGIN=https://your-frontend-domain.com
```

The existing CORS middleware in `server/src/index.ts` already reads this variable. Update it to also allow credentials (for cookies):

```typescript
app.use(
  '/api/*',
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true, // <-- ADD THIS for cookie-based auth
  })
);
```

And on the client, all `fetch` calls must include `credentials: 'include'`:

```typescript
// Update apiFetch, apiGet, apiPut in src/lib/api-client.ts
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  credentials: 'include', // <-- ADD THIS
  signal,
});
```

### 10.6 Environment Variables

Full list of environment variables after this spec is implemented:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | yes | -- | OpenAI API key for LLM calls |
| `OPENAI_MODEL` | no | `gpt-5.2` | OpenAI model name |
| `PORT` | no | `3001` | Server port |
| `NODE_ENV` | no | `development` | `development` or `production` |
| `CORS_ORIGIN` | no | `*` | Allowed origin for CORS |
| `WEBHOOK_URL` | no | -- | TritonAI webhook URL |
| `JWT_SECRET` | yes (prod) | -- | HMAC-SHA256 secret for JWT signing (min 32 chars) |
| `DB_ADAPTER` | no | `sqlite` | `sqlite` or `postgres` |
| `DATABASE_URL` | if postgres | -- | Postgres connection string |
| `SQLITE_PATH` | no | `./data/agentbuilder.db` | Path to SQLite file |
| `EMAIL_PROVIDER` | no | `console` | `console`, `resend`, or `smtp` |
| `EMAIL_FROM` | no | `AgentBuilder <noreply@example.com>` | Sender address |
| `RESEND_API_KEY` | if resend | -- | Resend API key |
| `SMTP_HOST` | if smtp | -- | SMTP server host |
| `SMTP_PORT` | if smtp | `587` | SMTP port |
| `SMTP_SECURE` | if smtp | `false` | Use TLS |
| `SMTP_USER` | if smtp | -- | SMTP username |
| `SMTP_PASS` | if smtp | -- | SMTP password |
| `APP_URL` | yes (prod) | `http://localhost:5173` | Public URL of the app (for magic link URLs) |
| `MAGIC_LINK_EXPIRY_MINUTES` | no | `15` | Magic link token lifetime |
| `JWT_EXPIRY_DAYS` | no | `30` | JWT session token lifetime |
| `RATE_LIMIT_MAGIC_LINK_PER_EMAIL` | no | `5` | Max magic link requests per email per hour |
| `RATE_LIMIT_MAGIC_LINK_PER_IP` | no | `20` | Max magic link requests per IP per hour |

### 10.7 Updated GitHub Actions

The CI workflow needs to change since GitHub Pages can no longer serve the full app. The build step remains for type-checking and linting. The deploy step changes based on the chosen hosting platform. Here is an example for a Docker-based deployment:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main, master, 'claude/**']
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: cd server && npm ci && npm run build

  # Add deployment job based on chosen platform
  # Example for Docker registry push:
  # docker:
  #   needs: build
  #   if: github.ref == 'refs/heads/main'
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - run: docker build -t agentbuilder .
  #     - run: docker push your-registry/agentbuilder:latest
```

---

## 11. Security

### 11.1 Authentication & Authorization

- **Magic links:** Cryptographically random, 64-character hex tokens (256 bits of entropy). Single-use. 15-minute expiry.
- **JWTs:** HMAC-SHA256 signed. 30-day expiry. Revocable via `auth_tokens` table lookup.
- **Role enforcement:** Every endpoint handler checks `req.user.role` before proceeding. The auth middleware populates `req.user` from the JWT.
- **Ownership enforcement:** Submission endpoints verify `submission.user_id === req.user.id` for non-admin users.

### 11.2 Auth Middleware

```typescript
// server/src/middleware/auth.ts

import { verify } from 'jsonwebtoken';

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const cookie = getCookie(c, 'ab_session');
    if (!cookie) {
      return c.json({ error: 'Not authenticated', code: 'UNAUTHORIZED', retryable: false }, 401);
    }

    try {
      const payload = verify(cookie, process.env.JWT_SECRET!) as JwtPayload;

      // Check token hasn't been revoked
      const tokenRow = await db.getAuthToken(payload.jti);
      if (!tokenRow || tokenRow.type !== 'session') {
        return c.json({ error: 'Session expired', code: 'UNAUTHORIZED', retryable: false }, 401);
      }

      c.set('user', {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      await next();
    } catch {
      return c.json({ error: 'Invalid session', code: 'UNAUTHORIZED', retryable: false }, 401);
    }
  };
}

export function adminMiddleware() {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (user?.role !== 'admin') {
      return c.json({ error: 'Admin access required', code: 'FORBIDDEN', retryable: false }, 403);
    }
    await next();
  };
}
```

### 11.3 Rate Limiting

Rate limiting is implemented as Hono middleware using an in-memory sliding window counter. For production deployments behind a load balancer, replace with Redis-backed rate limiting.

| Endpoint Pattern | Limit | Window | Key |
|-----------------|-------|--------|-----|
| `POST /api/auth/magic-link` | 5 | 1 hour | email |
| `POST /api/auth/magic-link` | 20 | 1 hour | IP |
| `PUT /api/submissions/:id` | 60 | 1 minute | user ID |
| `POST /api/gap-analysis` | 10 | 1 hour | submission ID |
| `POST /api/generate-summary` | 5 | 1 hour | submission ID |
| `POST /api/submissions/:id/submit` | 3 | 1 hour | submission ID |
| All other authenticated endpoints | 120 | 1 minute | user ID |

**Rate limit response:**

```json
{
  "error": "Too many requests. Please try again in 42 seconds.",
  "code": "RATE_LIMITED",
  "retryable": true,
  "retryAfter": 42
}
```

Also set `Retry-After` header.

### 11.4 Input Validation

All request bodies are validated with Zod schemas before any processing:

- String fields have `max()` length constraints.
- Email fields use `z.string().email()`.
- Enum fields use `z.enum()`.
- The `sessionState` field is validated as `z.record(z.unknown())` (accepts any JSON object) but has a maximum serialized size of **2 MB** enforced via Hono's body size limit.
- SQL injection is not a concern because `better-sqlite3` uses parameterized statements and Postgres adapters use parameterized queries.

**Body size limit:**

```typescript
// In server/src/index.ts
app.use('/api/*', async (c, next) => {
  const contentLength = parseInt(c.req.header('content-length') || '0');
  if (contentLength > 2 * 1024 * 1024) { // 2 MB
    return c.json({
      error: 'Request body too large (max 2MB)',
      code: 'VALIDATION_ERROR',
      retryable: false,
    }, 413);
  }
  await next();
});
```

### 11.5 Data at Rest

- **SQLite:** The database file is not encrypted by default. For UCSD deployments, the file should reside on an encrypted filesystem (standard on modern Linux and macOS). For additional protection, consider SQLCipher (drop-in replacement for SQLite with AES-256 encryption). This is an operational concern, not a code change.
- **Postgres:** Use SSL connections (`?sslmode=require` in connection string). Cloud Postgres services (Supabase, RDS, Cloud SQL) encrypt at rest by default.

### 11.6 PII Handling

The system stores the following PII:

| Data | Where stored | Classification |
|------|-------------|----------------|
| Email addresses | `users.email` | P2 (Internal) |
| Project descriptions | `submissions.description`, `submissions.session_state` | P2 (Internal) -- may reference P3/P4 data by name but does not contain the actual data |
| IP addresses | Not stored (only used for rate limiting in memory) | -- |

**Retention policy (to implement):**

- Draft submissions untouched for 90 days: auto-archive and send a "Did you mean to continue?" email.
- Archived submissions older than 2 years: delete `session_state` blob, retain metadata for analytics.
- Auth tokens past expiry: cleaned up by a daily scheduled task.

### 11.7 UC Data Classification Compliance

The AgentBuilder tool itself handles P1-P4 classification *labels* -- it helps users determine which protection level applies to their data. The tool does **not** ingest, store, or process the user's actual institutional data (student records, financial data, health records, etc.). It only stores the user's *description* of their project and data.

Therefore, the AgentBuilder backend's own data classification is **P2 (Internal)**:

- It contains UCSD staff email addresses.
- It contains internal project descriptions.
- It does not contain student records (FERPA), health records (HIPAA), or restricted data (P3/P4).

Operational requirements for P2:

- Access restricted to authorized users (handled by JWT auth).
- Data encrypted in transit (HTTPS required in production).
- Data at rest on encrypted storage (operational requirement).
- Logging of access for audit purposes (status history table serves this purpose).

---

## 12. Dependencies

### 12.1 What This Spec Depends On

| Dependency | Status | Notes |
|-----------|--------|-------|
| Existing Hono server (`server/`) | Complete | Already running with SQLite, gap analysis, summary generation |
| Zustand store with `loadSession` / `getSessionSnapshot` | Complete | Already implemented in `session-store.ts` |
| Existing auto-save hook | Complete | Will be refactored per Section 6 |
| Existing API client | Complete | Will be extended with auth and versioning |
| Gap analysis backend | Complete | Will add auth and persistence |

### 12.2 What Depends On This Spec

| Dependent Feature | Brainstorm Section | How it uses this spec |
|------------------|-------------------|----------------------|
| Admin Dashboard | Section 7 | Queries submissions table; uses admin auth, notes, transitions, analytics endpoints |
| Gap Analysis persistence | Section 2 | Snoozed questions persist across sessions via `gap_analysis_responses` table |
| Two-Summary System | Section 4 | Export regeneration on return visits |
| Collaboration Features | Section 11 (future) | Multi-user access to a submission builds on the user/submission ownership model |

### 12.3 New npm Dependencies

**Server:**

| Package | Version | Purpose |
|---------|---------|---------|
| `jsonwebtoken` | `^9.x` | JWT signing and verification |
| `@types/jsonwebtoken` | `^9.x` | TypeScript types |
| `resend` | `^4.x` | Email provider (optional, only if using Resend) |
| `nodemailer` | `^6.x` | SMTP email provider (optional, only if using SMTP) |
| `@types/nodemailer` | `^6.x` | TypeScript types |
| `pg` | `^8.x` | Postgres adapter (optional, only if using Postgres) |
| `@types/pg` | `^8.x` | TypeScript types |

**Client:**

No new npm dependencies. The auth state is managed via React context and the existing `fetch`-based API client.

---

## 13. Acceptance Criteria

### 13.1 Auth & Identity

- [ ] User can enter their email on the landing page and receive a magic link within 30 seconds.
- [ ] Clicking the magic link in a new browser tab sets a session cookie and redirects to the app.
- [ ] The magic link expires after 15 minutes and shows a clear "expired" message if used late.
- [ ] A magic link can only be used once. Second click shows "already used" message.
- [ ] `GET /api/auth/me` returns the user object when authenticated.
- [ ] `GET /api/auth/me` returns 401 when the cookie is missing or expired.
- [ ] Rate limiting prevents more than 5 magic link requests per email per hour.
- [ ] Admin users (role = `admin`) can access admin-only endpoints.
- [ ] Regular users receive 403 when attempting to access admin endpoints.

### 13.2 Submission CRUD

- [ ] A new submission is created via `POST /api/submissions` and returns an ID and version.
- [ ] `PUT /api/submissions/:id` updates the submission and increments the version.
- [ ] `PUT /api/submissions/:id` with a stale `expectedVersion` returns 409.
- [ ] `GET /api/submissions` returns only the current user's submissions (paginated).
- [ ] `GET /api/submissions` for admins returns all submissions with full filter support.
- [ ] `GET /api/submissions/:id` returns the full session state blob.
- [ ] Owners can delete draft submissions. Admins can delete any submission.
- [ ] Non-owners receive 403 when accessing another user's submission.

### 13.3 Auto-Save

- [ ] Changes to the Zustand store are auto-saved to the server within 2 seconds of the last change.
- [ ] Rapid changes within the 2-second window are debounced into a single save.
- [ ] Opening two tabs does not cause data loss -- the second tab's save is rejected with 409, then it reloads from the server.
- [ ] When offline, changes are queued locally and synced when connectivity returns.
- [ ] An "offline" banner is shown when the network is unavailable.
- [ ] The "Submit" action waits for server confirmation before updating the UI.

### 13.4 Submission Lifecycle

- [ ] A draft can be submitted by the owner.
- [ ] An admin can transition submitted -> in_review -> approved -> building -> complete.
- [ ] An admin can send a submission back to `needs_info` with a reason.
- [ ] The user receives an email when their submission status changes.
- [ ] Status history is recorded for every transition with timestamp and actor.
- [ ] Invalid transitions are rejected with a clear error message.

### 13.5 Return Visits

- [ ] A returning authenticated user sees their submissions on the landing page.
- [ ] Clicking "Continue" on a draft loads the session state into the Zustand store.
- [ ] Snoozed gap analysis questions appear when the user returns.
- [ ] Magic link emails can deep-link to a specific submission.

### 13.6 Data Migration

- [ ] Existing localStorage data is migrated to the server on first authenticated visit.
- [ ] Existing SQLite submissions (old schema) are migrated to the new schema on server startup.
- [ ] Migration is idempotent -- running it twice does not duplicate data.

### 13.7 Admin Support

- [ ] Admins can view all submissions with filter, sort, and pagination.
- [ ] Admins can leave internal notes on submissions (not visible to users).
- [ ] Admins can export filtered submissions as CSV.
- [ ] The analytics endpoint returns aggregate statistics.

### 13.8 Security

- [ ] JWTs are signed with HMAC-SHA256 and verified on every authenticated request.
- [ ] Cookies are `httpOnly`, `secure` (in production), and `sameSite=lax`.
- [ ] Token revocation works immediately (admin deletes token, next request is rejected).
- [ ] Request bodies larger than 2 MB are rejected.
- [ ] All request bodies are validated with Zod before processing.
- [ ] Error responses never leak stack traces or internal details in production.

### 13.9 Pluggability

- [ ] Switching from SQLite to Postgres requires only changing `DB_ADAPTER` and `DATABASE_URL` environment variables (plus running the Postgres DDL).
- [ ] Switching email providers requires only changing `EMAIL_PROVIDER` and the relevant credentials.
- [ ] The `ConsoleProvider` works for local development without any email service configured.

---

## Appendix A: File Structure After Implementation

```
server/
  src/
    index.ts                          # Hono app setup (updated)
    middleware/
      auth.ts                         # JWT auth middleware
      admin.ts                        # Admin role middleware
      rate-limit.ts                   # Rate limiting middleware
      body-limit.ts                   # Request body size limit
    routes/
      auth.ts                         # Magic link + verify + logout + me
      submissions.ts                  # CRUD + submit + transition (updated)
      gap-analysis.ts                 # (updated with auth)
      summary.ts                      # (updated with auth)
      submit.ts                       # (may merge into submissions.ts)
      admin.ts                        # Analytics, export, notes
    lib/
      db-adapter.ts                   # DatabaseAdapter interface
      db-adapters/
        sqlite.ts                     # SqliteAdapter implementation
        postgres.ts                   # PostgresAdapter implementation
      db-factory.ts                   # createDatabaseAdapter()
      email-provider.ts               # EmailProvider interface
      email-providers/
        console.ts                    # ConsoleProvider
        resend.ts                     # ResendProvider
        smtp.ts                       # SmtpProvider
      email-factory.ts                # createEmailProvider()
      email-templates.ts              # HTML email template builders
      completeness.ts                 # calculateCompleteness()
      migrations.ts                   # Schema migrations
      jwt.ts                          # JWT sign/verify helpers
      webhook.ts                      # (existing, no change)
    llm/
      client.ts                       # (existing, no change)
      prompts.ts                      # (existing, no change)
      schemas.ts                      # (existing, no change)
      examples.ts                     # (existing, no change)

src/
  lib/
    api-client.ts                     # (updated: credentials, auth endpoints, versioning)
    submission-loader.ts              # Load server submission into Zustand
  hooks/
    use-auto-save.ts                  # (rewritten per Section 6)
    use-auth.ts                       # Auth context hook (replaces use-user-email.ts)
    use-submissions.ts                # (updated: uses auth, pagination)
  components/
    auth/
      AuthProvider.tsx                # React context for auth state
      EmailPrompt.tsx                 # Email input for magic link
      MagicLinkSent.tsx               # "Check your email" confirmation
    landing/
      LandingPage.tsx                 # (updated: auth-aware, shows submissions)
      SubmissionsList.tsx             # (updated: uses server data)
```

## Appendix B: Environment File Template

```env
# === Required ===
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key-at-least-32-characters-long

# === Server ===
PORT=3001
NODE_ENV=development
APP_URL=http://localhost:5173/AgentBuilder

# === Database ===
DB_ADAPTER=sqlite
SQLITE_PATH=./data/agentbuilder.db
# DATABASE_URL=postgres://user:pass@host:5432/agentbuilder  # if DB_ADAPTER=postgres

# === Email ===
EMAIL_PROVIDER=console
EMAIL_FROM=AgentBuilder <noreply@yourdomain.com>
# RESEND_API_KEY=re_...          # if EMAIL_PROVIDER=resend
# SMTP_HOST=smtp.ucsd.edu        # if EMAIL_PROVIDER=smtp
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=

# === External ===
CORS_ORIGIN=http://localhost:5173
WEBHOOK_URL=
OPENAI_MODEL=gpt-5.2

# === Tuning (all optional) ===
# MAGIC_LINK_EXPIRY_MINUTES=15
# JWT_EXPIRY_DAYS=30
# RATE_LIMIT_MAGIC_LINK_PER_EMAIL=5
# RATE_LIMIT_MAGIC_LINK_PER_IP=20
```
