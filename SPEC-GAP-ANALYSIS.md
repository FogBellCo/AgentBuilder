# LLM Gap Analysis & AI-Generated Summary — Feature Specification

## 1. Overview

After the user completes all three pipeline stages (GATHER → REFINE → PRESENT), a new **Gap Analysis** step runs automatically before the final summary. An LLM (OpenAI GPT) reviews everything the user submitted, compares it against the fields required by our intake templates and patterns from strong past submissions, then generates targeted follow-up questions. The user answers what they can, snoozes the rest, and proceeds to an **AI-generated, editable summary** in a fixed 9-section format. Snoozed questions appear on the summary page; answering them triggers a full re-analysis and summary regeneration.

---

## 2. User Flow

```
GATHER → REFINE → PRESENT → [GAP ANALYSIS] → [AI SUMMARY (editable)] → Export / Submit
                                    ↑                        │
                                    └── re-triggered when ───┘
                                        snoozed Q answered
```

### Step-by-step:

1. User completes the PRESENT stage → pipeline page shows all 3 stages complete.
2. User clicks "View Summary" → navigated to `/gap-analysis` (new route).
3. Page loads → spinner with "Analyzing your submission…" → LLM call fires automatically.
4. LLM returns a structured list of follow-up questions (max 20, prioritized as `critical` or `nice_to_have`).
5. Questions render as a **checklist/form** — critical questions first, then nice-to-have, each clearly labeled.
6. For each question the user can:
   - **Answer it** (free-text input or select from LLM-generated choices, depending on question type).
   - **Snooze it** — question disappears from the list and moves to the summary page's "Unanswered Questions" section.
7. When the user is done (answered or snoozed every question), they click "Generate Summary".
8. A second LLM call generates the full 9-section summary using all original data + gap analysis answers.
9. Summary renders as **branded HTML** with inline plain-text editing on every section.
10. Snoozed questions appear in a collapsible "Unanswered Questions" panel at the top of the summary.
11. If the user answers a snoozed question on the summary page → full re-analysis LLM call → summary regenerates.
12. User finalizes → can Export (JSON, Markdown, clipboard) or Submit to TritonAI (webhook).

### Edge cases:

- **LLM finds no gaps**: Show "Looks great — no additional questions!" and auto-proceed to summary generation.
- **P4 submissions**: Gap analysis still runs, but the LLM prompt is tailored to focus on de-identification paths and alternative approaches.
- **All questions snoozed**: User proceeds to summary with all questions in the unanswered panel.

---

## 3. Gap Analysis Page (`/gap-analysis`)

### 3.1 Route & Navigation

- New route: `/gap-analysis`
- Accessible only when all 3 stages are complete (redirect to `/pipeline` otherwise).
- Back button returns to `/pipeline`.
- "Generate Summary" button navigates to `/summary` (or the new AI summary route).

### 3.2 Layout (Checklist/Form Style)

```
┌─────────────────────────────────────────────────┐
│  ← Back                                         │
│                                                  │
│  Reviewing Your Submission            [spinner]  │
│  We're checking for any gaps...                  │
│                                                  │
│ ─── After loading ────────────────────────────── │
│                                                  │
│  ⚠ Critical (3)                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 1. You mentioned FERPA compliance but       │ │
│  │    classified your data as P1 (Public).     │ │
│  │    Can you clarify which data fields are    │ │
│  │    subject to FERPA?                        │ │
│  │                                             │ │
│  │    [________________________] [Snooze 💤]   │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ 2. What volume of records will the AI       │ │
│  │    process? This affects infrastructure.    │ │
│  │                                             │ │
│  │    ○ Under 1,000 records                    │ │
│  │    ○ 1,000 – 100,000 records               │ │
│  │    ○ Over 100,000 records                   │ │
│  │    ○ I'm not sure                [Snooze 💤]│ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ✦ Nice to Have (4)                              │
│  ┌─────────────────────────────────────────────┐ │
│  │ 3. Who is the data steward for this         │ │
│  │    dataset?                                 │ │
│  │                                             │ │
│  │    [________________________] [Snooze 💤]   │ │
│  └─────────────────────────────────────────────┘ │
│  ...                                             │
│                                                  │
│        [ Generate Summary → ]                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 3.3 Question Card Anatomy

Each question is a card containing:

| Element | Description |
|---------|-------------|
| **Priority badge** | `Critical` (amber) or `Nice to Have` (gray) |
| **Question text** | The LLM-generated question (1-3 sentences) |
| **Context note** | Optional: why this was flagged (e.g., "Your description mentions FERPA but your data classification is P1") |
| **Input** | Either a free-text `<textarea>` or a set of radio/checkbox options generated by the LLM |
| **Snooze button** | Moves the question to the summary page's unanswered section |
| **Submit answer** | Saves the answer to the store (per-question, not a page-wide submit) |

### 3.4 States

| State | Display |
|-------|---------|
| `loading` | Centered spinner + "Analyzing your submission…" |
| `questions_ready` | Checklist of questions grouped by priority |
| `no_gaps` | Success message + auto-proceed button to summary |
| `error` | Error message + "Try Again" button |
| `all_resolved` | All answered or snoozed → "Generate Summary" button is prominent |

---

## 4. AI-Generated Summary Page (`/summary`)

### 4.1 Summary Generation

When the user clicks "Generate Summary" on the gap analysis page (or when re-triggered by answering a snoozed question), a second LLM call generates the full summary.

**Input to LLM**: All original `IntakePayload` data + all gap analysis answers.

**Output from LLM**: A structured JSON object matching the 9 fixed sections (see §4.2).

### 4.2 Fixed Summary Sections

The LLM generates content for each section. The section structure is fixed; only the content within each section is AI-generated.

| # | Section | Content |
|---|---------|---------|
| 1 | **Header** | UCSD branding, TritonAI logo, generation date, session ID |
| 2 | **Executive Summary** | 2-3 sentence AI-generated overview of the project, its data classification, AI tasks, and delivery format |
| 3 | **Project Overview** | Title, description, domain, timeline, goal, current process, complexity, preferred tool — enriched by gap analysis answers |
| 4 | **Data Classification** | Protection level badge, selected data sources with levels, data type/size/source system, regulatory context, compliance notes |
| 5 | **AI Processing Plan** | Each refinement task: task type, description, data prep method. Additional context from gap analysis. |
| 6 | **Output Deliverables** | Each selected output format with: description, feasibility status, conditions/requirements |
| 7 | **Feasibility Summary** | Table: format × protection level showing go/no-go for each output |
| 8 | **Compliance & Next Steps** | Protection-level-specific action items, data steward contacts, required approvals |
| 9 | **Technical Notes** | Collapsible raw JSON payload for dev handoff |

### 4.3 Tab Toggle: AI Summary vs. My Answers

The summary page has two tabs at the top, below the header and unanswered questions panel:

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  [ AI Summary ]    [ My Answers ]                │
│  ─────────────                                   │
│                                                  │
│  (active tab content renders below)              │
│                                                  │
└─────────────────────────────────────────────────┘
```

**AI Summary tab** (default): The LLM-generated 9-section summary with inline editing (see §4.4).

**My Answers tab**: A read-only structured view of everything the user actually entered, organized as cards per stage. This gives the user (and the TritonAI reviewer) full transparency into the raw inputs that fed the AI summary.

#### My Answers — Card Layout

One card per section, each showing the decision tree path taken and detail form values:

```
┌─────────────────────────────────────────────────┐
│  Project Idea                                    │
│  ─────────────                                   │
│  Title:          AI Agent for Transaction...     │
│  Description:    Campus users have a painpoint...│
│  Domain:         Business & Financial Services   │
│  Timeline:       6-12 months                     │
│  Goal:           Consolidate approval workflows  │
│  Current Status: No — new project                │
│  How It's Done:  Users log into each system...   │
│  Complexity:     High                            │
│  Preferred Tool: TritonGPT                       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  GATHER — Data Classification                    │
│  ─────────────────────────────                   │
│  Decision Path:                                  │
│    Where does your data live?                    │
│    → UCSD internal system                        │
│    Your data is Internal (P2)                    │
│    → That sounds right — continue                │
│                                                  │
│  Protection Level:  P2 (Internal)                │
│  Data Type:         Transactional records, ...   │
│  Source System:     Oracle, Concur, Kuali, ...   │
│  Data Size:         10,000+ records              │
│  Regulatory:        None                         │
│  Additional Notes:  —                            │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  REFINE — AI Processing Plan                     │
│  ───────────────────────────                     │
│  Decision Path:                                  │
│    What do you want AI to do?                    │
│    → Summarize or extract key points             │
│    How should data be prepared?                  │
│    → Combine multiple data sources               │
│    Who will see the output?                      │
│    → My team or department                       │
│                                                  │
│  Refinements:                                    │
│    1. Extract — Pull pending approval data...    │
│    2. Summarize — Present consolidated view...   │
│  Additional Context: —                           │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  PRESENT — Output Deliverables                   │
│  ─────────────────────────────                   │
│  Decision Path:                                  │
│    How do you want to see results?               │
│    → AI Chat Assistant                           │
│                                                  │
│  Selected Outputs:                               │
│    1. Chat — Conversational interface...         │
│       Feasibility: Allowed                       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Gap Analysis Answers                            │
│  ────────────────────                            │
│  (Only shown if the user answered any gap Qs)    │
│                                                  │
│  Q: Which data fields are subject to FERPA?      │
│  A: Student enrollment records and GPA data      │
│                                                  │
│  Q: What volume of records will be processed?    │
│  A: 1,000 – 100,000 records                     │
└─────────────────────────────────────────────────┘
```

Each card uses the same UCSD brand styling (navy headers, rounded borders, consistent spacing). The decision path section reconstructs the user's journey through the decision tree by mapping their `stageAnswers` back to the tree node questions and selected option labels.

#### My Answers — Component

New component: `src/components/summary/MyAnswersView.tsx`

Props:
```typescript
interface MyAnswersViewProps {
  projectIdea: ProjectIdea | null;
  stages: Record<Stage, { status: StageStatus; result?: StageResult }>;
  gatherDetails: GatherDetails | null;
  refineDetails: RefineDetails | null;
  presentDetails: PresentDetails | null;
  gapQuestions: GapQuestion[]; // only answered ones
}
```

This component is **read-only** — no editing. If the user wants to change something, they go back through the pipeline stages or answer gap analysis questions.

#### Export Includes Both Views

When exporting (JSON, Markdown, or submitting to TritonAI), the payload includes **both**:
- The AI-generated summary sections (with any manual edits)
- The raw structured answers (full `IntakePayload` + gap analysis Q&A)

This ensures the TritonAI team can see the polished summary *and* verify against the original inputs.

### 4.4 Inline Editing (AI Summary Tab)

- Every section (except Header, Feasibility table, and Technical Notes) is **editable**.
- Clicking a section enters edit mode: the rendered HTML is replaced with a `<textarea>` containing the plain-text/markdown content.
- Clicking outside or pressing Escape saves the edit.
- A small "Edit" pencil icon appears on hover for each editable section.
- Edits are stored in the Zustand store and persist across page reloads.
- Manual edits are **preserved** across LLM re-generations — if the user edited a section, the re-generated version shows a diff or prompt asking whether to keep their edit or accept the new version.

### 4.4 Unanswered Questions Panel

At the top of the summary page (below the header), a collapsible panel shows all snoozed questions:

```
┌─────────────────────────────────────────────────┐
│  📋 Unanswered Questions (3)            [▼/▲]   │
│                                                  │
│  1. [Critical] Which data fields are subject     │
│     to FERPA?                                    │
│     [________________________] [Submit]           │
│                                                  │
│  2. [Nice to Have] Who is the data steward?      │
│     [________________________] [Submit]           │
│                                                  │
│  3. [Nice to Have] Expected response time for    │
│     the chat assistant?                          │
│     [________________________] [Submit]           │
│                                                  │
│  Answering a question will regenerate your       │
│  summary with the new information.               │
└─────────────────────────────────────────────────┘
```

When the user answers and submits a snoozed question:
1. Spinner overlays the summary ("Updating your summary…").
2. Full re-analysis LLM call fires with all data including the new answer.
3. LLM may return new follow-up questions (added to the unanswered panel) or update existing ones.
4. Summary is regenerated. If the user had manual edits, they're prompted per-section: "Keep your edit" or "Accept new version".

### 4.5 Reclassification

If a gap analysis answer reveals that the protection level should change (e.g., user confirms FERPA data is involved → should be P3 not P1), the LLM response can include a `reclassification` field:

```json
{
  "reclassification": {
    "currentLevel": "P1",
    "suggestedLevel": "P3",
    "reason": "You confirmed this dataset contains FERPA-protected student records."
  }
}
```

The UI shows a prominent banner:

```
⚠ Protection Level Change Suggested
Based on your answer, this project may need to be reclassified
from P1 (Public) to P3 (Confidential).

[ Accept Reclassification ]    [ Keep Current Level ]
```

If accepted, the protection level is updated in the store, the feasibility matrix is re-evaluated, and the summary is regenerated.

### 4.6 Export & Submit

After the summary, action buttons:

| Button | Action |
|--------|--------|
| **Download JSON** | Downloads the full `IntakePayload` + gap analysis data as JSON |
| **Copy as Markdown** | Copies the AI-generated summary as clean Markdown to clipboard |
| **Share via Email** | Opens mailto with the Markdown summary |
| **Print / Save as PDF** | Browser print dialog with print-friendly CSS |
| **Submit to TritonAI** | POSTs the payload to the backend webhook (see §7) |

---

## 5. LLM Integration

### 5.1 Provider

**OpenAI GPT** (latest available model, currently `gpt-5.4` or equivalent). Use the OpenAI Node.js SDK (`openai` npm package) with **Zod structured outputs** for type-safe response parsing.

### 5.2 Two LLM Calls

| Call | Trigger | Purpose |
|------|---------|---------|
| **Gap Analysis** | Automatic on `/gap-analysis` page load | Analyze intake data, compare against templates/examples, generate follow-up questions |
| **Summary Generation** | User clicks "Generate Summary" or answers a snoozed question | Generate the full 9-section summary from all available data |

### 5.3 Gap Analysis Prompt

**System prompt:**

```
You are an intake reviewer for UCSD's TritonAI team. You review AI project
intake submissions from non-technical university staff and identify gaps,
missing details, vague descriptions, and contradictions.

You have access to:
1. The intake form schema (all fields and what they represent)
2. Examples of strong, complete submissions
3. UC data classification policy (P1–P4)

Your job:
- Compare the submission against the required fields and examples
- Identify what's missing, vague, or contradictory
- Generate targeted follow-up questions (max 20)
- Prioritize each question as "critical" (blocks the team from acting)
  or "nice_to_have" (would improve the submission)
- For each question, decide if it should be free-text or multiple-choice
- If multiple-choice, generate 2-4 clear options
- Flag any contradictions between answers (e.g., P1 classification but
  FERPA-regulated data)
- If the data suggests the protection level may be wrong, note this

Output your analysis as structured JSON matching the provided schema.
```

**User prompt:**

```
Here is the user's intake submission:

<submission>
{JSON.stringify(intakePayload, null, 2)}
</submission>

Here are examples of strong, complete submissions for reference:

<example_1>
{example submission 1 — hardcoded}
</example_1>

<example_2>
{example submission 2 — hardcoded}
</example_2>

<example_3>
{example submission 3 — hardcoded}
</example_3>

Analyze this submission and generate follow-up questions.
```

**Structured output schema (Zod):**

```typescript
import { z } from 'zod';

const GapQuestionSchema = z.object({
  id: z.string().describe('Unique question identifier, e.g. gap-q-1'),
  priority: z.enum(['critical', 'nice_to_have']),
  question: z.string().describe('The follow-up question to ask the user'),
  context: z.string().optional().describe('Why this question was generated — what gap or contradiction was detected'),
  inputType: z.enum(['free_text', 'single_choice', 'multi_choice']),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })).optional().describe('Only present when inputType is single_choice or multi_choice'),
  relatedSection: z.enum([
    'project_overview',
    'data_classification',
    'ai_processing',
    'output_deliverables',
    'compliance',
  ]).describe('Which summary section this question relates to'),
  relatedField: z.string().optional().describe('The specific IntakePayload field this question aims to fill, e.g. "projectIdea.currentProcess"'),
});

const ReclassificationSchema = z.object({
  currentLevel: z.enum(['P1', 'P2', 'P3', 'P4']),
  suggestedLevel: z.enum(['P1', 'P2', 'P3', 'P4']),
  reason: z.string(),
}).optional();

const GapAnalysisResponseSchema = z.object({
  questions: z.array(GapQuestionSchema).max(20),
  overallAssessment: z.string().describe('1-2 sentence overall assessment of submission completeness'),
  reclassification: ReclassificationSchema,
});
```

### 5.4 Summary Generation Prompt

**System prompt:**

```
You are a technical writer for UCSD's TritonAI team. You generate polished,
professional project intake summaries from structured data.

You must output content for exactly 9 sections in the specified JSON format.
Write in clear, professional language appropriate for a university audience.
The executive summary should be 2-3 sentences. Other sections should be
thorough but concise.

Use the gap analysis answers to enrich sections where the original intake
data was sparse. If gap analysis answers contradict the original data,
prefer the gap analysis answer (it's more recent/specific).

For the Compliance & Next Steps section, tailor recommendations to the
protection level. For P4 submissions, focus on de-identification paths
and alternative approaches.
```

**Structured output schema (Zod):**

```typescript
const SummarySectionSchema = z.object({
  executiveSummary: z.string(),
  projectOverview: z.string(),
  dataClassification: z.string(),
  aiProcessingPlan: z.string(),
  outputDeliverables: z.string(),
  feasibilitySummary: z.string().describe('Markdown table of format × protection level'),
  complianceAndNextSteps: z.string(),
});

const SummaryResponseSchema = z.object({
  sections: SummarySectionSchema,
  reclassification: ReclassificationSchema,
});
```

Note: Header and Technical Notes sections are not LLM-generated — they are rendered from structured data directly.

### 5.5 P4-Tailored Prompt Modifier

When the effective protection level is P4, append to the gap analysis system prompt:

```
IMPORTANT: This submission involves P4 (Restricted) data where AI use is
currently prohibited under UC policy. Focus your questions on:
- Whether de-identification is feasible
- What specific restricted data elements are involved
- Whether a non-restricted subset could achieve the project goals
- What approvals or exemptions might apply
Do NOT ask questions about output formats or AI task details that assume
the project will proceed as-is with restricted data.
```

---

## 6. Data Model & State

### 6.1 New Types

```typescript
// src/types/gap-analysis.ts

export type GapQuestionPriority = 'critical' | 'nice_to_have';
export type GapQuestionInputType = 'free_text' | 'single_choice' | 'multi_choice';
export type GapQuestionStatus = 'pending' | 'answered' | 'snoozed';

export type GapRelatedSection =
  | 'project_overview'
  | 'data_classification'
  | 'ai_processing'
  | 'output_deliverables'
  | 'compliance';

export interface GapQuestionOption {
  id: string;
  label: string;
}

export interface GapQuestion {
  id: string;
  priority: GapQuestionPriority;
  question: string;
  context?: string;
  inputType: GapQuestionInputType;
  options?: GapQuestionOption[];
  relatedSection: GapRelatedSection;
  relatedField?: string;
  status: GapQuestionStatus;
  answer?: string;           // free-text answer
  selectedOptions?: string[]; // selected option IDs for choice questions
}

export interface Reclassification {
  currentLevel: ProtectionLevel;
  suggestedLevel: ProtectionLevel;
  reason: string;
}

export interface GapAnalysisState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  questions: GapQuestion[];
  overallAssessment: string;
  reclassification?: Reclassification;
  errorMessage?: string;
  runCount: number; // how many times gap analysis has been run this session
}

export interface AISummaryState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sections: {
    executiveSummary: string;
    projectOverview: string;
    dataClassification: string;
    aiProcessingPlan: string;
    outputDeliverables: string;
    feasibilitySummary: string;
    complianceAndNextSteps: string;
  } | null;
  manualEdits: Record<string, string>; // sectionKey → edited content
  errorMessage?: string;
}
```

### 6.2 Store Changes

Add to the Zustand store (`session-store.ts`):

```typescript
interface SessionState {
  // ... existing fields ...

  // Gap Analysis
  gapAnalysis: GapAnalysisState;
  setGapAnalysisLoading: () => void;
  setGapAnalysisResult: (questions: GapQuestion[], assessment: string, reclassification?: Reclassification) => void;
  setGapAnalysisError: (message: string) => void;
  answerGapQuestion: (questionId: string, answer: string, selectedOptions?: string[]) => void;
  snoozeGapQuestion: (questionId: string) => void;
  unsnoozeGapQuestion: (questionId: string) => void;

  // AI Summary
  aiSummary: AISummaryState;
  setAISummaryLoading: () => void;
  setAISummaryResult: (sections: AISummaryState['sections']) => void;
  setAISummaryError: (message: string) => void;
  editSummarySection: (sectionKey: string, content: string) => void;
  clearManualEdit: (sectionKey: string) => void;

  // Reclassification
  applyReclassification: (newLevel: ProtectionLevel) => void;
}
```

**Store version**: Bump to `v5`. Migration adds `gapAnalysis` and `aiSummary` with default idle states.

### 6.3 Persistence

Both `gapAnalysis` and `aiSummary` persist to localStorage via the existing Zustand `persist` middleware. This means:
- Closing the browser and reopening preserves gap analysis state.
- The user doesn't lose answers if they accidentally navigate away.

---

## 7. Backend / API Layer

### 7.1 Architecture

A lightweight backend is required to:
1. Proxy LLM calls (keeps the OpenAI API key server-side).
2. Forward finalized submissions to the TritonAI webhook.
3. Store submission records.

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend    │────▶│   Backend API    │────▶│  OpenAI API  │
│   (React)    │◀────│   (Node.js)      │◀────│              │
└──────────────┘     │                  │     └──────────────┘
                     │  POST /api/gap   │
                     │  POST /api/summary│
                     │  POST /api/submit │
                     └──────────────────┘
                              │
                     ┌────────┴────────┐
                     │   Webhook URL   │
                     │   (TritonAI)    │
                     └─────────────────┘
```

### 7.2 API Endpoints

#### `POST /api/gap-analysis`

Proxies the gap analysis LLM call.

**Request body:**
```json
{
  "intakePayload": { /* full IntakePayload */ },
  "previousGapAnswers": { /* any previously answered gap questions */ }
}
```

**Response:**
```json
{
  "questions": [ /* GapQuestion[] */ ],
  "overallAssessment": "string",
  "reclassification": { /* optional */ }
}
```

**Error response:**
```json
{
  "error": "string",
  "retryable": true
}
```

#### `POST /api/generate-summary`

Proxies the summary generation LLM call.

**Request body:**
```json
{
  "intakePayload": { /* full IntakePayload */ },
  "gapAnswers": [ /* answered GapQuestion[] */ ]
}
```

**Response:**
```json
{
  "sections": {
    "executiveSummary": "string",
    "projectOverview": "string",
    "dataClassification": "string",
    "aiProcessingPlan": "string",
    "outputDeliverables": "string",
    "feasibilitySummary": "string (markdown table)",
    "complianceAndNextSteps": "string"
  },
  "reclassification": { /* optional */ }
}
```

#### `POST /api/submit`

Submits the finalized intake to the TritonAI webhook. (Same as SPEC.md F2 — no changes.)

### 7.3 Backend Implementation

**Stack**: Node.js + TypeScript + Hono (lightweight, fast).

**Key files:**
```
server/
├── src/
│   ├── index.ts              # Hono app, routes, middleware
│   ├── routes/
│   │   ├── gap-analysis.ts   # POST /api/gap-analysis
│   │   ├── summary.ts        # POST /api/generate-summary
│   │   └── submit.ts         # POST /api/submit
│   ├── llm/
│   │   ├── client.ts         # OpenAI client initialization
│   │   ├── prompts.ts        # System/user prompt templates
│   │   ├── schemas.ts        # Zod schemas for structured output
│   │   └── examples.ts       # Hardcoded example submissions
│   └── lib/
│       └── webhook.ts        # Webhook forwarding logic
├── package.json
├── tsconfig.json
└── .env.example
```

**OpenAI client usage (server/src/llm/client.ts):**

```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { GapAnalysisResponseSchema, SummaryResponseSchema } from './schemas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runGapAnalysis(intakePayload: IntakePayload, previousAnswers?: GapQuestion[]) {
  const completion = await openai.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      { role: 'system', content: buildGapAnalysisSystemPrompt(intakePayload) },
      { role: 'user', content: buildGapAnalysisUserPrompt(intakePayload, previousAnswers) },
    ],
    response_format: zodResponseFormat(GapAnalysisResponseSchema, 'gap_analysis'),
  });

  return completion.choices[0]?.message?.parsed;
}

export async function runSummaryGeneration(intakePayload: IntakePayload, gapAnswers: GapQuestion[]) {
  const completion = await openai.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      { role: 'system', content: buildSummarySystemPrompt() },
      { role: 'user', content: buildSummaryUserPrompt(intakePayload, gapAnswers) },
    ],
    response_format: zodResponseFormat(SummaryResponseSchema, 'summary'),
  });

  return completion.choices[0]?.message?.parsed;
}
```

### 7.4 Environment Variables

```env
# .env.example
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2          # Override model name
WEBHOOK_URL=https://...       # TritonAI webhook endpoint
PORT=3001                     # Backend port
CORS_ORIGIN=http://localhost:5173  # Frontend origin for CORS
```

### 7.5 Vite Dev Proxy

Update `vite.config.ts`:

```typescript
export default defineConfig({
  // ...existing config
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 8. Frontend Components

### 8.1 New Components

```
src/
├── components/
│   ├── gap-analysis/
│   │   ├── GapAnalysisPage.tsx       # Main page component for /gap-analysis
│   │   ├── GapQuestionCard.tsx       # Individual question card (form + snooze)
│   │   ├── GapQuestionList.tsx       # Grouped list (critical first, then nice_to_have)
│   │   ├── ReclassificationBanner.tsx # Protection level change suggestion
│   │   └── GapLoadingState.tsx       # Spinner + "Analyzing…" message
│   ├── summary/
│   │   ├── AISummaryView.tsx         # New AI-generated summary page (replaces SummaryView)
│   │   ├── SummaryTabToggle.tsx      # Tab switcher: "AI Summary" | "My Answers"
│   │   ├── MyAnswersView.tsx         # Read-only structured cards of raw user answers
│   │   ├── AnswerCard.tsx            # Individual card (Project Idea, GATHER, REFINE, PRESENT, Gap Answers)
│   │   ├── DecisionPathDisplay.tsx   # Reconstructs tree path from stageAnswers → node labels
│   │   ├── EditableSection.tsx       # Inline-editable section wrapper
│   │   ├── UnansweredQuestionsPanel.tsx  # Collapsible snoozed questions
│   │   ├── SummaryExportBar.tsx      # Export + Submit buttons
│   │   ├── SummaryLoadingState.tsx   # Spinner for summary generation
│   │   └── ManualEditConflict.tsx    # "Keep edit or accept new?" dialog
│   └── ...existing components
├── pages/
│   ├── GapAnalysis.tsx               # Route handler for /gap-analysis
│   └── ...existing pages
├── hooks/
│   ├── use-gap-analysis.ts           # Hook: triggers LLM call, manages state
│   └── use-ai-summary.ts            # Hook: triggers summary generation
└── lib/
    └── api-client.ts                 # Frontend HTTP client for /api/* endpoints
```

### 8.2 Component Details

#### `GapQuestionCard`

Props:
```typescript
interface GapQuestionCardProps {
  question: GapQuestion;
  onAnswer: (questionId: string, answer: string, selectedOptions?: string[]) => void;
  onSnooze: (questionId: string) => void;
}
```

Renders:
- Priority badge (amber for critical, gray for nice_to_have)
- Question text
- Optional context note (muted, smaller text)
- Input: `<textarea>` for `free_text`, radio buttons for `single_choice`, checkboxes for `multi_choice`
- "Submit Answer" button (disabled until input is non-empty)
- "Snooze" button with sleep icon

Animations: Framer Motion `layout` + `AnimatePresence` for smooth card exits when answered/snoozed.

#### `EditableSection`

Props:
```typescript
interface EditableSectionProps {
  sectionKey: string;
  title: string;
  content: string;          // AI-generated content
  manualEdit?: string;      // User's manual edit (if any)
  onEdit: (sectionKey: string, newContent: string) => void;
  editable?: boolean;       // false for Header, Feasibility, Technical Notes
}
```

Renders:
- Section title with pencil icon on hover
- Content as rendered Markdown (using a lightweight MD renderer or Tailwind prose)
- Click to enter edit mode → `<textarea>` with the raw text
- Save on blur or Escape

---

## 9. Example Submissions (Prompt Few-Shot)

Hardcode 2-3 strong example submissions derived from the CSV data (`AI Idea Form-documents.csv`). These are included in the gap analysis prompt to show the LLM what a complete, well-described submission looks like.

**Format** (stored in `server/src/llm/examples.ts`):

```typescript
export const exampleSubmissions: string[] = [
  `{
    "projectIdea": {
      "title": "AI Agent to Support Transaction Approvers",
      "description": "Campus users have a painpoint around managing approvals across disparate systems (Oracle, Concur, Kuali, ServiceNow, Ecotime, UCPath). An AI agent where users can ask 'show my pending approvals' and get live results from source systems via APIs.",
      "domain": "Business & Financial Services",
      "timeline": "6-12 months",
      "existingStatus": "No — new project",
      "projectGoal": "Consolidate approval workflows into a single AI-powered interface",
      "currentProcess": "Users must log into each system separately to check pending approvals. No unified view exists.",
      "projectComplexity": "High — multiple system integrations",
      "preferredTool": "TritonGPT"
    },
    "gather": {
      "protectionLevel": "P2",
      "details": {
        "dataType": ["Transactional records", "Approval queues"],
        "sourceSystem": "Oracle, Concur, Kuali, ServiceNow, Ecotime, UCPath",
        "dataSize": "10,000+ approval records across systems",
        "regulatoryContext": ["none"]
      }
    },
    "refine": {
      "refinements": [
        { "taskType": "extract", "description": "Pull pending approval data from each system's API", "dataPrep": "filter" },
        { "taskType": "summarize", "description": "Present a consolidated view of all pending approvals", "dataPrep": "combine" }
      ],
      "audience": "my-team"
    },
    "present": {
      "outputs": [
        { "format": "chat", "description": "Conversational interface where users ask about their approvals" }
      ]
    }
  }`,
  // ... 2 more examples to be filled from CSV data
];
```

**Placeholder**: The spec reserves space for 3 examples. The user will provide the actual curated examples later. The prompt template in `server/src/llm/prompts.ts` dynamically injects them.

---

## 10. Deployment

### 10.1 Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && npm run dev
```

Vite proxy forwards `/api/*` to the backend on port 3001.

### 10.2 Production Build

```bash
# Build frontend
npm run build

# Build backend
cd server && npm run build
```

The backend serves the frontend's `dist/` folder as static files in production.

### 10.3 Docker

```dockerfile
# Multi-stage build
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build
COPY --from=frontend /app/dist ../dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 10.4 Environment Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-5.2` | Model to use for LLM calls |
| `WEBHOOK_URL` | No | — | TritonAI webhook URL (for submit) |
| `PORT` | No | `3001` | Backend server port |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin |
| `NODE_ENV` | No | `development` | Environment flag |

### 10.5 Cost Estimation

| Call | Est. Input Tokens | Est. Output Tokens | Est. Cost (gpt-5.2) |
|------|-------------------|--------------------|---------------------|
| Gap Analysis | ~3,000–5,000 | ~1,000–2,000 | ~$0.01–0.03 |
| Summary Generation | ~3,000–5,000 | ~2,000–4,000 | ~$0.02–0.05 |
| **Per session (typical)** | — | — | **~$0.03–0.08** |
| **Per session (with re-runs)** | — | — | **~$0.10–0.20** |

*Pricing: gpt-5.2 at $1.25/1M input, $10/1M output. For lower cost, use `gpt-5-mini` ($0.25/$2) via the `OPENAI_MODEL` env var.*

No rate limiting enforced at the application level — the OpenAI API key's own rate limits apply. Consider adding per-session call counting if cost becomes a concern.

---

## 11. Task Breakdown

### Phase 1: Data Model & Store (Frontend)

| # | Task | Details |
|---|------|---------|
| 1.1 | Create gap analysis types | New file `src/types/gap-analysis.ts` with all types from §6.1 |
| 1.2 | Extend Zustand store | Add `gapAnalysis` and `aiSummary` state + actions to `session-store.ts`. Bump to v5 with migration. |
| 1.3 | Create API client | New `src/lib/api-client.ts` — typed `fetch` wrappers for `/api/gap-analysis`, `/api/generate-summary`, `/api/submit` |

### Phase 2: Backend API

| # | Task | Details |
|---|------|---------|
| 2.1 | Initialize backend project | `server/` directory with Hono, TypeScript, OpenAI SDK, Zod |
| 2.2 | Create Zod schemas | `server/src/llm/schemas.ts` — `GapAnalysisResponseSchema`, `SummaryResponseSchema` |
| 2.3 | Write prompt templates | `server/src/llm/prompts.ts` — gap analysis + summary system/user prompts |
| 2.4 | Hardcode example submissions | `server/src/llm/examples.ts` — 3 placeholder examples from CSV |
| 2.5 | Implement LLM client | `server/src/llm/client.ts` — `runGapAnalysis()`, `runSummaryGeneration()` |
| 2.6 | Create gap analysis endpoint | `POST /api/gap-analysis` route |
| 2.7 | Create summary endpoint | `POST /api/generate-summary` route |
| 2.8 | Carry over submit endpoint | `POST /api/submit` with webhook forwarding (from SPEC.md F2) |
| 2.9 | Configure Vite proxy | Update `vite.config.ts` for `/api/*` proxying |

### Phase 3: Gap Analysis UI

| # | Task | Details |
|---|------|---------|
| 3.1 | Create `GapAnalysisPage` | Route `/gap-analysis`, auto-triggers LLM call on mount |
| 3.2 | Create `GapLoadingState` | Spinner + "Analyzing your submission…" |
| 3.3 | Create `GapQuestionCard` | Card with priority badge, input, snooze button |
| 3.4 | Create `GapQuestionList` | Groups cards by priority, handles answer/snooze callbacks |
| 3.5 | Create `ReclassificationBanner` | Banner for protection level change suggestion |
| 3.6 | Wire up `use-gap-analysis` hook | Hook that calls API, updates store, handles errors |
| 3.7 | Add route to router | Register `/gap-analysis` in React Router config |
| 3.8 | Update pipeline navigation | After all stages complete, "View Summary" → `/gap-analysis` |

### Phase 4: AI Summary UI

| # | Task | Details |
|---|------|---------|
| 4.1 | Create `AISummaryView` | Replaces `SummaryView` — renders AI-generated sections with tab toggle |
| 4.2 | Create `SummaryTabToggle` | Tab switcher component: "AI Summary" and "My Answers" |
| 4.3 | Create `MyAnswersView` | Read-only structured cards showing raw user answers per stage |
| 4.4 | Create `AnswerCard` | Reusable card component for each section (Project Idea, GATHER, REFINE, PRESENT, Gap Answers) |
| 4.5 | Create `DecisionPathDisplay` | Reconstructs the user's decision tree path from `stageAnswers` by mapping answer IDs back to tree node questions and option labels |
| 4.6 | Create `EditableSection` | Inline plain-text editing wrapper |
| 4.7 | Create `UnansweredQuestionsPanel` | Collapsible panel for snoozed questions |
| 4.8 | Create `ManualEditConflict` | Dialog when regeneration conflicts with manual edits |
| 4.9 | Create `SummaryExportBar` | Export (JSON, Markdown, email, print) + Submit button |
| 4.10 | Create `SummaryLoadingState` | Spinner for summary generation/regeneration |
| 4.11 | Wire up `use-ai-summary` hook | Hook that calls API, updates store, handles re-triggers |
| 4.12 | Add print-friendly CSS | `@media print` styles for the summary page |
| 4.13 | Build Markdown export | `buildSpecMarkdown()` function from AI summary sections — includes both AI summary and raw answers |

### Phase 5: Integration & Polish

| # | Task | Details |
|---|------|---------|
| 5.1 | Wire snoozed Q → re-trigger flow | Answering a snoozed question on summary triggers full re-analysis |
| 5.2 | Wire reclassification flow | Accept → update store → re-run feasibility → regenerate summary |
| 5.3 | Handle re-generation with manual edits | Per-section "keep edit or accept new" prompt |
| 5.4 | Error handling & retry | Error states for LLM failures, retry buttons, graceful degradation |
| 5.5 | Wire submit to TritonAI | POST to `/api/submit` with loading/success/error states |

### Phase 6: Deployment

| # | Task | Details |
|---|------|---------|
| 6.1 | Create `.env.example` | Document all env vars |
| 6.2 | Create Dockerfile | Multi-stage build (frontend + backend) |
| 6.3 | Update npm scripts | Add `dev:backend`, `build:all`, `start:prod` scripts |
| 6.4 | Update existing SPEC.md | Reference this spec for the gap analysis feature |

---

## 12. Open Items

| # | Item | Status |
|---|------|--------|
| 1 | **Example submissions**: User to provide 2-3 curated examples from the CSV data | Pending |
| 2 | **OpenAI model name**: Using `gpt-5.2` as default. Override via `OPENAI_MODEL` env var. | Done |
| 3 | **TritonAI webhook URL**: Needed for the submit endpoint | Pending |
| 4 | **Exact section formatting**: Should the AI-generated Markdown follow specific UCSD formatting guidelines? | To be decided |
| 5 | **Auth integration**: Should the gap analysis/summary endpoints require SSO auth (SPEC.md F3)? | To be decided |
