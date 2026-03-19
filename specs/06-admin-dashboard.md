# Spec 06 — OSI Admin Dashboard

> **Status:** Draft
> **Priority:** Phase 3 (Admin & Scale)
> **Dependencies:** Backend API (server), Two-Summary system (spec 02), Persistent Submissions (spec 06 prerequisite — email-based identification + SQLite storage)
> **Source:** FEATURES-BRAINSTORM.md Section 7

---

## 1. Overview

The OSI Admin Dashboard is an internal-only web interface for the Office of Strategic Initiatives team to manage, review, analyze, and prioritize all AI tool request submissions. It is **completely separate** from the user-facing wizard — users never see this view, and the admin interface never shows the friendly "Here's what you told us" language. Instead, it displays the structured UCSD intake format (Process Overview, Desirability, Viability, Feasibility, Context/Challenge/Request, Savings, Metadata) as shown in the Format screenshots.

### Design principles

- **Desktop-first.** OSI team members use laptops and monitors. Optimize for 1280px+ viewports. Must remain functional on tablets (768px+). Mobile is not a priority.
- **Data-dense.** Admins want to see as much information as possible without excessive clicking. Favor tables over cards, inline actions over modals where practical.
- **UCSD brand.** Same design tokens as the user-facing app (navy `#182B49`, blue `#00629B`, yellow `#FFCD00`, protection level colors P1-P4). The admin shell uses a darker navy sidebar to visually differentiate from the public wizard.
- **Non-blocking.** Every action that touches the network must have optimistic UI or loading indicators. Admins should never stare at a blank screen.

---

## 2. Access Control

### 2a. Authentication strategy

**Decision: Shared-secret token auth (Phase 3), upgradable to UCSD SSO (future).**

Rationale: The current system uses simple email-based identification with no password. Full UCSD SSO (Shibboleth/SAML) integration requires coordination with campus IT and is out of scope for Phase 3. A shared-secret approach gives OSI immediate access control without infrastructure dependencies.

Implementation:

1. **Admin token** — A long, randomly generated token (64+ hex characters) stored in the server's `.env` file as `ADMIN_TOKEN`. The OSI team shares this token internally (e.g., in a 1Password vault).
2. **Login screen** — At `/admin/login`, admins paste the token into a single input field. The client sends it to `POST /api/admin/auth` which validates it against the env var and returns a signed JWT (24-hour expiry).
3. **JWT session** — The JWT is stored in `localStorage` under the key `ucsd-agentbuilder-admin-token`. All subsequent `/api/admin/*` requests include it as `Authorization: Bearer <jwt>`.
4. **Server middleware** — A Hono middleware on all `/api/admin/*` routes validates the JWT. Invalid/expired tokens return `401`.
5. **Logout** — Clears localStorage and redirects to `/admin/login`.

```
# .env
ADMIN_TOKEN=a1b2c3d4...  # 64+ character hex string
ADMIN_JWT_SECRET=e5f6g7h8...  # separate secret for signing JWTs
```

### 2b. Role levels (future-ready, not enforced in Phase 3)

The JWT payload includes a `role` field. Phase 3 treats all authenticated users as `admin`. The schema supports future differentiation:

| Role | Permissions |
|------|-------------|
| `viewer` | Read-only access to submissions and analytics. Cannot change status or leave notes. |
| `editor` | Everything a viewer can do, plus: change submission status, leave internal notes, send follow-up questions, assign team members. |
| `admin` | Everything an editor can do, plus: manage team member access, batch operations, export all data, archive/unarchive. |

### 2c. Route separation

Admin routes are fully isolated from user routes:

- **Frontend:** All admin pages live under `/#/admin/*`. The `AdminApp` component has its own layout shell (sidebar nav, no breadcrumbs, no progress bar, no wizard sidebar).
- **Backend:** All admin API endpoints live under `/api/admin/*`. They share the same SQLite database but use the admin auth middleware.
- **No cross-contamination:** The user-facing `Header`, `Breadcrumbs`, `ProgressBar`, `StagesSidebar`, and `Footer` components are never rendered inside the admin shell.

---

## 3. Routing & Layout

### 3a. New frontend routes

```
/#/admin/login          → AdminLogin page
/#/admin                → Redirect to /#/admin/submissions
/#/admin/submissions    → SubmissionQueue (main view)
/#/admin/submissions/:id → SubmissionDetail
/#/admin/analytics      → AnalyticsOverview
/#/admin/prioritization → PrioritizationMatrix
/#/admin/settings       → AdminSettings (team management, future)
```

### 3b. App.tsx changes

Add an admin route group inside the existing `HashRouter`. The admin layout is a separate component tree — it does not render `Header`, `Breadcrumbs`, `ProgressBar`, `StagesSidebar`, or `Footer`.

```tsx
// In App.tsx, add alongside existing routes:
<Route path="/admin/login" element={<AdminLogin />} />
<Route path="/admin/*" element={<AdminGuard><AdminLayout /></AdminGuard>}>
  <Route index element={<Navigate to="submissions" replace />} />
  <Route path="submissions" element={<SubmissionQueue />} />
  <Route path="submissions/:id" element={<SubmissionDetail />} />
  <Route path="analytics" element={<AnalyticsOverview />} />
  <Route path="prioritization" element={<PrioritizationMatrix />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

### 3c. AdminGuard component

Checks for a valid JWT in localStorage. If missing or expired, redirects to `/admin/login`. Renders an `<Outlet />` if authenticated.

```
src/components/admin/AdminGuard.tsx
```

### 3d. AdminLayout component

The persistent shell for all admin pages.

```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐  UC San Diego — OSI Admin         [Logout]  │ ← AdminHeader (navy bg, gold accent)
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ Sidebar  │  Main Content Area                            │
│          │  (renders <Outlet />)                         │
│ ● Queue  │                                               │
│ ○ Detail │                                               │
│ ○ Analytics                                              │
│ ○ Priority│                                              │
│ ○ Settings│                                              │
│          │                                               │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

**AdminSidebar** — Fixed-width (220px) left sidebar with navy-900 background. Navigation items:

| Icon | Label | Route |
|------|-------|-------|
| `Inbox` | Submissions | `/admin/submissions` |
| `BarChart3` | Analytics | `/admin/analytics` |
| `Grid3X3` | Prioritization | `/admin/prioritization` |
| `Settings` | Settings | `/admin/settings` |

Active item: white text + blue left border accent. Inactive: gray-400 text.

At the bottom of the sidebar: authenticated user indicator (shows "OSI Admin") and logout button.

---

## 4. Submission Queue (Main View)

Route: `/#/admin/submissions`

This is the default landing page after login. It shows all submissions across all users in a data table.

### 4a. Page header

```
Submissions                                    [Export CSV] [Export Excel]
[Search box ________________] [Filters ▾]     Showing 47 of 128 submissions
```

- **Title:** "Submissions" in h1, navy
- **Export buttons:** Top-right, outlined style. CSV downloads immediately; Excel uses SheetJS.
- **Result count:** "Showing X of Y submissions" — X is the filtered count, Y is total.

### 4b. Search bar

- Full-width text input below the header row
- Searches across: project title, submitter email, description text (from `session_state.projectIdea.description`)
- Debounced (300ms) — filters as the admin types
- Server-side search via `GET /api/admin/submissions?q=<term>`
- Clear button (X icon) when text is present
- Placeholder: "Search by title, email, or description..."

### 4c. Filter bar

A horizontal row of filter dropdowns that appear below the search bar. Each filter is a dropdown trigger button showing the current selection or "All".

| Filter | Type | Options |
|--------|------|---------|
| **Status** | Multi-select dropdown | Draft, Submitted, In Review, Needs Info, Approved, Building, Complete, Archived |
| **Protection Level** | Multi-select dropdown | P1, P2, P3, P4 |
| **VC Area** | Multi-select dropdown | Populated dynamically from submission data (`session_state.projectIdea.domain`) |
| **Completeness** | Range dropdown | 0-25%, 25-50%, 50-75%, 75-100% |
| **Date Range** | Date picker | From / To date inputs with calendar dropdown |

- Active filters show a count badge on the filter button: "Status (2)"
- "Clear all filters" link appears when any filter is active
- Filters are AND-combined (submission must match all active filters)
- Filter state persists in URL query params for shareable links

### 4d. Data table

A dense table with the following columns:

| # | Column | Width | Content | Sortable |
|---|--------|-------|---------|----------|
| 1 | Checkbox | 40px | Select row for batch ops | No |
| 2 | Title | flex | Project title (linked, truncated at 60 chars). Below in gray-500: submitter email | Yes |
| 3 | Department | 140px | VC area from `projectIdea.domain` | Yes |
| 4 | Status | 120px | Status badge (colored pill) | Yes |
| 5 | Protection | 80px | P-level badge using protection level colors (P1 green, P2 blue, P3 orange, P4 red) | Yes |
| 6 | Completeness | 100px | Percentage + mini progress bar | Yes |
| 7 | Submitted | 110px | Relative date ("2 days ago") with full date on hover tooltip | Yes |
| 8 | Actions | 100px | Quick action buttons | No |

**Default sort:** Updated date, descending (most recent first).

**Sorting behavior:** Click a column header to sort ascending. Click again for descending. A subtle arrow indicator shows current sort direction.

**Status badge colors:**

| Status | Background | Text |
|--------|-----------|------|
| Draft | `gray-100` | `gray-700` |
| Submitted | `blue/10` | `blue` |
| In Review | `yellow/20` | `gold` |
| Needs Info | `orange/15` | `orange` |
| Approved | `green/15` | `green` |
| Building | `turquoise/15` | `turquoise` |
| Complete | `navy/10` | `navy` |
| Archived | `gray-100` | `gray-500` |

**Quick actions (column 8):**

Three icon buttons in a row, each with a tooltip:

1. **Status** (`ChevronDown` icon) — Opens a dropdown to change status inline. Selecting a status immediately updates it via `PUT /api/admin/submissions/:id/status`.
2. **Assign** (`UserPlus` icon) — Opens a dropdown with team member names (from settings). Selecting assigns the submission.
3. **Flag** (`Flag` icon) — Toggles a flag on/off. Flagged submissions show a red flag icon in the Title column.

**Row click:** Clicking anywhere in a row (except checkboxes and action buttons) navigates to `/#/admin/submissions/:id`.

### 4e. Completeness scoring

The completeness percentage is calculated client-side from the submission's `session_state`:

| Field | Weight | Scoring |
|-------|--------|---------|
| `projectIdea.title` | 5% | Non-empty = full score |
| `projectIdea.description` | 10% | Non-empty = full score |
| `projectIdea.domain` | 5% | Non-empty = full score |
| `projectIdea.timeline` | 5% | Non-empty = full score |
| `projectIdea.projectGoal` | 5% | Non-empty = full score |
| `projectIdea.currentProcess` | 5% | Non-empty = full score |
| GATHER stage complete | 15% | `stages.GATHER.status === 'complete'` |
| `gatherDetails` filled | 10% | Non-null with at least `dataType` and `sourceSystem` |
| REFINE stage complete | 15% | `stages.REFINE.status === 'complete'` |
| `refineDetails` filled | 5% | Non-null with at least one refinement |
| PRESENT stage complete | 10% | `stages.PRESENT.status === 'complete'` |
| `presentDetails` filled | 5% | Non-null with at least one output |
| Gap analysis completed | 5% | `gapAnalysis.status === 'ready'` |

Total: 100%. Displayed as integer percentage with a tiny horizontal bar (green above 75%, yellow 50-75%, orange 25-50%, red below 25%).

### 4f. Batch operations

When one or more checkboxes are selected, a batch action bar slides in at the bottom of the viewport (sticky):

```
┌────────────────────────────────────────────────────────────────┐
│  ✓ 5 selected    [Change Status ▾]  [Export Selected]  [Archive]  [Deselect All] │
└────────────────────────────────────────────────────────────────┘
```

- **Change Status:** Multi-select applies same status to all selected.
- **Export Selected:** Downloads selected submissions as a single CSV or JSON zip.
- **Archive:** Moves selected to "Archived" status with confirmation dialog.
- **Deselect All:** Clears selection.

### 4g. Pagination

Server-side pagination, 25 rows per page.

```
← Previous  Page 1 of 6  Next →
```

- Page size selector: 25 / 50 / 100
- Keyboard shortcuts: Left/Right arrows for page navigation
- When filters are active, pagination resets to page 1

---

## 5. Submission Detail View

Route: `/#/admin/submissions/:id`

Shows the full UCSD intake format for a single submission, plus admin-only tools.

### 5a. Page header

```
← Back to Submissions

[Project Title]                              Status: [In Review ▾]  [Export ▾]
Submitted by user@ucsd.edu on Mar 15, 2026   Assigned to: [Mahmoud ▾]
Completeness: 73% ████████░░░
```

- **Back link:** Returns to the queue with scroll position and filter state preserved (via URL params).
- **Status dropdown:** Inline editable. Changing status creates a timeline entry.
- **Export dropdown:** PDF / JSON / Markdown / Claude Code Bundle (see section 5f).
- **Assigned to dropdown:** Select from team members list. "Unassigned" is the default.

### 5b. UCSD intake format display

The main content area renders the structured UCSD intake format matching the layout in the Format screenshots. This is a two-column layout on desktop (single column on tablet):

**Left column (65% width):**

```
┌─────────────────────────────────────────────────┐
│ PROCESS OVERVIEW                                │
│ ┌──────────────────────────────────────────────┐│
│ │ Purpose                                      ││
│ │ [AI-generated purpose paragraph]             ││
│ ├──────────────────────────────────────────────┤│
│ │ Description                                  ││
│ │ [AI-generated description paragraph]         ││
│ ├──────────────────────────────────────────────┤│
│ │ Key Points                                   ││
│ │ • [bullet 1]                                 ││
│ │ • [bullet 2]                                 ││
│ │ • [bullet 3]                                 ││
│ ├──────────────────────────────────────────────┤│
│ │ AI Solution Considerations                   ││
│ │ • [consideration 1]                          ││
│ │ • [consideration 2]                          ││
│ ├──────────────────────────────────────────────┤│
│ │ Potential Impact                             ││
│ │ • [impact statement]                         ││
│ ├──────────────────────────────────────────────┤│
│ │ Questions & Considerations                   ││
│ │ • [flagged item 1]                           ││
│ │ • [flagged item 2]                           ││
│ └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CONTEXT / CHALLENGE / REQUEST                   │
│ ┌──────────┬──────────────┬────────────────────┐│
│ │ Context  │  Challenge   │  Request           ││
│ │ [para]   │  [para]      │  [para]            ││
│ └──────────┴──────────────┴────────────────────┘│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SAVINGS                                         │
│ Time Savings:                                   │
│   • Expected Volume: X / year                   │
│   • Time per instance: X hours                  │
│   • Potential time savings: ~X%                  │
│   • Time savings: ~X hours / year               │
│ Impact:                                         │
│   • [impact statement]                          │
└─────────────────────────────────────────────────┘
```

**Right column (35% width):**

```
┌─────────────────────┐
│ DESIRABILITY        │
│ Customer Size:      │
│   [value]           │
│ Customer Need:      │
│   [Low/Med/High]    │
├─────────────────────┤
│ VIABILITY           │
│ Process Volume:     │
│   [value]           │
│ Potential Savings   │
│   per Cycle: [val]  │
│ Potential Savings   │
│   per Month: [val]  │
├─────────────────────┤
│ FEASIBILITY         │
│ Alignment:          │
│   [value]           │
│ Data Availability:  │
│   [value]           │
│ Complexity:         │
│   [Low/Med/High]    │
├─────────────────────┤
│ METADATA            │
│ VC Area: [value]    │
│ Submitted by:       │
│   [email]           │
│ On behalf of:       │
│   [name or N/A]     │
└─────────────────────┘
```

The Process Overview sections are populated from the AI-generated summary (`aiSummary.sections`). The Desirability/Viability/Feasibility/Savings fields are computed from wizard answers and detail forms. If the AI summary has not been generated for this submission, show a "Generate Summary" button that triggers the `/api/generate-summary` endpoint.

The Context/Challenge/Request section uses the three-column layout matching the Format screenshots, with blue header bars.

### 5c. Internal notes section

Below the intake format display, a collapsible section titled "Internal Notes (OSI only)".

```
┌─────────────────────────────────────────────────────────────┐
│ INTERNAL NOTES (OSI ONLY)                          [Expand] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Add a note...                                    [Post] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Mahmoud — 2 hours ago                                       │
│ Looks good. Need to verify data access before approving.    │
│                                                             │
│ Sarah — 1 day ago                                           │
│ Flagged for P3 review — contains student records.           │
└─────────────────────────────────────────────────────────────┘
```

- Multiline text input with a "Post" button
- Notes are stored per-submission in the database (see section 9)
- Each note shows: author name (from admin settings), relative timestamp, content
- Notes are reverse-chronological (newest first)
- Notes are never visible to the submitter

### 5d. Status change with history

The status dropdown in the header is also reflected in a timeline at the bottom of the page.

**Allowed status transitions:**

```
Draft → Submitted → In Review → Needs Info → In Review → Approved → Building → Complete
                                            ↘ Archived (from any status)
```

No strict enforcement of transitions — admins can set any status at any time. The timeline records every change.

### 5e. "Send question to user" action

A button in the header area: `[Ask User a Question]`

Clicking opens a modal:

```
┌──────────────────────────────────────────────────┐
│  Send Follow-Up Question                    [X]  │
│                                                  │
│  To: user@ucsd.edu                               │
│                                                  │
│  Question:                                       │
│  ┌──────────────────────────────────────────────┐│
│  │                                              ││
│  │                                              ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  This will:                                      │
│  • Change status to "Needs Info"                 │
│  • Send an email to the user with a link back    │
│    to their submission                           │
│  • Log this question in the activity timeline    │
│                                                  │
│              [Cancel]  [Send Question]            │
└──────────────────────────────────────────────────┘
```

Backend flow:
1. `POST /api/admin/submissions/:id/question` with `{ question: string }`
2. Server updates status to "Needs Info"
3. Server sends email via configured email service (SendGrid, Postmark, or SMTP — configured via env vars)
4. Email contains the question text and a magic link (`/#/submissions/:id?email=<email>`) to bring the user back to their submission
5. Server creates a timeline event

The question is also added to the submission's gap analysis questions as a new `GapQuestion` with `priority: 'critical'`, so the user sees it when they return.

### 5f. Export options

The Export dropdown offers four formats:

1. **PDF** — Renders the UCSD intake format as a PDF. Uses the browser's `window.print()` with admin-specific print styles, or a server-side PDF generation endpoint (`POST /api/admin/submissions/:id/export/pdf`) using Puppeteer or `@react-pdf/renderer`.
2. **JSON** — Downloads the full `IntakePayload` as a formatted JSON file.
3. **Markdown** — Uses the existing `buildSpecMarkdown()` function from `src/lib/summary-markdown.ts` to generate a `.md` file.
4. **Claude Code Bundle** — Generates the structured prompt bundle from FEATURES-BRAINSTORM.md Section 5. This is a `.md` file with the specific format designed for pasting into Claude Code.

### 5g. Activity timeline

At the bottom of the detail page, a vertical timeline showing all events:

```
Timeline
─────────────────────────────────────────

● Status changed to "In Review"
  by Mahmoud — Mar 16, 2026 at 2:30 PM

● Note added
  by Mahmoud — Mar 16, 2026 at 2:25 PM
  "Looks good. Need to verify data access before approving."

● Follow-up question sent
  to user@ucsd.edu — Mar 15, 2026 at 4:00 PM
  "Can you clarify how many records are processed monthly?"

● Submission received
  from user@ucsd.edu — Mar 15, 2026 at 3:45 PM

● User completed gap analysis
  Completeness: 73% → 85% — Mar 15, 2026 at 3:30 PM

● Submission created (draft)
  Mar 14, 2026 at 10:00 AM
```

Events are stored in an `activity_log` table (see section 9). Each event has: `submission_id`, `event_type`, `actor` (admin name or "system"), `details` (JSON), `created_at`.

---

## 6. Analytics Overview

Route: `/#/admin/analytics`

A dashboard with charts showing aggregate data across all submissions.

### 6a. Page header

```
Analytics                                   Date Range: [Last 30 days ▾]
                                           Custom: [From] — [To]
```

The date range selector applies to all charts on the page. Options: Last 7 days, Last 30 days, Last 90 days, This year, All time, Custom range.

### 6b. Summary cards (top row)

Four metric cards in a horizontal row:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│     47       │ │    73%       │ │   2.3 days   │ │     12       │
│ Total        │ │ Avg          │ │ Avg Time     │ │ Needs        │
│ Submissions  │ │ Completeness │ │ to Review    │ │ Attention    │
│ +8 this week │ │ ↑ from 68%   │ │ ↓ from 3.1d  │ │ ⚠ flagged   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

Each card: large number, label, and a comparison to previous period (delta with up/down arrow).

- **Total Submissions:** Count of non-archived submissions in the date range.
- **Avg Completeness:** Mean completeness % across all submissions in range.
- **Avg Time to Review:** Mean time between "Submitted" status and first status change by an admin.
- **Needs Attention:** Count of submissions in "Submitted" or "Needs Info" status that have been untouched for 3+ days.

### 6c. Submissions over time (line/bar chart)

```
Submissions Over Time
─────────────────────────────────────
Bar chart with X-axis = weeks/months (auto-bucketed based on date range)
Y-axis = submission count
Stacked bars colored by status
```

- When range is <= 30 days: daily bars
- When range is <= 90 days: weekly bars
- When range is > 90 days: monthly bars
- Hover tooltip shows exact count per status for that period
- Optional toggle: Line chart vs Bar chart (default: bar)

### 6d. Submissions by department (horizontal bar chart)

```
Submissions by Department
─────────────────────────────────────
Academic Affairs    ████████████ 15
Health Sciences     ████████ 10
Student Affairs     ██████ 8
Research            █████ 6
Chancellor          ███ 4
Other               ██ 4
```

- Sorted by count, descending
- Clicking a bar filters the Submission Queue to that department
- Bar color: UCSD blue (`#00629B`)

### 6e. By project type (donut chart)

```
Project Type Distribution
─────────────────────────────────────
[Donut chart]
• Chatbot / Q&A       35%
• Data Processing      25%
• Report Generation    20%
• Workflow Automation   15%
• Other                 5%
```

Project type is derived from the output formats selected in the Present stage:
- `chat` / `knowledge_base` → "Chatbot / Q&A"
- `dashboard` / `static_report` / `slide_deck` → "Report Generation"
- `workflow_automation` / `system_integration` → "Workflow Automation"
- `api_feed` / `email_digest` / `smart_alerts` → "Data Processing"
- `interactive_app` / `embedded_widget` → "Interactive App"

### 6f. By protection level (distribution chart)

```
Protection Level Distribution
─────────────────────────────────────
P1 (Public)      ██████████████ 30  (green)
P2 (Internal)    ████████ 18        (blue)
P3 (Confidential) ████ 8           (orange)
P4 (Restricted)  █ 2               (red)
```

Horizontal bars using the protection level colors from the design system (`--color-p1` through `--color-p4`).

### 6g. Common data sources (bar chart)

```
Most Mentioned Data Sources
─────────────────────────────────────
Canvas              ██████████ 22
ServiceNow          ████████ 16
Excel/Sheets        ██████ 12
Oracle              █████ 10
Box                 ███ 6
Email               ██ 4
```

Extracted from `gatherDetails.sourceSystem` and parsed from free-text mentions in `projectIdea.description` and `gatherDetails.additionalNotes`. Uses keyword matching on known UCSD systems.

### 6h. Chart library

**Recommendation: Recharts**

Rationale:
- React-native (renders as SVG via React components, not Canvas)
- Lightweight (~80KB gzipped) compared to Chart.js with React wrappers
- Declarative API that fits the React component model
- Built-in responsive container (`<ResponsiveContainer>`)
- Already popular in the React ecosystem, well-maintained
- Supports all needed chart types: Bar, Line, Pie/Donut, Scatter (for prioritization)

Install: `npm install recharts`

Alternative considered: **Nivo** — excellent but heavier (~150KB), better for complex visualizations. Overkill for this dashboard. **Chart.js** — imperative API doesn't fit React patterns cleanly; requires `react-chartjs-2` wrapper.

---

## 7. Prioritization Matrix

Route: `/#/admin/prioritization`

Auto-scores submissions and displays them in a 2D scatter plot for visual prioritization.

### 7a. Scoring algorithm

Each submission is scored on three axes, each 0-100:

**Desirability Score (0-100):**

| Factor | Weight | Input | Mapping |
|--------|--------|-------|---------|
| Customer Size | 50% | "Who benefits?" answer or VC area scope | Just my team = 20, A few departments = 50, Many departments = 75, Campus-wide = 100 |
| Customer Need | 50% | "How much is this slowing your team down?" or inferred from urgency | Minor annoyance = 25, Eats real time = 50, Serious bottleneck = 75, Can't keep up = 100 |

**Viability Score (0-100):**

| Factor | Weight | Input | Mapping |
|--------|--------|-------|---------|
| Process Volume | 40% | "How often?" answer | Few times/month = 25, Few times/week = 50, Daily = 75, Multiple/day = 100 |
| Time per Instance | 30% | "How long each time?" answer | Few minutes = 15, Half hour = 40, Couple hours = 70, Half day+ = 100 |
| Scale (people) | 30% | "How many people?" answer | Just me = 20, 2-3 = 40, Small team = 65, Large group = 100 |

**Feasibility Score (0-100):**

| Factor | Weight | Input | Mapping |
|--------|--------|-------|---------|
| Data Availability | 40% | "Is the data easy to get to?" | Easy access = 100, Need help = 50, Not sure = 25 |
| Tool Alignment | 30% | TritonGPT awareness + preferred tool | Already uses it = 100, Heard of it = 60, Never heard = 30 |
| Complexity (inverse) | 30% | Auto-calculated from # data sources, P-level, processing steps | Low = 100, Medium = 60, High = 30 |

**Composite scores for the scatter plot:**

- **Impact** (Y-axis) = `(Desirability * 0.5) + (Viability * 0.5)` — represents "how much value this would deliver"
- **Effort** (X-axis) = `100 - Feasibility` — represents "how hard this would be to build" (inverted so top-right = best)

If input data for a factor is missing, that factor uses a neutral default of 50.

### 7b. Scatter plot visualization

```
Prioritization Matrix
─────────────────────────────────────────────────

Impact ↑
100 │  ●B          ●A
    │     ●C
 75 │          ●D
    │   ●F
 50 │       ●E          ●G
    │
 25 │              ●H
    │
  0 ├──────────────────────────── Effort →
    0    25    50    75    100
         (Easy → Hard)
```

- Each dot represents one submission
- Dot size: proportional to estimated time savings (larger = more savings)
- Dot color: matches status badge color
- Hover tooltip shows: title, scores, status, protection level
- Click navigates to `/#/admin/submissions/:id`
- Quadrant labels (faded background text):
  - Top-left: "Quick Wins" (high impact, low effort)
  - Top-right: "Major Projects" (high impact, high effort)
  - Bottom-left: "Easy Improvements" (low impact, low effort)
  - Bottom-right: "Reconsider" (low impact, high effort)

### 7c. Ranked list alternative

A toggle between scatter plot and ranked list view. The ranked list sorts submissions by a **composite priority score**:

```
Priority Score = (Impact * 0.6) + ((100 - Effort) * 0.4)
```

This weights impact higher than ease of implementation.

```
# | Title                    | Impact | Effort | Priority | Status     | P-Level
1 | Student Feedback Analyzer|   85   |   30   |    79    | Submitted  | P2
2 | Course Eval Summarizer   |   80   |   35   |    74    | In Review  | P2
3 | HR Document Processor    |   75   |   45   |    67    | Submitted  | P3
...
```

### 7d. Manual score overrides

Each submission in the detail view (section 5) has an "OSI Scores" panel (collapsed by default) where admins can:

1. View the auto-calculated Desirability, Viability, and Feasibility scores with explanations of how each factor contributed
2. Override any score by clicking an "Override" button next to it and entering a new value (0-100)
3. Overridden scores show with a yellow "Manual" badge
4. A "Reset to Auto" button restores the calculated score

Overrides are stored in the database as a JSON column on the submission row (see section 9).

---

## 8. Admin Actions

### 8a. Batch operations (detailed in 4f)

Available from the submission queue when rows are selected.

### 8b. Archive / unarchive

- **Archive:** Sets status to "Archived". Archived submissions are hidden from the default queue view (a filter toggle "Show archived" reveals them).
- **Unarchive:** Restores to the previous status before archival (stored in the activity log).
- Archived submissions are excluded from analytics charts by default (toggle to include).

### 8c. Export all as CSV/Excel

From the submission queue header, "Export CSV" or "Export Excel" downloads all submissions matching the current filter criteria.

CSV columns:
```
ID, Title, Submitter Email, Department, Status, Protection Level,
Completeness %, Created At, Updated At, Assigned To,
Description, Data Sources, Output Format, Time Savings Estimate
```

Excel format: Same columns with formatted headers, auto-width columns, and a summary row at the top.

### 8d. Team member management

Route: `/#/admin/settings`

Phase 3 scope is minimal:

- A list of team member names (stored in a `team_members` table)
- Each team member has: `id`, `name`, `email`
- Add/remove team members (used for assignment dropdowns and note attribution)
- No per-member auth in Phase 3 — all admins share the same token

Future: individual login credentials, role-based permissions per member.

---

## 9. Database Schema Changes

The existing `submissions` table is extended, and new tables are added.

### 9a. Alter `submissions` table

```sql
-- Add new columns
ALTER TABLE submissions ADD COLUMN assigned_to TEXT DEFAULT NULL;
ALTER TABLE submissions ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN score_overrides TEXT DEFAULT NULL; -- JSON: { desirability?: number, viability?: number, feasibility?: number }
ALTER TABLE submissions ADD COLUMN archived_from_status TEXT DEFAULT NULL; -- status before archival

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_flagged ON submissions(flagged);
```

### 9b. New `admin_notes` table

```sql
CREATE TABLE IF NOT EXISTS admin_notes (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_submission ON admin_notes(submission_id);
```

### 9c. New `activity_log` table

```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  event_type TEXT NOT NULL,  -- 'status_change' | 'note_added' | 'question_sent' | 'assigned' | 'flagged' | 'score_override' | 'exported' | 'submission_created' | 'submission_updated'
  actor TEXT NOT NULL,        -- admin name, "system", or user email
  details TEXT DEFAULT NULL,  -- JSON with event-specific data
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_log_submission ON activity_log(submission_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
```

### 9d. New `team_members` table

```sql
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 10. Backend API Endpoints

All admin endpoints are prefixed with `/api/admin/` and protected by the admin JWT middleware.

### 10a. Authentication

```
POST /api/admin/auth
Body: { token: string }
Response: { jwt: string, expiresAt: string }
```

Validates the token against `ADMIN_TOKEN` env var. Returns a signed JWT.

### 10b. Submissions (admin view)

```
GET /api/admin/submissions
Query params:
  q          — Search term (searches title, email, description)
  status     — Comma-separated status filter (e.g., "submitted,in_review")
  pLevel     — Comma-separated protection levels (e.g., "P2,P3")
  department — Comma-separated VC areas
  minComplete — Minimum completeness % (0-100)
  maxComplete — Maximum completeness % (0-100)
  from       — Start date (ISO 8601)
  to         — End date (ISO 8601)
  sort       — Column to sort by (title, email, status, protectionLevel, completeness, createdAt, updatedAt)
  order      — asc | desc
  page       — Page number (1-indexed)
  pageSize   — Results per page (default 25, max 100)
  archived   — Include archived submissions (true/false, default false)
Response: {
  submissions: AdminSubmissionRow[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

`AdminSubmissionRow` is a richer projection than the user-facing `SubmissionListItem`:

```typescript
interface AdminSubmissionRow {
  id: string;
  title: string;
  email: string;
  department: string;         // extracted from session_state
  status: string;
  protectionLevel: string;    // extracted from session_state
  completeness: number;       // calculated server-side
  assignedTo: string | null;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Completeness is calculated server-side (same algorithm as section 4e) so it can be sorted and filtered.

### 10c. Single submission (admin view)

```
GET /api/admin/submissions/:id
Response: {
  ...AdminSubmissionRow,
  sessionState: object,       // full session state
  scoreOverrides: object | null,
  notes: AdminNote[],
  timeline: ActivityEvent[],
  archivedFromStatus: string | null
}
```

### 10d. Update submission status

```
PUT /api/admin/submissions/:id/status
Body: { status: string }
Response: { success: true }
Side effects: Creates activity_log entry
```

### 10e. Assign submission

```
PUT /api/admin/submissions/:id/assign
Body: { assignedTo: string | null }  // team member ID or null to unassign
Response: { success: true }
Side effects: Creates activity_log entry
```

### 10f. Toggle flag

```
PUT /api/admin/submissions/:id/flag
Body: { flagged: boolean }
Response: { success: true }
Side effects: Creates activity_log entry
```

### 10g. Score overrides

```
PUT /api/admin/submissions/:id/scores
Body: { desirability?: number, viability?: number, feasibility?: number }
Response: { success: true }
Side effects: Creates activity_log entry
```

### 10h. Admin notes

```
GET /api/admin/submissions/:id/notes
Response: { notes: AdminNote[] }

POST /api/admin/submissions/:id/notes
Body: { author: string, content: string }
Response: { id: string, success: true }
Side effects: Creates activity_log entry
```

```typescript
interface AdminNote {
  id: string;
  submissionId: string;
  author: string;
  content: string;
  createdAt: string;
}
```

### 10i. Activity timeline

```
GET /api/admin/submissions/:id/timeline
Response: { events: ActivityEvent[] }
```

```typescript
interface ActivityEvent {
  id: string;
  submissionId: string;
  eventType: string;
  actor: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
```

### 10j. Send follow-up question

```
POST /api/admin/submissions/:id/question
Body: { question: string }
Response: { success: true }
Side effects:
  - Updates submission status to "needs_info"
  - Sends email to submitter
  - Creates activity_log entry
  - Adds question to submission's gap analysis
```

### 10k. Batch operations

```
POST /api/admin/submissions/batch
Body: {
  ids: string[],
  action: 'change_status' | 'archive' | 'unarchive',
  params?: { status?: string }
}
Response: { success: true, affected: number }
Side effects: Creates activity_log entries for each affected submission
```

### 10l. Analytics aggregation

```
GET /api/admin/analytics
Query params:
  from — Start date
  to   — End date
Response: {
  summary: {
    totalSubmissions: number,
    avgCompleteness: number,
    avgTimeToReview: number,  // in hours
    needsAttention: number
  },
  submissionsOverTime: Array<{ period: string, count: number, byStatus: Record<string, number> }>,
  byDepartment: Array<{ department: string, count: number }>,
  byProjectType: Array<{ type: string, count: number }>,
  byProtectionLevel: Array<{ level: string, count: number }>,
  commonDataSources: Array<{ source: string, count: number }>
}
```

### 10m. Team members

```
GET  /api/admin/team
Response: { members: TeamMember[] }

POST /api/admin/team
Body: { name: string, email: string }
Response: { id: string, success: true }

DELETE /api/admin/team/:id
Response: { success: true }
```

### 10n. Export

```
GET /api/admin/submissions/export
Query params: Same filters as 10b + format (csv | json)
Response: File download (Content-Disposition: attachment)
```

```
POST /api/admin/submissions/:id/export/:format
Params: format = pdf | json | markdown | claude-bundle
Response: File download
```

---

## 11. Frontend Component Structure

```
src/
├── components/
│   └── admin/
│       ├── AdminGuard.tsx              — Auth check wrapper
│       ├── AdminLayout.tsx             — Shell with header + sidebar + outlet
│       ├── AdminHeader.tsx             — Top bar with logo + logout
│       ├── AdminSidebar.tsx            — Left navigation
│       ├── AdminLogin.tsx              — Token login page
│       │
│       ├── queue/
│       │   ├── SubmissionQueue.tsx      — Main queue page (orchestrator)
│       │   ├── QueueTable.tsx           — Data table component
│       │   ├── QueueTableRow.tsx        — Single table row
│       │   ├── QueueSearch.tsx          — Search input
│       │   ├── QueueFilters.tsx         — Filter bar with dropdowns
│       │   ├── QueuePagination.tsx      — Pagination controls
│       │   ├── BatchActionBar.tsx       — Sticky bottom bar for batch ops
│       │   ├── StatusBadge.tsx          — Colored status pill
│       │   ├── ProtectionBadge.tsx      — P-level badge
│       │   ├── CompletenessBar.tsx      — Mini progress indicator
│       │   └── QuickActions.tsx         — Inline action buttons per row
│       │
│       ├── detail/
│       │   ├── SubmissionDetail.tsx     — Detail page orchestrator
│       │   ├── DetailHeader.tsx         — Title, status, actions
│       │   ├── IntakeFormatView.tsx     — Full UCSD format display (two-column)
│       │   ├── ProcessOverview.tsx      — Left column: purpose, description, key points, etc.
│       │   ├── ContextChallengeRequest.tsx — Three-column CCR display
│       │   ├── SavingsSection.tsx       — Time savings + impact
│       │   ├── ScorecardPanel.tsx       — Right column: D/V/F + metadata
│       │   ├── InternalNotes.tsx        — Notes section
│       │   ├── NoteInput.tsx            — Add note form
│       │   ├── ActivityTimeline.tsx     — Event timeline
│       │   ├── TimelineEvent.tsx        — Single timeline item
│       │   ├── ScoreOverridePanel.tsx   — Manual score editing
│       │   ├── FollowUpModal.tsx        — Send question modal
│       │   └── ExportMenu.tsx           — Export dropdown
│       │
│       ├── analytics/
│       │   ├── AnalyticsOverview.tsx    — Analytics page orchestrator
│       │   ├── SummaryCards.tsx         — Top row of metric cards
│       │   ├── SubmissionsChart.tsx     — Line/bar chart over time
│       │   ├── DepartmentChart.tsx      — Horizontal bar chart
│       │   ├── ProjectTypeChart.tsx     — Donut chart
│       │   ├── ProtectionLevelChart.tsx — Distribution chart
│       │   ├── DataSourcesChart.tsx     — Bar chart of common data sources
│       │   └── DateRangeSelector.tsx    — Date range picker
│       │
│       ├── prioritization/
│       │   ├── PrioritizationMatrix.tsx — Page orchestrator
│       │   ├── ScatterPlot.tsx          — 2D impact vs effort chart
│       │   ├── RankedList.tsx           — Table view alternative
│       │   └── ViewToggle.tsx           — Scatter / List toggle
│       │
│       └── settings/
│           ├── AdminSettings.tsx        — Settings page
│           └── TeamMemberList.tsx       — Add/remove team members
│
├── hooks/
│   ├── use-admin-auth.ts               — JWT management, login/logout
│   ├── use-admin-submissions.ts        — Fetch/filter/sort submissions
│   ├── use-admin-submission.ts         — Fetch single submission
│   ├── use-admin-analytics.ts          — Fetch analytics data
│   ├── use-admin-notes.ts              — CRUD notes
│   ├── use-admin-timeline.ts           — Fetch timeline
│   └── use-admin-team.ts               — CRUD team members
│
├── lib/
│   ├── admin-api-client.ts             — API functions for all /api/admin/* endpoints
│   ├── completeness-score.ts           — Shared completeness calculation
│   ├── priority-score.ts               — D/V/F scoring algorithm
│   └── project-type-classifier.ts      — Maps output formats to project type categories
│
└── types/
    └── admin.ts                        — TypeScript interfaces for admin domain
```

---

## 12. Data Fetching Pattern

**Recommendation: TanStack Query (React Query) v5**

Rationale:
- The admin dashboard is read-heavy with multiple independent data fetches on each page
- TanStack Query handles caching, deduplication, background refetching, and pagination out of the box
- Optimistic updates for status changes, flagging, and note posting
- Stale-while-revalidate pattern keeps the UI responsive during refetches
- Already the de facto standard for React data fetching

Install: `npm install @tanstack/react-query`

Setup: Wrap the `AdminLayout` (not the entire app) in a `QueryClientProvider` so the query cache is scoped to admin sessions.

Example patterns:

```typescript
// use-admin-submissions.ts
export function useAdminSubmissions(filters: SubmissionFilters) {
  return useQuery({
    queryKey: ['admin', 'submissions', filters],
    queryFn: () => fetchAdminSubmissions(filters),
    staleTime: 30_000, // 30 seconds
  });
}

// Optimistic status update
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateSubmissionStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'submissions'] });
      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: ['admin', 'submissions'] },
        (old) => /* update the matching row */
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}
```

---

## 13. Responsive Design

### Breakpoints

| Viewport | Layout |
|----------|--------|
| >= 1280px (desktop) | Full two-column detail view, sidebar visible, full table columns |
| 768-1279px (tablet) | Sidebar collapses to icons-only (56px). Detail view becomes single-column. Table hides Department and Completeness columns. |
| < 768px (mobile) | Sidebar hidden (hamburger menu). Table becomes card list. Not optimized — functional only. |

### Specific adaptations

- **Queue table on tablet:** Sticky first column (title). Horizontal scroll for remaining columns.
- **Detail view on tablet:** Process Overview and Scorecard stack vertically (full width each).
- **Charts on tablet:** Full-width, stacked vertically instead of grid.
- **Scatter plot on tablet:** Remains interactive but with larger touch targets on dots.

---

## 14. Server Route Registration

In `server/src/index.ts`, add the admin routes:

```typescript
import adminRoute from './routes/admin/index.js';

// After existing routes
app.route('/api/admin', adminRoute);
```

The admin route module (`server/src/routes/admin/index.ts`) applies the JWT auth middleware and mounts sub-routes:

```
server/src/routes/admin/
├── index.ts          — Hono app with auth middleware + sub-route mounting
├── auth.ts           — POST /auth (token → JWT)
├── submissions.ts    — GET /, GET /:id, PUT /:id/status, etc.
├── notes.ts          — GET/POST for notes
├── timeline.ts       — GET timeline events
├── analytics.ts      — GET aggregated analytics
├── team.ts           — CRUD team members
└── export.ts         — CSV/Excel/PDF exports
```

The auth middleware:

```typescript
import { jwt } from 'hono/jwt';

const adminMiddleware = jwt({
  secret: process.env.ADMIN_JWT_SECRET!,
});

// Applied to all routes except /auth
adminApp.use('/*', async (c, next) => {
  if (c.req.path === '/auth' || c.req.path === '/api/admin/auth') {
    return next();
  }
  return adminMiddleware(c, next);
});
```

---

## 15. Dependencies (npm packages)

### Frontend (added to root `package.json`)

| Package | Purpose | Approximate Size |
|---------|---------|-----------------|
| `recharts` | Charts for analytics + scatter plot | ~80KB gzipped |
| `@tanstack/react-query` | Server state management | ~12KB gzipped |
| `date-fns` | Date formatting, relative dates, range calculations | ~7KB tree-shaken |

### Backend (added to `server/package.json`)

| Package | Purpose | Approximate Size |
|---------|---------|-----------------|
| `hono/jwt` | JWT creation and validation (already included in Hono) | 0 (built-in) |
| `jsonwebtoken` | Alternative JWT signing if Hono's built-in is insufficient | ~8KB |
| `csv-stringify` | CSV generation for exports | ~15KB |
| `exceljs` | Excel (.xlsx) generation | ~300KB |

---

## 16. Acceptance Criteria

### Authentication
- [ ] Admin can log in with the shared token at `/#/admin/login`
- [ ] Invalid tokens show an error message
- [ ] JWT expires after 24 hours and redirects to login
- [ ] All `/api/admin/*` endpoints return 401 without valid JWT
- [ ] Logout clears the session and redirects to login

### Submission Queue
- [ ] All submissions appear in a sortable table with columns: title, department, status, protection level, completeness, date, actions
- [ ] Search filters submissions by title, email, and description with 300ms debounce
- [ ] Each filter (status, protection level, VC area, completeness range, date range) correctly narrows results
- [ ] Filters combine with AND logic
- [ ] Sorting works on all sortable columns (ascending/descending toggle)
- [ ] Pagination works correctly (25/50/100 per page)
- [ ] Clicking a row navigates to the submission detail
- [ ] Quick actions (status change, assign, flag) work inline without page navigation
- [ ] Batch operations (change status, export, archive) work for multi-selected rows
- [ ] Batch action bar appears/disappears based on selection state

### Submission Detail
- [ ] UCSD intake format displays correctly in the two-column layout matching the Format screenshots
- [ ] Status can be changed via dropdown and creates a timeline entry
- [ ] Internal notes can be added, display in reverse chronological order, and are attributed to the note author
- [ ] "Send Question" modal sends the question, updates status to "Needs Info", and creates a timeline event
- [ ] Export works for all four formats: PDF, JSON, Markdown, Claude Code Bundle
- [ ] Activity timeline shows all events in chronological order
- [ ] Score overrides can be set and cleared, showing a "Manual" badge when overridden

### Analytics
- [ ] All four summary cards display correct values
- [ ] Date range selector filters all charts simultaneously
- [ ] Submissions over time chart renders with correct bucketing (daily/weekly/monthly)
- [ ] Department chart shows correct counts sorted descending
- [ ] Project type donut chart shows correct distribution
- [ ] Protection level chart uses correct P-level colors
- [ ] Data sources chart shows reasonable extraction from submission data

### Prioritization Matrix
- [ ] Scatter plot renders with correct Impact (Y) and Effort (X) axes
- [ ] Dot color matches submission status
- [ ] Dot size reflects estimated time savings
- [ ] Hover tooltip shows submission details
- [ ] Click navigates to submission detail
- [ ] Quadrant labels are visible
- [ ] Ranked list view shows correct composite priority scores
- [ ] Toggle between scatter and list works
- [ ] Manual score overrides are reflected in both views

### Responsive Design
- [ ] Desktop (1280px+): Full layout with sidebar, two-column detail, all table columns
- [ ] Tablet (768px-1279px): Collapsed sidebar, single-column detail, reduced table columns
- [ ] All interactive elements are usable on tablet with touch

### Performance
- [ ] Submission queue loads within 500ms for 100 submissions
- [ ] Analytics page loads within 1 second
- [ ] Pagination does not re-fetch already-cached pages (TanStack Query cache)
- [ ] Optimistic updates make status changes feel instant

---

## 17. Open Questions

> These items need team discussion before implementation:

1. **Email service for follow-up questions (section 5e):** Which email provider should we use? SendGrid, Postmark, AWS SES, or SMTP relay through UCSD? This affects the `POST /api/admin/submissions/:id/question` implementation.

2. **UCSD SSO upgrade path:** When should SSO integration happen? Is this a Phase 4 item? Does campus IT need lead time for Shibboleth/SAML configuration?

3. **Real-time updates:** Should the queue auto-refresh when new submissions come in? WebSockets or polling? Phase 3 can start with manual refresh + stale-while-revalidate, but real-time is better for a team tool.

4. **PDF generation approach:** Client-side `window.print()` with CSS is simpler but less controllable. Server-side Puppeteer gives pixel-perfect PDFs but requires a headless browser on the server. Which approach?

5. **Data retention policy:** Should archived submissions be permanently deletable? How long should activity logs be retained?

6. **Notification system:** Beyond the "send question" email, should admins get notifications (email or in-app) when new submissions arrive or when users answer follow-up questions?
