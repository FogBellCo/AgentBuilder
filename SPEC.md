# UCSD AgentBuilder — End-State Specification

## Vision

Transform the current client-side intake wizard into a **production-ready, standalone web app** that:
1. Guides users through the Gather > Refine > Present workflow (already works)
2. Generates a **polished, branded HTML/Markdown project spec** from their answers
3. **Submits the spec via a configurable webhook/API** to a downstream team
4. Authenticates users via **UCSD SSO (Shibboleth)** so submissions are tied to real identities

---

## Current State

- 100% client-side React SPA (React 19, Vite, Tailwind, Zustand)
- Decision tree wizard across 3 stages (GATHER, REFINE, PRESENT)
- Data classification (P1–P4), feasibility matrix, multi-select outputs
- Export: JSON download, mailto sharing, clipboard copy
- No backend, no auth, no API integration, no server-side persistence

---

## End-State Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React SPA)              │
│  Existing wizard + new Spec Preview + Submission UI  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               Lightweight Backend (API)              │
│  - POST /api/submit   → send webhook + store record │
│  - GET  /api/auth/sso → Shibboleth redirect/verify  │
│  - GET  /api/submissions → user's past submissions   │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     Webhook       SQLite/      UCSD SSO
     Endpoint      JSON DB      (Shibboleth)
     (external)    (local)
```

---

## Feature Specifications

### F1: Project Spec Generation (HTML/Markdown page)

**Goal**: Replace the current basic summary with a polished, printable project specification.

**Spec Page Sections**:
1. **Header** — UCSD branding, TritonAI logo, generation date, session ID
2. **Executive Summary** — Auto-generated 2-3 sentence overview derived from project title, description, protection level, and chosen AI tasks
3. **Project Overview** — Title, description, domain, timeline, submitter info (from SSO)
4. **Data Classification** — Protection level badge, selected data sources with levels, data type/size/source system, compliance notes
5. **AI Processing Plan** — Each refinement task: task type, description, data prep method. Additional context.
6. **Output Deliverables** — Each selected output format with: description, feasibility status, conditions/requirements
7. **Feasibility Summary** — Table: format × protection level showing go/no-go for each output
8. **Compliance & Next Steps** — Protection-level-specific action items (existing logic), data steward contacts, required approvals
9. **Technical Notes** — Raw JSON payload in a collapsible section for dev handoff

**UI**:
- New route: `/spec` (replaces or supplements `/summary`)
- In-app rendered page using Tailwind typography (prose classes)
- Print-friendly CSS (`@media print` styles)
- "Print / Save as PDF" button (browser print dialog)
- "Copy as Markdown" button
- "Submit to TritonAI" button (see F2)

**Implementation Notes**:
- Build a `SpecRenderer` component that takes the `IntakePayload` and renders each section
- Executive summary auto-generation: template-based string interpolation (no AI needed — use pattern like "This project aims to [task types] [data description] and deliver results via [output formats]. Data is classified as [P-level], requiring [key conditions].")
- Reuse existing `buildIntakeJson()` for the data, add a new `buildSpecMarkdown()` for the markdown export

---

### F2: Webhook/API Submission

**Goal**: POST the completed intake payload to a configurable external endpoint when the user clicks "Submit".

**Behavior**:
1. User clicks "Submit to TritonAI" on the spec page
2. Frontend sends `POST /api/submit` to the backend
3. Backend:
   a. Validates the payload
   b. Forwards it to the configured webhook URL (env var `WEBHOOK_URL`)
   c. Stores a submission record locally (session ID, timestamp, user email, status)
   d. Returns success/failure to frontend
4. Frontend shows success confirmation with submission ID, or error with retry option

**Webhook Payload**:
```json
{
  "event": "intake_submitted",
  "timestamp": "ISO-8601",
  "submitter": {
    "email": "user@ucsd.edu",
    "name": "First Last",
    "pid": "A12345678"
  },
  "intake": { /* full IntakePayload */ },
  "specMarkdown": "# Project Spec\n..."
}
```

**Backend**:
- Lightweight Node.js server (Express or Hono)
- Single endpoint: `POST /api/submit`
- Reads `WEBHOOK_URL` from environment
- Forwards payload via `fetch()`
- Stores record in SQLite or flat JSON file
- Returns `{ success: true, submissionId: "..." }`

**Error Handling**:
- If webhook is unreachable: store as "pending", show user a message that it will be retried
- If webhook returns non-2xx: store as "failed", show error
- Provide a `GET /api/submissions/:id/status` for checking

---

### F3: UCSD SSO Authentication (Shibboleth)

**Goal**: Require UCSD login so every submission is tied to a real identity.

**Flow**:
1. User visits the app → if not authenticated, redirect to UCSD Shibboleth IdP
2. Shibboleth authenticates → redirects back with SAML assertion
3. Backend validates assertion, creates session (JWT cookie or server session)
4. Frontend receives user info: `{ email, name, pid }` via `GET /api/auth/me`
5. User info is displayed in the header and included in submissions

**Implementation**:
- Use `passport-saml` or a Shibboleth SP proxy (e.g., Apache mod_shib in front of the app)
- Backend endpoints:
  - `GET /api/auth/login` → redirect to Shibboleth
  - `POST /api/auth/callback` → receive SAML response, set session
  - `GET /api/auth/me` → return current user info
  - `POST /api/auth/logout` → clear session
- Frontend: `AuthProvider` context that checks `/api/auth/me` on load
- If not authenticated, show a login prompt page instead of the wizard
- Store user info in Zustand alongside session data

**Note**: Full Shibboleth integration requires coordination with UCSD IT for SP registration. For development, implement with a mock auth mode (`AUTH_MODE=mock` env var) that auto-logs in as a test user.

---

### F4: Submission History (User's Past Submissions)

**Goal**: Let authenticated users see their previous submissions.

**UI**:
- Add a "My Submissions" link in the header (visible when logged in)
- Route: `/submissions`
- Simple list view: submission date, project title, protection level, status badge
- Click to view the generated spec (read-only)

**Backend**:
- `GET /api/submissions` → return all submissions for the authenticated user
- `GET /api/submissions/:id` → return a single submission's full payload

---

## Task Breakdown

### Phase 1: Project Spec Generation (Frontend Only)

| # | Task | Details |
|---|------|---------|
| 1.1 | Create `SpecRenderer` component | New component at `src/components/spec/SpecRenderer.tsx`. Takes `IntakePayload` + user info, renders all 9 sections as styled HTML. Use Tailwind prose classes. |
| 1.2 | Build executive summary generator | New function `generateExecutiveSummary(payload)` in `src/lib/spec-generator.ts`. Template-based string interpolation from intake data. |
| 1.3 | Build markdown export function | New function `buildSpecMarkdown(payload)` in `src/lib/spec-generator.ts`. Converts the spec to clean Markdown. |
| 1.4 | Add print-friendly CSS | Add `@media print` styles in a new `src/styles/print.css` — hide nav, buttons; ensure page breaks; clean typography. |
| 1.5 | Create Spec page route | New page `src/pages/Spec.tsx`, route `/spec`. Renders `SpecRenderer` with action buttons (Print, Copy Markdown, Submit). |
| 1.6 | Update summary flow | After PRESENT stage completion, navigate to `/spec` instead of `/summary`. Keep `/summary` as a legacy route that redirects to `/spec`. |
| 1.7 | Add feasibility summary table | Inside `SpecRenderer`, render a grid/table showing each selected output format vs. the protection level with status icons. |
| 1.8 | Add collapsible raw JSON section | At the bottom of the spec, add an expandable section showing the raw `IntakePayload` JSON formatted with syntax highlighting. |

### Phase 2: Backend Setup

| # | Task | Details |
|---|------|---------|
| 2.1 | Initialize backend project | Create `server/` directory. Set up Node.js + TypeScript project with Express or Hono. Add `package.json`, `tsconfig.json`. |
| 2.2 | Create submission endpoint | `POST /api/submit` — accepts `IntakePayload` + user info, validates, stores locally, returns submission ID. |
| 2.3 | Add webhook forwarding | On submission, `POST` the full webhook payload to `WEBHOOK_URL` env var. Handle timeouts and errors gracefully. |
| 2.4 | Add local storage | SQLite database (via `better-sqlite3`) with a `submissions` table: id, session_id, user_email, user_name, payload (JSON), status, created_at. |
| 2.5 | Add submission status endpoint | `GET /api/submissions/:id/status` — returns submission status. |
| 2.6 | Add submissions list endpoint | `GET /api/submissions` — returns all submissions for the authenticated user (filter by email from session). |
| 2.7 | Add single submission endpoint | `GET /api/submissions/:id` — returns full payload for a single submission. |
| 2.8 | Configure Vite proxy | Update `vite.config.ts` to proxy `/api/*` to the backend server during development. |
| 2.9 | Add production build script | Script that builds the React frontend and serves it as static files from the backend. |

### Phase 3: SSO Authentication

| # | Task | Details |
|---|------|---------|
| 3.1 | Add auth middleware to backend | Install `passport` + `passport-saml`. Configure SAML strategy with UCSD Shibboleth IdP metadata. Add session management (express-session + connect-sqlite3). |
| 3.2 | Create auth endpoints | `GET /api/auth/login`, `POST /api/auth/callback`, `GET /api/auth/me`, `POST /api/auth/logout`. |
| 3.3 | Add mock auth mode | When `AUTH_MODE=mock`, skip SAML and auto-authenticate as a configurable test user. For local development. |
| 3.4 | Create `AuthProvider` on frontend | React context at `src/providers/AuthProvider.tsx`. Calls `/api/auth/me` on mount. Provides `{ user, isAuthenticated, login, logout }`. |
| 3.5 | Add login gate | If user is not authenticated, show a login prompt page with "Sign in with UCSD SSO" button instead of the wizard. |
| 3.6 | Display user info in header | Show the authenticated user's name and a logout button in the app header. |
| 3.7 | Include user info in submissions | Attach `{ email, name, pid }` from auth session to every submission payload. |
| 3.8 | Protect API routes | Add auth middleware to `POST /api/submit` and `GET /api/submissions` — reject unauthenticated requests with 401. |

### Phase 4: Submission History UI

| # | Task | Details |
|---|------|---------|
| 4.1 | Create submissions list page | New page `src/pages/Submissions.tsx`, route `/submissions`. Fetches `GET /api/submissions`, renders a list. |
| 4.2 | Create submission card component | `src/components/submissions/SubmissionCard.tsx` — shows date, title, protection level badge, status. |
| 4.3 | Add read-only spec view | Route `/submissions/:id` — fetches the full submission and renders `SpecRenderer` in read-only mode (no action buttons). |
| 4.4 | Add navigation link | Add "My Submissions" link to the header, visible only when authenticated. |

### Phase 5: Integration & Polish

| # | Task | Details |
|---|------|---------|
| 5.1 | Wire up "Submit to TritonAI" button | On the spec page, call `POST /api/submit` with the payload. Show loading state, success confirmation (with submission ID), or error with retry. |
| 5.2 | Add submission confirmation UI | After successful submission, show a confirmation screen with: submission ID, "View in My Submissions" link, "Start New" button. |
| 5.3 | Handle submission errors | Show inline error messages if webhook fails. Explain that the submission was saved and will be retried. |
| 5.4 | Add environment configuration | Create `.env.example` with all required vars: `WEBHOOK_URL`, `AUTH_MODE`, `SAML_ENTITY_ID`, `SAML_SSO_URL`, `SAML_CERT`, `SESSION_SECRET`, `DATABASE_PATH`. |
| 5.5 | Update README | Document: architecture, setup instructions, environment variables, development workflow, deployment guide. |
| 5.6 | Add Dockerfile | Multi-stage Docker build: build frontend → serve from backend. Include health check endpoint. |

---

## Execution Order

**Phase 1** (Spec Generation) can be done entirely on the frontend with no backend dependency — start here.

**Phase 2** (Backend) is the foundation for Phases 3 and 4 — do this second.

**Phase 3** (SSO) and **Phase 4** (Submissions UI) can be done in parallel once Phase 2 is complete.

**Phase 5** (Integration) ties everything together — do this last.

---

## Out of Scope (for now)

- PDF generation (users can use browser Print → Save as PDF)
- Admin dashboard for reviewing all submissions
- Real-time status tracking / notifications
- Slack/Teams integration (webhook is generic enough to support this downstream)
- Analytics / usage tracking
- Multi-language support
