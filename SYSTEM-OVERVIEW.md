# System Overview — UCSD AgentBuilder

> **Purpose**: Comprehensive reference for any agent or developer working on this codebase. Covers every feature, data flow, component, and integration point.

---

## 1. What This Application Does

UCSD AgentBuilder is a guided decision-tree tool that helps non-technical UCSD business users plan AI-powered workflows. Users walk through a **GATHER → REFINE → PRESENT** pipeline, answering questions about their data, AI tasks, and desired outputs. The system classifies data by UC protection level (P1–P4), enforces feasibility constraints, runs AI-powered gap analysis, generates a polished summary, and lets users submit their intake request to the TritonAI team.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend framework** | React 19 + TypeScript 5.9 |
| **Build tool** | Vite 7 with `@vitejs/plugin-react` |
| **Styling** | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + UCSD brand tokens |
| **State management** | Zustand 5 with `persist` middleware (localStorage) |
| **Routing** | React Router v7 — HashRouter for GitHub Pages compatibility |
| **Visualization** | React Flow (`@xyflow/react`) for pipeline diagram |
| **Animation** | Framer Motion for page/component transitions |
| **Markdown rendering** | `react-markdown` |
| **Icons** | `lucide-react` |
| **CSS utilities** | `clsx` + `tailwind-merge` via `cn()` helper |
| **Backend framework** | Hono (Node.js) |
| **Database** | SQLite via `better-sqlite3` (WAL mode, file-based) |
| **LLM** | OpenAI API with Zod-validated structured outputs |
| **Deployment** | GitHub Pages (frontend), Node.js server (backend) |

---

## 3. Project Structure

```
/
├── src/                        # Frontend source
│   ├── components/
│   │   ├── landing/            # LandingPage, EmailPrompt, SubmissionCard, SubmissionsList
│   │   ├── describe/           # DescribeIdeaForm
│   │   ├── gather/             # GatherDetailForm
│   │   ├── refine/             # RefineDetailForm
│   │   ├── present/            # OutputPicker, OutputCard, FeasibilityCheck, MultiFeasibilityCheck
│   │   ├── wizard/             # QuestionCard, OptionButton, WizardMode, ClassificationResult
│   │   ├── pipeline/           # PipelineView, StageNode, StageEdge
│   │   ├── summary/            # SummaryView, AISummaryView, EditableSection, SummaryExportBar,
│   │   │                       #   SummaryTabToggle, MyAnswersView, AnswerCard, DecisionPathDisplay,
│   │   │                       #   ManualEditConflict, UnansweredQuestionsPanel, SummaryLoadingState
│   │   ├── gap-analysis/       # GapAnalysisPage, GapQuestionList, ReclassificationBanner
│   │   ├── guidance/           # Guidance page component
│   │   └── layout/             # Header, Footer, Breadcrumbs, ProgressBar, StagesSidebar
│   ├── data/
│   │   ├── gather-tree.ts      # GATHER stage decision tree
│   │   ├── refine-tree.ts      # REFINE stage decision tree
│   │   ├── present-tree.ts     # PRESENT stage decision tree
│   │   ├── feasibility-matrix.ts  # Output format × protection level constraints
│   │   └── guidance/           # Markdown content for P1–P4 guidance pages
│   ├── hooks/
│   │   ├── use-decision-tree.ts   # Wraps tree engine for wizard components
│   │   ├── use-gap-analysis.ts    # Gap analysis API integration
│   │   ├── use-ai-summary.ts      # AI summary generation + edit tracking
│   │   ├── use-user-email.ts      # Email state (localStorage)
│   │   ├── use-submissions.ts     # Fetch user's past submissions from API
│   │   ├── use-auto-save.ts       # Debounced auto-save to backend
│   │   ├── use-start-over.ts      # Reset session + navigate home
│   │   └── use-breadcrumbs.ts     # Generate breadcrumb trail from state
│   ├── lib/
│   │   ├── tree-engine.ts         # Core decision tree traversal + classification
│   │   ├── summary-formatter.ts   # Build IntakePayload JSON, plaintext, mailto, clipboard
│   │   ├── summary-markdown.ts    # Build full markdown spec from AI sections + gap answers
│   │   ├── api-client.ts          # HTTP client for all backend API calls
│   │   └── utils.ts               # cn(), generateId(), timeAgo()
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Describe.tsx
│   │   ├── Pipeline.tsx
│   │   ├── Stage.tsx
│   │   ├── GapAnalysis.tsx
│   │   ├── Summary.tsx
│   │   └── Guidance.tsx
│   ├── store/
│   │   └── session-store.ts       # Zustand store (single source of truth)
│   ├── types/
│   │   ├── decision-tree.ts       # DecisionNode, Stage, ProtectionLevel, OutputFormat, etc.
│   │   └── gap-analysis.ts        # GapQuestion, Reclassification, AISummaryState
│   ├── styles/
│   │   └── print.css              # Print-specific overrides
│   ├── index.css                  # Tailwind import + UCSD design tokens
│   └── main.tsx                   # React entry point
├── server/                     # Backend source
│   ├── src/
│   │   ├── index.ts               # Hono app, routes, CORS, static serving
│   │   ├── db.ts                  # SQLite setup, submissions table, CRUD operations
│   │   ├── llm/
│   │   │   ├── client.ts          # OpenAI API calls (gap analysis, summary generation)
│   │   │   ├── schemas.ts         # Zod schemas for structured LLM output
│   │   │   └── prompts.ts         # System/user prompts with example submissions
│   │   └── lib/
│   │       └── webhook.ts         # Forward submissions to TritonAI webhook
│   ├── data/
│   │   └── agentbuilder.db        # SQLite database file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                       # OPENAI_API_KEY, OPENAI_MODEL, WEBHOOK_URL, PORT, CORS_ORIGIN
├── .github/workflows/
│   └── deploy.yml                 # CI/CD: build + deploy to GitHub Pages
├── vite.config.ts
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── index.html
```

---

## 4. User Flow (Complete Walkthrough)

### 4.1 Landing Page (`/`)

- Hero section with title "Request an AI Tool" and 4-step visual preview
- **"Get Started"** button resets the session and navigates to `/describe`
- **Email Prompt**: Users enter their UCSD email to enable progress saving and viewing past submissions (stored in localStorage via `useUserEmail` hook)
- **Submissions List**: If identified, shows past submissions as cards with status badges (Draft/Submitted). Clicking a submission restores the session state and routes to the appropriate page based on completion progress

### 4.2 Describe Page (`/describe`)

- **DescribeIdeaForm** collects structured project intake:
  - Required: Title (100 chars), Description (2000 chars)
  - Optional: Domain (select), Timeline (button toggle), Goal, Status, Current Process (textarea), Complexity, Preferred Tool
- On submit → stores via `setProjectIdea()` → navigates to `/pipeline`

### 4.3 Pipeline Page (`/pipeline`)

- **Route guard**: Redirects to `/describe` if no `projectIdea` exists
- **React Flow visualization** with 3 custom `StageNode` components connected by `StageEdge` edges
- Nodes are clickable → navigate to `/stage/GATHER`, `/stage/REFINE`, `/stage/PRESENT`
- Shows transition messages after each stage completes
- When all 3 complete → "View Complete Summary" button → `/gap-analysis`

### 4.4 Stage Pages (`/stage/:stageId`)

Each stage follows this pattern: **Wizard Q&A → Detail Form → Classification Result**

**GATHER Stage** — Classifies data protection level:
1. Multi-choice question: "What kind of data?" (public, internal, special access, sensitive, user-provided, unsure)
2. If "unsure" → helper flow with access-level questions
3. Confirmation screen for determined level (P1/P2/P3)
4. P4 special path: warns AI is prohibited, offers reclassify/de-identify/accept options
5. **GatherDetailForm**: data types (multi-select), source systems, data size, regulatory context (FERPA/HIPAA/etc.), notes
6. **ClassificationResult**: shows determined level with "Continue" / "View Guidance" / "Go Back"

**REFINE Stage** — Defines AI tasks:
1. Single-choice: task type (summarize, analyze, compare, recommend, classify, answer, generate, extract)
2. Single-choice: data transformation (as-is, filter, combine, de-identify)
3. Single-choice: audience scope (just me, my team, campus-wide, public) — reclassifies protection level
4. Warning if audience is broad, with option to narrow
5. Confirmation screen
6. **RefineDetailForm**: one or more refinement entries (task type, description, data prep), additional context

**PRESENT Stage** — Chooses output format(s):
1. **OutputPicker**: grid of 12 output formats (chat, dashboard, report, app, email digest, slides, alerts, knowledge base, API feed, automation, integration, widget)
2. Supports single or multi-select with per-format descriptions
3. **FeasibilityCheck** (single) or **MultiFeasibilityCheck** (multiple): validates each format against protection level using the feasibility matrix
4. Shows conditions (e.g., "Requires SSO") or suggests alternatives if not allowed
5. On confirm → stores `PresentDetails` → navigates to `/gap-analysis`

### 4.5 Gap Analysis Page (`/gap-analysis`)

- Auto-runs gap analysis on mount via `useGapAnalysis` hook
- **POST /api/gap-analysis** sends the full `IntakePayload` to the LLM
- LLM returns up to 20 questions (critical or nice-to-have) + overall assessment + optional reclassification
- Users answer questions (free text, single choice, or multi choice) or snooze them
- **ReclassificationBanner**: if LLM suggests a different protection level, shows accept/reject
- Progress counter: "X of Y questions resolved"
- When all resolved → "Generate Summary" button → navigates to `/summary`

### 4.6 Summary Page (`/summary`)

- **AISummaryView**: Full AI-generated polished summary
  - Tab toggle: "AI Summary" vs "My Answers"
  - 7 editable sections: Executive Summary, Project Overview, Data Classification, AI Processing Plan, Output Deliverables, Feasibility Summary (markdown table), Compliance & Next Steps
  - **EditableSection** components with inline editing (pencil icon, auto-expanding textarea)
  - **ManualEditConflict** detection if sections are regenerated after manual edits
  - **UnansweredQuestionsPanel** for snoozed gap questions
- **MyAnswersView**: raw answers organized by stage with `DecisionPathDisplay`
- **SummaryExportBar**:
  - Download JSON (full `IntakePayload`)
  - Copy as Markdown (via `buildSpecMarkdown`)
  - Share via Email (mailto link with plaintext summary)
  - Print / Save as PDF (custom print CSS)
  - Submit to TritonAI (POST /api/submit → persists to DB + webhook)

### 4.7 Guidance Pages (`/guidance/:guidanceId`)

- Standalone markdown-rendered pages for each protection level (p1–p4)
- Content covers: what it means, requirements, resources, UCSD contacts
- Accessible from ClassificationResult "View Guidance" button or direct URL

---

## 5. Decision Tree Engine

### Core Mechanism (`src/lib/tree-engine.ts`)

Trees are arrays of `DecisionNode` objects. Each node has `options`, and each option has a `nextNodeId` (or `null` for terminal nodes). The engine provides:

- `getTreeForStage(stage)` → full tree array
- `getStartNode(stage)` → first node (tree[0])
- `getNodeById(stage, nodeId)` → lookup by ID
- `classifyProtectionLevel(answers, stage)` → scans nodes with `classifiesProtectionLevel: true`, extracts protection levels from selected options (handles comma-separated multi-select), returns **highest rank** (P4 > P3 > P2 > P1)
- `checkFeasibility(outputFormat, protectionLevel)` → queries feasibility matrix
- `mapOptionIdToOutputFormat(optionId)` → e.g., `'pick-chat'` → `'chat'`

### React Hook (`src/hooks/use-decision-tree.ts`)

Wraps the engine with Zustand store integration:

- `selectOption(optionId)` — records answer, pushes history, navigates to next node or completes stage
- `selectMultipleOptions(optionIds)` — handles multi-select with exclusive "don't know" option, routes to confirmation node for highest protection level
- `goBack()` — pops history stack
- `canGoBack` — boolean

### Tree Structures

**GATHER** (data classification):
```
gather-start (multi_choice) → data source selection
  ├── Confirmation nodes (P1, P2, P3) → allows reclassify
  ├── P4 stop node → 3 paths: accept, reclassify, de-identify
  └── Help flow → access-level questions → confirms level
```

**REFINE** (AI task definition):
```
refine-task → refine-transform → refine-audience → refine-confirm
  └── refine-audience-warning (if broad audience) → back or proceed
```

**PRESENT** (output format):
```
present-format → present-confirm
  └── change-format → back to format picker
```

### Feasibility Matrix (`src/data/feasibility-matrix.ts`)

Maps `OutputFormat × ProtectionLevel → FeasibilityResult`:
- **P1**: All formats allowed, no conditions
- **P2**: Most formats allowed with SSO condition
- **P3**: Some formats allowed with encryption + audit; some not allowed (e.g., email_digest)
- **P4**: All formats **not_allowed** (AI prohibited for restricted data)

Each entry includes `feasibility`, optional `conditions` text, and optional `alternativeSuggestion`.

---

## 6. State Management

### Zustand Store (`src/store/session-store.ts`)

Single store with `persist` middleware → localStorage key `ucsd-agentbuilder-session`, currently version **5**.

**Shape:**
```
sessionId                              — unique session ID
stages                                 — Record<Stage, { status, result? }>
currentStage                           — active stage or null
currentNodeId                          — current wizard question node
history                                — Array<{ stage, nodeId }> for back navigation
stageAnswers                           — Record<Stage, Record<nodeId, optionId(s)>>
projectIdea                            — ProjectIdea object (title, description, domain, etc.)
gatherDetails                          — GatherDetails (data types, source, size, regulatory, notes)
refineDetails                          — RefineDetails (refinements array + context)
presentDetails                         — PresentDetails (outputs array with format + feasibility)
gapAnalysis                            — { status, questions[], assessment, reclassification?, runCount }
aiSummary                              — { status, sections (7 keys), manualEdits, errorMessage? }
```

**Key Actions:**
- `setCurrentStage`, `setCurrentNode`, `recordAnswer`, `pushHistory`, `popHistory`
- `completeStage(stage, protectionLevel, outputFormat?)` — marks stage complete with result
- `getEffectiveProtectionLevel()` — returns highest protection level from GATHER result
- `resetSession()` — full reset with new sessionId
- `getSessionSnapshot()` / `loadSession(snapshot)` — serialize/restore for submission persistence
- `setProjectIdea`, `setGatherDetails`, `setRefineDetails`, `setPresentDetails`
- Gap analysis: `setGapAnalysisLoading/Result/Error`, `answerGapQuestion`, `snoozeGapQuestion`, `unsnoozeGapQuestion`
- AI summary: `setAISummaryLoading/Result/Error`, `editSummarySection`, `clearManualEdit`
- `applyReclassification(newLevel)` — updates GATHER protection level from gap analysis suggestion

**Migrations:** v1→v2 (intake fields), v2→v3 (dataType string→array), v3→v4 (new ProjectIdea fields + regulatoryContext), v4→v5 (gapAnalysis + aiSummary states)

---

## 7. TypeScript Types

### Core Types (`src/types/decision-tree.ts`)

```typescript
Stage = 'GATHER' | 'REFINE' | 'PRESENT'
StageStatus = 'not_started' | 'in_progress' | 'complete'
ProtectionLevel = 'P1' | 'P2' | 'P3' | 'P4'
Feasibility = 'allowed' | 'allowed_with_conditions' | 'not_allowed'
OutputFormat = 'chat' | 'dashboard' | 'static_report' | 'interactive_app'
             | 'email_digest' | 'slide_deck' | 'api_feed' | 'smart_alerts'
             | 'knowledge_base' | 'workflow_automation' | 'system_integration' | 'embedded_widget'

DecisionNode { id, stage, question, description?, inputType, options[], classifiesProtectionLevel? }
DecisionOption { id, label, description?, icon?, mapsToProtectionLevel?, nextNodeId }
StageResult { stage, protectionLevel, answers, outputFormat? }
FeasibilityResult { feasibility, conditions?, alternativeSuggestion? }

ProjectIdea { title, description, domain, timeline, existingStatus, projectGoal,
              currentProcess, projectComplexity, preferredTool }
GatherDetails { dataType: string[], sourceSystem, dataSize, regulatoryContext: string[], additionalNotes }
Refinement { id, taskType, description, dataPrep }
RefineDetails { refinements: Refinement[], additionalContext }
OutputSelection { format: OutputFormat, description, feasibility: FeasibilityResult }
PresentDetails { outputs: OutputSelection[] }
IntakePayload { version, generatedAt, sessionId, projectIdea, gather, refine, present, nextSteps }
```

### Gap Analysis Types (`src/types/gap-analysis.ts`)

```typescript
GapQuestion { id, priority, question, context?, inputType, options?, relatedSection,
              relatedField?, status, answer?, selectedOptions? }
GapQuestionPriority = 'critical' | 'nice_to_have'
GapQuestionStatus = 'pending' | 'answered' | 'snoozed'
Reclassification { currentLevel, suggestedLevel, reason }
AISummaryState { status, sections (7 keys) | null, manualEdits, errorMessage? }
```

---

## 8. Backend Server

### Framework & Setup

- **Hono** web framework on Node.js (`@hono/node-server`)
- Port configurable via `PORT` env var (default 3001)
- CORS middleware on all `/api/*` routes (origin configurable via `CORS_ORIGIN`)
- In production: serves Vite-built static files + SPA fallback for non-API routes

### API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/gap-analysis` | Send IntakePayload to LLM → returns gap questions, assessment, reclassification |
| POST | `/api/generate-summary` | Send IntakePayload + gap answers to LLM → returns 7 polished sections |
| POST | `/api/submit` | Persist final submission to DB + forward to webhook |
| GET | `/api/submissions?email=` | List user's submissions |
| GET | `/api/submissions/:id` | Get single submission with deserialized session state |
| PUT | `/api/submissions/:id` | Upsert submission (email, title, status, sessionState) |
| DELETE | `/api/submissions/:id` | Delete submission |
| GET | `/api/health` | Health check → `{ status: 'ok', timestamp }` |

### Database (`server/src/db.ts`)

SQLite database at `server/data/agentbuilder.db`:
- **Table**: `submissions` (id, email, title, status, session_state JSON, created_at, updated_at)
- **Indexes**: `idx_submissions_email`, `idx_submissions_updated` (DESC)
- WAL mode enabled for concurrency

### LLM Integration (`server/src/llm/`)

- **Client** (`client.ts`): OpenAI `beta.chat.completions.parse()` with Zod schemas for structured output
- **Model**: Configurable via `OPENAI_MODEL` env var (default `gpt-5.2`)
- **Schemas** (`schemas.ts`): Zod schemas matching GapAnalysisResponse and SummaryResponse types
- **Prompts** (`prompts.ts`): System prompt frames AI as UCSD TritonAI intake reviewer; user prompt includes the submission JSON + 3 hardcoded example submissions; special P4 modifier for restricted data

### Webhook (`server/src/lib/webhook.ts`)

- Forwards finalized submissions to external TritonAI system via `WEBHOOK_URL` env var
- Graceful failure: submission persists even if webhook fails

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API authentication |
| `OPENAI_MODEL` | No | `gpt-5.2` | LLM model for gap analysis + summary |
| `WEBHOOK_URL` | No | — | TritonAI webhook endpoint |
| `PORT` | No | `3001` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

---

## 9. Frontend API Client (`src/lib/api-client.ts`)

Wraps all backend calls with error handling:

- `postGapAnalysis(intakePayload, previousGapAnswers?)` → POST `/api/gap-analysis`
- `postGenerateSummary(intakePayload, gapAnswers, signal?)` → POST `/api/generate-summary` (supports AbortSignal)
- `postSubmit(payload)` → POST `/api/submit`
- `fetchSubmissions(email)` → GET `/api/submissions?email=`
- `fetchSubmission(id)` → GET `/api/submissions/:id`
- `saveSubmission(id, data)` → PUT `/api/submissions/:id`

Helper functions: `apiFetch<T>()`, `apiGet<T>()`, `apiPut<T>()`

---

## 10. Hooks Reference

| Hook | Purpose |
|------|---------|
| `useDecisionTree(stage)` | Tree navigation: selectOption, selectMultipleOptions, goBack, currentNode |
| `useGapAnalysis()` | Run gap analysis, answer/snooze questions, handle reclassification |
| `useAISummary()` | Generate summary, track manual edits, detect conflicts |
| `useUserEmail()` | Manage email state in localStorage (email, isIdentified, setEmail, clearEmail) |
| `useSubmissions(email)` | Fetch user's submissions list from API |
| `useAutoSave()` | Debounced (2s) auto-save to backend when email is set and projectIdea exists |
| `useStartOver()` | Reset session + navigate to home |
| `useBreadcrumbs()` | Generate breadcrumb items from current stage/node state |

---

## 11. Component Architecture

### Layout (persistent across all pages)

```
Header          — UCSD branding + "Start Over" button
Breadcrumbs     — Dynamic trail (hidden on landing/describe)
ProgressBar     — 3-stage completion indicator (green/blue/gray)
StagesSidebar   — Left sidebar with question tree (hidden on mobile, landing, describe)
Footer          — Disclaimer text
```

### Page Components

```
LandingPage → EmailPrompt + SubmissionsList → SubmissionCard[]
DescribeIdeaForm → button toggles + textareas
Pipeline → PipelineView → StageNode[] + StageEdge[]
Stage → WizardMode → QuestionCard → OptionButton[]
       → GatherDetailForm / RefineDetailForm
       → ClassificationResult
       → OutputPicker → OutputCard[] → FeasibilityCheck / MultiFeasibilityCheck
GapAnalysis → GapQuestionList + ReclassificationBanner
Summary → AISummaryView / SummaryView
        → SummaryTabToggle, EditableSection[], SummaryExportBar
        → MyAnswersView → AnswerCard[] + DecisionPathDisplay
```

### StagesSidebar Navigation Rules

- GATHER: always accessible
- REFINE: blocked until GATHER complete
- PRESENT: blocked until REFINE complete
- Summary: disabled until all 3 stages complete

---

## 12. Styling & Design

### UCSD Brand Colors (defined in `src/index.css`)

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#182B49` | Primary headers, buttons |
| Blue | `#00629B` | Interactive elements, links |
| Yellow | `#FFCD00` | Accent ("UC" badge) |
| Gold | `#C69214` | Secondary accent |
| Sand | `#F5F0E6` | Card backgrounds |
| Green | `#6E963B` | P1, success states |
| Orange | `#FC8900` | P3, warning states |
| Red | `#C0392B` | P4, error states |

### Protection Level Colors

- **P1** (Public): Green (`#6E963B`)
- **P2** (Internal): Blue (`#00629B`)
- **P3** (Confidential): Orange (`#FC8900`)
- **P4** (Restricted): Red (`#C0392B`)

### Typography

- Font: Roboto (UCSD web alternative to Brix Sans)
- Body: 16px, line-height 1.5
- Headings: font-weight 700, letter-spacing -0.01em

### Animation Patterns (Framer Motion)

- **Page entrance**: `opacity: 0, y: 20 → opacity: 1, y: 0` (0.4s)
- **Staggered lists**: `delay: index * 0.05–0.08`
- **Expand/collapse**: `height: 0 → height: auto` with opacity
- **Loading**: `Loader2` with Tailwind `animate-spin`
- **Hover**: Group-based `translate-x-1` on arrow icons

---

## 13. Export & Sharing

### IntakePayload JSON Structure

```
{
  version: '1.0.0',
  generatedAt: ISO8601,
  sessionId,
  projectIdea: { title, description, domain, timeline, ... },
  gather: { protectionLevel, protectionLevelLabel, selectedDataSources[], details },
  refine: { refinements[], audience, additionalContext },
  present: { outputs[]: { format, formatLabel, description, feasibility, conditions? } },
  nextSteps: string[]
}
```

### Export Formats

1. **JSON download** — `ucsd-ai-intake-{sessionId}.json`
2. **Markdown** — full spec with AI sections + gap answers + raw data (`buildSpecMarkdown`)
3. **Email** — plaintext summary via mailto link
4. **Clipboard** — markdown formatted summary
5. **Print/PDF** — browser print dialog with custom CSS (`src/styles/print.css`)
6. **Submit** — POST to `/api/submit` → persists to DB + forwards to webhook

---

## 14. Auto-Save & Persistence

- **Local**: Zustand `persist` middleware → localStorage key `ucsd-agentbuilder-session` (automatic on every state change)
- **Remote**: `useAutoSave` hook debounces (2s) and calls `PUT /api/submissions/:id` when email is set and projectIdea exists
- **Resume**: Loading a past submission calls `loadSession(snapshot)` which restores the full store state, then routes to the appropriate page based on completion progress

---

## 15. CI/CD

**GitHub Actions** (`.github/workflows/deploy.yml`):
- **Trigger**: Push to `main`, `master`, or `claude/**` branches
- **Build**: Node 22, `npm ci`, `npm run build` (TypeScript check + Vite)
- **Deploy**: Only from main/master → GitHub Pages via `actions/deploy-pages@v4`
- **Result**: Frontend at `https://fogbellco.github.io/AgentBuilder/`

---

## 16. Development Setup

```bash
# Frontend
npm install
npm run dev          # Vite dev server on :5173, proxies /api to :3001

# Backend
cd server
npm install
cp .env.example .env # Set OPENAI_API_KEY
npm run dev          # tsx watch on :3001
```

Vite config proxies `/api/*` to `http://localhost:3001` in development.

---

## 17. Route Guards & Navigation

| Route | Guard | Redirect |
|-------|-------|----------|
| `/` | None | — |
| `/describe` | None | — |
| `/pipeline` | Requires `projectIdea` | → `/describe` |
| `/stage/:stageId` | Auto-redirect if all complete | → `/gap-analysis` |
| `/gap-analysis` | Implicit (all stages expected) | — |
| `/summary` | Implicit (all stages expected) | — |
| `/guidance/:guidanceId` | Validates p1–p4 | Shows "Not Found" |

---

## 18. Key Architectural Decisions

1. **HashRouter** over BrowserRouter — GitHub Pages has no SPA fallback
2. **Highest-wins classification** — multiple data sources → highest protection level applies
3. **Feasibility matrix as data** — output format constraints are a static lookup, not computed
4. **P4 blocks everything** — restricted data cannot use any AI output format
5. **Store version migrations** — schema changes bump version number with migration functions
6. **Structured LLM outputs** — Zod schemas enforce response shape from OpenAI API
7. **Manual edit tracking** — AI summary edits stored separately for conflict detection on regeneration
8. **Auto-save to backend** — debounced upserts maintain server-side draft state
