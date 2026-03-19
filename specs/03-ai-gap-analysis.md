# Spec 03: AI-Powered Gap Analysis & Follow-Up

> **Status:** Draft
> **Last updated:** 2026-03-17
> **Depends on:** Spec 01 (Conversational Questions), Spec 02 (Persistent Submissions)
> **Feature:** FEATURES-BRAINSTORM.md Section 2

---

## 1. Overview

### What It Does

After a user completes all three wizard stages (GATHER, REFINE, PRESENT), the system reviews everything they told us and identifies gaps -- places where information is missing, too vague to act on, or contradictory. It then asks targeted follow-up questions in a friendly, conversational tone to fill those gaps.

The user never sees UCSD format terminology. If their project description is thin, the system says something like "Can you tell me a bit more about what happens when this falls behind?" -- NOT "The Context section requires a Challenge paragraph."

### When It Triggers

Gap analysis runs automatically when **all three** of these conditions are met:

1. All three stages (GATHER, REFINE, PRESENT) have `status: 'complete'`
2. The user navigates to the `/gap-analysis` route (which happens automatically after completing the last stage, or by clicking "Review Submission" from the pipeline page)
3. The `gapAnalysis.status` in the store is `'idle'` (first visit) -- otherwise, the user sees their previous results

Gap analysis can also be **re-run** manually after the user answers follow-up questions, to check if new gaps were revealed by their answers.

### Design Principles

1. **Never expose UCSD format terminology.** No "desirability," "viability," "feasibility," "process overview," or section names from the intake template. The system knows these categories internally but the user never sees them.
2. **Reference what the user already said.** Follow-up questions should say "You mentioned the data comes from Canvas..." not "Please provide additional data source details."
3. **One thing at a time feels manageable.** Show questions individually (not as a wall of text), with clear progress.
4. **Snoozing is fine.** Users should never feel trapped. They can skip any question and come back later.
5. **The system does the mapping.** Answers to follow-up questions are stored as raw user responses. The backend maps them to UCSD format fields during summary generation.

---

## 2. Completeness Scoring Algorithm

### 2.1 Field Inventory

Every field collected across the wizard and detail forms maps to a UCSD format section. Each field has a **weight**, a **required/optional** classification, and rules for what counts as "complete" vs "thin."

#### Describe Stage Fields (maps to Process Overview + Desirability)

| Field | Store Path | Weight | Required | UCSD Section (internal only) |
|-------|-----------|--------|----------|------------------------------|
| Project title | `projectIdea.title` | 8 | Yes | Process Overview: Purpose |
| Project description | `projectIdea.description` | 12 | Yes | Process Overview: Description |
| Domain / department | `projectIdea.domain` | 4 | No | Metadata: VC Area |
| Timeline | `projectIdea.timeline` | 3 | No | Metadata |
| Project goal | `projectIdea.projectGoal` | 5 | No | Process Overview: Purpose |
| Existing status | `projectIdea.existingStatus` | 3 | No | Process Overview |
| Current process | `projectIdea.currentProcess` | 8 | No | Context / Challenge |
| Project complexity | `projectIdea.projectComplexity` | 3 | No | Feasibility: Complexity |
| Preferred tool | `projectIdea.preferredTool` | 2 | No | Feasibility: Alignment |

#### Gather Stage Fields (maps to Data Classification + Feasibility)

| Field | Store Path | Weight | Required | UCSD Section (internal only) |
|-------|-----------|--------|----------|------------------------------|
| Protection level classification | `stages.GATHER.result.protectionLevel` | 10 | Yes | Data Classification |
| Data source selection | `stages.GATHER.result.answers['gather-start']` | 8 | Yes | Data Classification |
| Data type(s) | `gatherDetails.dataType` | 5 | No | Feasibility: Data Availability |
| Source system(s) | `gatherDetails.sourceSystem` | 5 | No | Context |
| Data size | `gatherDetails.dataSize` | 3 | No | Viability: Process Volume |
| Regulatory context | `gatherDetails.regulatoryContext` | 6 | No | Compliance |
| Additional notes | `gatherDetails.additionalNotes` | 2 | No | Context |

#### Refine Stage Fields (maps to Process Overview + Viability)

| Field | Store Path | Weight | Required | UCSD Section (internal only) |
|-------|-----------|--------|----------|------------------------------|
| AI task selection | `stages.REFINE.result.answers['refine-task']` | 8 | Yes | Process Overview: AI Solution |
| Data transformation | `stages.REFINE.result.answers['refine-transform']` | 4 | Yes | Process Overview: Description |
| Audience | `stages.REFINE.result.answers['refine-audience']` | 5 | Yes | Desirability: Customer Size |
| Refinement details (at least 1 with description) | `refineDetails.refinements` | 7 | No | Process Overview: Key Points |
| Additional context | `refineDetails.additionalContext` | 3 | No | Context |

#### Present Stage Fields (maps to Feasibility + Output)

| Field | Store Path | Weight | Required | UCSD Section (internal only) |
|-------|-----------|--------|----------|------------------------------|
| Output format selection | `stages.PRESENT.result.outputFormat` | 8 | Yes | Feasibility |
| Output description(s) | `presentDetails.outputs[].description` | 5 | No | Process Overview: Description |

### 2.2 Scoring Formula

```
totalWeight = sum of weights for all fields
earnedWeight = sum of weights for fields that are "complete" (not empty/thin)
partialWeight = sum of (weight * 0.5) for fields that are "thin" (present but could use more)

completenessScore = ((earnedWeight + partialWeight) / totalWeight) * 100
```

**Total possible weight:** 127 points (sum of all weights above)

### 2.3 Completeness Thresholds

| Score Range | Readiness Label | What it Means | UI Treatment |
|-------------|----------------|---------------|-------------|
| 80-100% | "Ready for review" | OSI can act on this without a meeting | Green badge, celebration micro-animation |
| 50-79% | "Almost there" | A few follow-up questions will complete it | Yellow badge, encouraging tone |
| 0-49% | "Let's fill in some gaps" | Significant information is missing; without follow-ups, OSI would need a meeting | Red/orange badge, supportive (not alarming) tone |

The completeness score is displayed to the user as a percentage with the readiness label. It updates in real time as they answer follow-up questions.

### 2.4 Score Calculation: Client vs Server

The completeness score is calculated in **two places**:

1. **Client-side (lightweight, immediate):** A pure function `calculateCompletenessScore(state)` in `src/lib/gap-scoring.ts` that checks field presence and length. Used for the real-time progress bar. This is a **heuristic** -- it checks if fields exist and meet minimum thresholds but does not evaluate quality.

2. **Server-side (AI-enhanced, on analysis):** The LLM evaluates not just presence but **quality** -- is the description actually descriptive? Does the current process explanation make sense? The server returns an `overallAssessment` string and the generated follow-up questions, which the client uses to adjust the score.

The client score is the **floor**. If the AI finds issues the heuristic missed (e.g., contradictions, vague-but-long descriptions), the effective score can be lower. The client score is never higher than what the AI would give.

---

## 3. Gap Detection Rules

### 3.1 Rule Structure

Each gap detection rule is defined as:

```typescript
interface GapRule {
  id: string;                          // e.g., 'describe-title-missing'
  fieldPath: string;                   // e.g., 'projectIdea.title'
  ucsdSection: string;                 // internal mapping, never shown to user
  priority: 'critical' | 'nice_to_have';
  completeWhen: (value: unknown) => boolean;
  thinWhen: (value: unknown) => boolean;
  followUpQuestion: string;            // friendly, conversational
  followUpContext?: string;            // optional "why we're asking" hint
  inputType: 'free_text' | 'single_choice' | 'multi_choice';
  options?: Array<{ id: string; label: string }>;
}
```

### 3.2 Rules by Section

#### Project Description Rules

**Rule: `describe-title-short`**
- Field: `projectIdea.title`
- Complete when: length >= 5 characters
- Thin when: length >= 1 and < 5 characters
- Priority: critical
- Follow-up: "Your project name is pretty short. Could you give it a more descriptive title so our team knows what it's about at a glance?"
- Input: free_text

**Rule: `describe-description-missing`**
- Field: `projectIdea.description`
- Complete when: length >= 50 characters
- Thin when: length >= 1 and < 50 characters
- Priority: critical
- Follow-up: "Can you tell us a bit more about what you're trying to build? A couple of sentences about what the AI would actually do would be really helpful."
- Context: "The more detail you give here, the faster our team can get started."
- Input: free_text

**Rule: `describe-description-thin`**
- Field: `projectIdea.description`
- Complete when: length >= 100 characters
- Thin when: length >= 50 and < 100 characters
- Priority: nice_to_have
- Follow-up: "You gave us a good start on describing your project. Could you add a bit more detail? For example, what specific problem does this solve, or what does a typical day look like without this tool?"
- Input: free_text

**Rule: `describe-current-process-missing`**
- Field: `projectIdea.currentProcess`
- Complete when: length >= 20 characters
- Thin when: length >= 1 and < 20 characters
- Priority: critical
- Follow-up: "How is this work done today? Even a quick description helps -- like 'we manually copy data from one spreadsheet to another' or 'someone reads through 50 emails and summarizes them.'"
- Context: "Understanding the current process helps us figure out where AI can save the most time."
- Input: free_text

**Rule: `describe-domain-missing`**
- Field: `projectIdea.domain`
- Complete when: non-empty string
- Thin when: N/A (it's a selection)
- Priority: nice_to_have
- Follow-up: "Which part of campus are you in?"
- Input: single_choice
- Options: (the domain dropdown options from DescribeIdeaForm)

**Rule: `describe-timeline-missing`**
- Field: `projectIdea.timeline`
- Complete when: non-empty string
- Thin when: N/A
- Priority: nice_to_have
- Follow-up: "How soon are you hoping to get this going?"
- Input: single_choice
- Options: `[{id: 'exploring', label: 'Just exploring'}, {id: 'this_quarter', label: 'This quarter'}, {id: 'this_month', label: 'This month'}, {id: 'immediate', label: 'Right away'}]`

#### Data Classification Rules

**Rule: `gather-data-type-missing`**
- Field: `gatherDetails.dataType`
- Complete when: array length >= 1
- Thin when: N/A
- Priority: critical
- Follow-up: "What kind of files or data are we talking about? Spreadsheets, PDFs, database records, something else?"
- Input: multi_choice
- Options: `[{id: 'spreadsheet', label: 'Spreadsheets / CSV files'}, {id: 'database', label: 'Database / SQL'}, {id: 'documents', label: 'Documents / PDFs'}, {id: 'api', label: 'API / Web service'}, {id: 'images', label: 'Images / Media'}, {id: 'other', label: 'Something else'}]`

**Rule: `gather-source-system-missing`**
- Field: `gatherDetails.sourceSystem`
- Complete when: length >= 3 characters
- Thin when: length >= 1 and < 3 characters
- Priority: critical
- Follow-up: "Which systems or tools hold this data? For example, Canvas, ServiceNow, Oracle, a shared drive -- anything you can name helps."
- Context: "Knowing the specific system helps us figure out how to connect to it."
- Input: free_text

**Rule: `gather-data-size-missing`**
- Field: `gatherDetails.dataSize`
- Complete when: non-empty string
- Thin when: N/A
- Priority: nice_to_have
- Follow-up: "Roughly how much data are we talking about?"
- Input: single_choice
- Options: `[{id: 'small', label: 'A handful of files or a small spreadsheet'}, {id: 'medium', label: 'Dozens of files or a department-sized dataset'}, {id: 'large', label: 'Thousands of files or campus-wide data'}, {id: 'unknown', label: 'Not sure'}]`

**Rule: `gather-regulatory-missing`**
- Field: `gatherDetails.regulatoryContext`
- Complete when: array length >= 1
- Thin when: N/A
- Priority: critical (when protection level is P2 or higher)
- Priority: nice_to_have (when protection level is P1)
- Follow-up: "Does any of this data involve student records, health information, financial data, or export-controlled research?"
- Context: "This helps us make sure we handle everything properly."
- Input: multi_choice
- Options: `[{id: 'ferpa', label: 'Student records (FERPA)'}, {id: 'hipaa', label: 'Health or medical data (HIPAA)'}, {id: 'export-control', label: 'Export-controlled research'}, {id: 'financial-compliance', label: 'Financial audit requirements'}, {id: 'none', label: 'None of these'}]`

**Rule: `gather-regulatory-contradicts-plevel`**
- This is an AI-detected rule, not a static heuristic
- Triggers when: regulatory context includes FERPA/HIPAA but protection level is P1
- Priority: critical
- Follow-up: "You mentioned this involves [student records / health data], but earlier you classified the data as public. Could you help us understand -- is the data you'd actually feed to AI already de-identified, or does it still contain personal information?"
- Input: free_text

#### AI Processing Rules

**Rule: `refine-task-description-missing`**
- Field: `refineDetails.refinements[0].description`
- Complete when: at least one refinement has description length >= 10 characters
- Thin when: refinement exists but description length < 10 characters
- Priority: critical
- Follow-up: "You said you want AI to [summarize / analyze / etc.] your data. Can you give us a quick example of what that looks like? Like, 'I want it to read through course evaluations and pull out the top 3 themes.'"
- Context: "A concrete example helps our team build exactly what you need."
- Input: free_text

**Rule: `refine-no-refinements`**
- Field: `refineDetails.refinements`
- Complete when: array length >= 1 and at least one has a non-empty taskType
- Thin when: array is empty or all have empty taskType
- Priority: critical
- Follow-up: "What specifically would you like AI to do with the data? For example: summarize it, find patterns, sort things into categories, answer questions about it?"
- Input: single_choice
- Options: (from the refine-task wizard options)

**Rule: `refine-audience-broad-no-detail`**
- Triggers when: audience is 'campus-wide' or 'public-external' AND `projectIdea.description` length < 100
- Priority: nice_to_have
- Follow-up: "You mentioned this would be used by [a wide audience / people outside UCSD]. Can you tell us a bit more about who specifically would use it and what they'd do with the results?"
- Input: free_text

#### Output & Delivery Rules

**Rule: `present-output-description-missing`**
- Field: `presentDetails.outputs[].description`
- Complete when: at least one output has description length >= 10 characters
- Thin when: output exists but description is empty or < 10 characters
- Priority: nice_to_have
- Follow-up: "You chose [AI Chat Assistant / Visual Dashboard / etc.] as your output format. Can you describe what you'd want it to look like or do? For example, 'A chat where my team can ask questions about our policies' or 'A dashboard showing monthly trends.'"
- Input: free_text

**Rule: `present-conditional-no-plan`**
- Triggers when: any output has `feasibility: 'allowed_with_conditions'` AND no additional context is provided
- Priority: critical
- Follow-up: "The output format you chose has some conditions for your data type. [Insert condition from feasibility matrix]. Is that something your team can handle, or would you like to explore a different format?"
- Input: single_choice
- Options: `[{id: 'can-handle', label: 'Yes, we can work with that'}, {id: 'need-help', label: 'We might need help with that'}, {id: 'different-format', label: 'Let me pick a different format'}]`

### 3.3 AI-Generated Contextual Rules

Beyond the static rules above, the AI backend generates **contextual follow-up questions** based on the specific content of the user's answers. These are not pre-written -- they are generated by the LLM prompt.

Examples of what the AI might generate:

- "You mentioned the data comes from Canvas and ServiceNow. Are those two separate datasets that need to be combined, or would the AI work with them one at a time?"
- "You said staff spends about 2 hours on each review. Roughly how many of these reviews happen per week?"
- "You mentioned you want to 'improve the process.' Can you paint a picture of what success looks like? For example, what would change for your team six months from now?"

The AI is instructed to:
1. Reference specific things the user said (by quoting or paraphrasing)
2. Ask about concrete, answerable things (not abstract concepts)
3. Keep questions short (1-2 sentences max)
4. Never use UCSD format terminology
5. Generate a maximum of 20 questions total (static + AI-generated combined)

---

## 4. Follow-Up Question Generation

### 4.1 Two-Layer Approach

Follow-up questions come from two sources, merged into a single list:

**Layer 1: Static gap rules (client-side, instant)**
The `calculateGaps(state)` function in `src/lib/gap-scoring.ts` checks all static rules from Section 3.2 and produces a list of gaps with pre-written follow-up questions. This runs instantly, with no API call.

**Layer 2: AI-generated contextual questions (server-side, async)**
The server-side LLM analyzes the full intake payload against example submissions and generates contextual follow-ups. These are more nuanced -- they detect vagueness, contradictions, and missing context that static rules cannot catch.

When the gap analysis page loads:
1. Immediately show the client-side static gaps (if any) as "loading" skeleton cards
2. Fire the API call to the server
3. When the server responds, **merge** the two lists:
   - Server questions take priority over static questions for the same field
   - If the server generated a question for `projectIdea.currentProcess` and the static rules also flagged it, use the server's version (it's more contextual)
   - Static questions that the server did NOT cover are kept as-is
4. De-duplicate by `relatedField` -- no two questions should target the same field

### 4.2 Prompt Design for AI-Generated Questions

The system prompt (already implemented in `server/src/llm/prompts.ts`) instructs the LLM to:

```
You are an intake reviewer for UCSD's TritonAI team...
```

**Additional prompt instructions to add for conversational tone:**

```
TONE AND LANGUAGE RULES:
- Write follow-up questions as if you're a friendly colleague asking over coffee
- NEVER use these words: desirability, viability, feasibility, process overview,
  context/challenge/request, intake form, submission, compliance section
- NEVER reference the UCSD intake format, template, or any internal OSI terminology
- DO reference specific things the user already told us. Quote or paraphrase their answers.
- Keep each question to 1-2 sentences maximum
- Use "you" and "your team" -- never "the submitter" or "the user"
- When asking about numbers (volume, frequency, time), give example ranges:
  "Roughly how often does this come up? A few times a month, weekly, daily?"
- When asking about process, prompt with concrete examples:
  "Can you walk us through a typical example? Like, what happens from the moment
  a request comes in to when it's done?"

QUESTION GENERATION RULES:
- Maximum 20 questions total
- At least 1 question must be critical priority (unless the submission is genuinely complete)
- No more than 8 critical questions -- if you have more gaps than that, pick the
  most important ones and mark the rest as nice_to_have
- For each question, explain in the "context" field (visible to the user) WHY
  you're asking -- e.g., "This helps us estimate how much time AI could save."
- When generating multiple-choice options, always include an "Other / I'm not sure"
  escape hatch
```

### 4.3 Question Priority Assignment

The AI assigns priority based on these guidelines (included in the prompt):

**Critical** -- the OSI team cannot meaningfully act without this information:
- Project description is empty or under 50 characters
- Current process is completely missing (no baseline to measure improvement)
- Data source system is unknown (cannot plan integration)
- Protection level may be wrong (regulatory contradiction)
- No refinement tasks described (don't know what AI should do)

**Nice to Have** -- improves the submission but OSI could work around it:
- Timeline not specified
- Domain/department not selected
- Data size unknown
- Output format description is sparse
- Additional context fields are empty
- Audience is specified but not elaborated

### 4.4 Re-Analysis After Answers

When the user answers follow-up questions and then clicks "Re-check," the system:

1. Sends the original `IntakePayload` PLUS all answered gap questions to the server
2. The server prompt includes: "The user has already answered some follow-up questions from a previous analysis. Take these answers into account. Do not re-ask questions that have already been adequately answered. Focus on any remaining gaps or new gaps revealed by the answers."
3. The server returns a new (usually shorter) list of questions
4. Questions the user previously answered are preserved with `status: 'answered'`
5. Previously snoozed questions that still appear in the new analysis are marked `status: 'pending'` (un-snoozed) since they're still relevant
6. The completeness score is recalculated

This already works in the current implementation via `useGapAnalysis.runAnalysis()` and the `previousGapAnswers` parameter.

---

## 5. Snooze Mechanism

### 5.1 How Snoozing Works

Any follow-up question can be snoozed. When a user clicks "Snooze" (moon icon):

1. The question's `status` changes from `'pending'` to `'snoozed'` in the store
2. The question card animates out of the visible list (Framer Motion exit animation)
3. The snoozed question count appears in a collapsed "Snoozed" section at the bottom
4. The completeness score treats snoozed questions as unanswered (no credit)

### 5.2 Store Representation

Snoozed questions are stored in the same `gapAnalysis.questions` array with `status: 'snoozed'`. No separate array.

```typescript
// Already in the store:
snoozeGapQuestion: (questionId: string) => void;   // sets status to 'snoozed'
unsnoozeGapQuestion: (questionId: string) => void;  // sets status back to 'pending'
```

### 5.3 Snooze Persistence

Since the Zustand store uses `persist` middleware with localStorage, snoozed questions survive browser refreshes and tab closures. They are also included in the session snapshot that gets saved to the server via `saveSubmission()`.

### 5.4 Resurfacing Snoozed Questions

Snoozed questions resurface in these scenarios:

**Scenario A: User returns to the gap analysis page**
- Snoozed questions appear in a collapsed "Snoozed questions" section at the bottom of the page
- The section shows a count badge: "3 snoozed"
- Clicking expands the section to show all snoozed questions
- Each snoozed question has an "Answer now" button that un-snoozes it and moves it back to the main list

**Scenario B: User loads a saved submission**
- When a submission is loaded from the server (via `loadSession`), all snoozed questions are restored
- If the gap analysis was in `'ready'` state when saved, it stays in `'ready'` state (no re-analysis needed)
- Snoozed questions appear in the collapsed section as before

**Scenario C: Re-analysis**
- If the user triggers a re-analysis, previously snoozed questions that the AI still flags are returned to `'pending'` status
- Previously snoozed questions that the AI no longer flags are removed from the list entirely

### 5.5 Snooze and Completeness

- Snoozed questions count as **unanswered** for the completeness score
- This means a user can proceed to summary generation with snoozed questions, but their completeness score will be lower
- The summary page shows a notice: "You have X snoozed questions. Answering them could improve your submission." with a link back to gap analysis

### 5.6 No Expiry / No Email Reminders (For Now)

In the current implementation, snoozed questions do not expire and do not trigger email reminders. This is by design for the MVP -- the persistence spec (Spec 02) handles return-visit flows, and email reminders are a Phase 3 feature tied to the admin dashboard.

---

## 6. UI Flow

### 6.1 Entry Points

The gap analysis page is accessible via:

1. **Automatic redirect** after completing the last wizard stage -- the pipeline page detects all stages complete and shows a "Review Your Submission" button that navigates to `/gap-analysis`
2. **Direct navigation** from the pipeline page at any time after all stages are complete
3. **Return visit** -- if the user has a saved submission with gap analysis state, navigating to `/gap-analysis` restores it

### 6.2 Page Layout

```
+--------------------------------------------------+
|  <- Back                                         |
|                                                  |
|          Reviewing Your Submission               |
|    We're checking for any gaps in your           |
|    responses.                                    |
|                                                  |
|  [============================--------] 73%      |
|  Almost there -- a few questions will             |
|  complete your submission.                       |
|                                                  |
|  ---- CRITICAL (3) ----                          |
|                                                  |
|  +----------------------------------------------+|
|  | CRITICAL                                      ||
|  | How is this work done today? Even a quick     ||
|  | description helps -- like "we manually copy   ||
|  | data from one spreadsheet to another."        ||
|  |                                               ||
|  | Understanding the current process helps us    ||
|  | figure out where AI can save the most time.   ||
|  |                                               ||
|  | [________________________]                    ||
|  | [________________________]                    ||
|  |                                               ||
|  |  [Submit Answer]  [Snooze]                    ||
|  +----------------------------------------------+|
|                                                  |
|  +----------------------------------------------+|
|  | CRITICAL                                      ||
|  | Which systems hold this data?                 ||
|  | ...                                           ||
|  +----------------------------------------------+|
|                                                  |
|  ---- NICE TO HAVE (2) ----                      |
|                                                  |
|  +----------------------------------------------+|
|  | NICE TO HAVE                                  ||
|  | How soon are you hoping to get this going?    ||
|  | ...                                           ||
|  +----------------------------------------------+|
|                                                  |
|  ---- Snoozed (1) ----                          |
|  [click to expand]                               |
|                                                  |
|  [Generate Summary ->]  (enabled when all        |
|                          pending = 0)            |
+--------------------------------------------------+
```

### 6.3 Question Presentation

Questions are shown as cards in a scrollable list, grouped by priority:

1. **Critical questions** appear first, under a section header with an amber warning icon and count badge
2. **Nice to Have questions** appear second, under a section header with a sparkle icon and count badge
3. **Snoozed questions** appear last, in a collapsible section with a moon icon

Each question card contains:
- Priority badge (amber for critical, gray for nice-to-have)
- Question text (bold, 14px)
- Context/reason text (gray, 12px) -- "why we're asking"
- Input area (textarea for free_text, radio buttons for single_choice, checkboxes for multi_choice)
- Two action buttons: "Submit Answer" (primary) and "Snooze" (secondary, with moon icon)

### 6.4 Progress Updates

The progress bar at the top updates in real time:

- **Numerator:** count of questions with `status !== 'pending'` (answered OR snoozed)
- **Denominator:** total question count
- **Percentage:** weighted by priority (critical questions count for 2x progress, nice-to-have for 1x)
- **Color:** transitions from red (0-49%) to yellow (50-79%) to green (80-100%)
- The percentage and readiness label text updates as each question is resolved

When a question is answered:
1. The answer is saved to the store
2. The card animates out with a slide-left + fade exit animation (300ms)
3. The progress bar increments
4. If it was the last pending question, the "Generate Summary" button activates with a subtle celebration animation (green glow pulse)

### 6.5 Loading State

When gap analysis is running (first load or re-analysis):

- Centered spinner with "Analyzing your submission..." text
- Below: "We're checking for any gaps in your responses."
- Duration: typically 3-8 seconds for the LLM call
- If it takes more than 10 seconds, show an additional message: "This is taking a bit longer than usual. Hang tight..."

### 6.6 Error State

If the API call fails:

- Red-bordered card with error message
- "Try Again" button with refresh icon
- The error distinguishes between retryable errors (rate limit, timeout) and non-retryable errors (missing API key, malformed payload)

### 6.7 No Gaps State

If the AI finds no gaps:

- Green-bordered success card with checkmark icon
- "Looks great -- no additional questions!"
- The `overallAssessment` from the AI is displayed below
- "Generate Summary" button is immediately active

### 6.8 All Resolved State

When all questions have been answered or snoozed:

- Blue-bordered info card: "All questions resolved!"
- "You're ready to generate your summary."
- "Generate Summary" button is active

### 6.9 Navigation Flow

```
[Wizard Complete] --> [Pipeline Page: "Review Submission" button]
                          |
                          v
                    [/gap-analysis]
                          |
                    (auto-runs analysis)
                          |
               +----------+----------+
               |          |          |
          [No Gaps]  [Has Gaps]  [Error]
               |          |          |
               v          v          v
         [Summary]   [Answer/     [Retry]
                      Snooze]
                          |
                    (all resolved)
                          |
                          v
                    [/summary]
```

The "Generate Summary" button navigates to `/summary`. The summary page receives all data (original intake + gap analysis answers) and generates the final output.

### 6.10 Reclassification Banner

If the AI detects that the protection level may be wrong (e.g., user said P1 but mentions FERPA data), a banner appears at the TOP of the question list (above critical questions):

- Amber-bordered warning card
- Shows current level and suggested level with arrow between them
- Explains why in plain language
- Two buttons: "Accept Reclassification" and "Keep Current Level"
- Accepting updates the protection level in the store and may change feasibility results

This is already implemented in `ReclassificationBanner.tsx`.

---

## 7. Data Model

### 7.1 Existing Store Fields (Already Implemented)

The gap analysis state is already part of the Zustand store at `gapAnalysis`:

```typescript
interface GapAnalysisState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  questions: GapQuestion[];
  overallAssessment: string;
  reclassification?: Reclassification;
  errorMessage?: string;
  runCount: number;
}
```

### 7.2 Existing GapQuestion Type (Already Implemented)

```typescript
interface GapQuestion {
  id: string;
  priority: 'critical' | 'nice_to_have';
  question: string;
  context?: string;
  inputType: 'free_text' | 'single_choice' | 'multi_choice';
  options?: Array<{ id: string; label: string }>;
  relatedSection: 'project_overview' | 'data_classification' | 'ai_processing'
                  | 'output_deliverables' | 'compliance';
  relatedField?: string;
  status: 'pending' | 'answered' | 'snoozed';
  answer?: string;
  selectedOptions?: string[];
}
```

### 7.3 New Fields to Add

**Add to `GapAnalysisState`:**

```typescript
interface GapAnalysisState {
  // ... existing fields ...
  completenessScore: number;           // 0-100, calculated from field presence + AI assessment
  readinessLabel: 'ready' | 'almost' | 'needs_work';
  lastAnalyzedAt: string | null;       // ISO timestamp of last analysis
  staticGaps: GapQuestion[];           // client-side static gap questions (before AI)
}
```

**Add `snoozedAt` timestamp to `GapQuestion`:**

```typescript
interface GapQuestion {
  // ... existing fields ...
  snoozedAt?: string;    // ISO timestamp when snoozed, for potential future reminder logic
  answeredAt?: string;   // ISO timestamp when answered
}
```

### 7.4 Store Version Migration

The store is currently at version 5. Adding these fields requires a migration to version 6:

```typescript
if (version < 6) {
  const gapAnalysis = state.gapAnalysis as Record<string, unknown>;
  return {
    ...state,
    gapAnalysis: {
      ...gapAnalysis,
      completenessScore: 0,
      readinessLabel: 'needs_work',
      lastAnalyzedAt: null,
      staticGaps: [],
    },
  };
}
```

---

## 8. New Files to Create

### 8.1 `src/lib/gap-scoring.ts`

Client-side completeness scoring and static gap detection.

```typescript
// Exports:
export function calculateCompletenessScore(state: SessionSnapshot): number;
export function getReadinessLabel(score: number): 'ready' | 'almost' | 'needs_work';
export function detectStaticGaps(state: SessionSnapshot): GapQuestion[];
export function mergeGapQuestions(
  staticGaps: GapQuestion[],
  aiGaps: GapQuestion[]
): GapQuestion[];
```

**`calculateCompletenessScore`** checks all fields from the Section 2.1 table, applying the weights and completeness criteria.

**`detectStaticGaps`** runs all rules from Section 3.2 and returns pre-written follow-up questions for any gaps found.

**`mergeGapQuestions`** combines static and AI-generated questions, de-duplicating by `relatedField`, preferring the AI version when both exist.

### 8.2 `src/lib/gap-rules.ts`

Static gap rule definitions. This is the data file containing all rules from Section 3.2 as an array of `GapRule` objects.

### 8.3 `src/components/gap-analysis/CompletenessBar.tsx`

A progress bar component showing the completeness score:
- Animated fill bar (Framer Motion)
- Percentage text
- Readiness label badge
- Color transitions (red -> yellow -> green)

### 8.4 `src/components/gap-analysis/SnoozedSection.tsx`

A collapsible section for snoozed questions:
- Collapsed by default, shows count badge
- Clicking expands to show snoozed question cards
- Each card has an "Answer now" button instead of "Submit"

---

## 9. API Integration

### 9.1 Endpoint

**POST `/api/gap-analysis`**

Already implemented in `server/src/routes/gap-analysis.ts`.

### 9.2 Request Payload

```typescript
{
  intakePayload: IntakePayload;       // full structured intake data
  previousGapAnswers?: GapQuestion[]; // answered questions from prior run
}
```

### 9.3 Response Payload

```typescript
{
  questions: GapQuestion[];           // max 20, from LLM
  overallAssessment: string;          // 1-2 sentence summary
  reclassification?: {                // optional, if P-level seems wrong
    currentLevel: ProtectionLevel;
    suggestedLevel: ProtectionLevel;
    reason: string;
  };
}
```

### 9.4 LLM Configuration

- **Model:** Configured via `OPENAI_MODEL` env var (default: `gpt-5.2`)
- **Response format:** Structured outputs using Zod schema validation via `zodResponseFormat(GapAnalysisResponseSchema, 'gap_analysis')`
- **Max questions:** 20 (enforced by Zod schema: `z.array(GapQuestionSchema).max(20)`)
- **Temperature:** Default (not explicitly set -- consider setting to 0.3 for more consistent gap detection)

### 9.5 Prompt Modifications Needed

The existing prompts in `server/src/llm/prompts.ts` need the following additions:

1. **Add conversational tone rules** (from Section 4.2 above) to the system prompt
2. **Add the completeness scoring context** -- tell the LLM about the scoring weights so it can prioritize questions that would most improve the score
3. **Add "never use UCSD format terminology" instruction** as a hard constraint in the system prompt
4. **Add specific examples of good vs bad follow-up questions:**

   Bad: "Please provide Process Volume data for the Viability section."
   Good: "Roughly how often does your team do this? A few times a month, weekly, daily?"

   Bad: "The Feasibility section is incomplete. Please describe Data Availability."
   Good: "Is the data you'd need easy to get to, or would someone need to set up access?"

### 9.6 Fallback Behavior

If the API call fails:

1. **Retryable errors** (rate limit, timeout, 503, 529): Show error state with "Try Again" button. The user can retry immediately.
2. **Non-retryable errors** (400, auth failure): Show error state with a message suggesting they try again later or contact support.
3. **Network offline**: Detect via `navigator.onLine` and show a specific offline message.
4. **Static-only fallback**: If the API is completely unreachable after 2 retries, fall back to showing ONLY the static gap questions (from `detectStaticGaps`). This gives the user something useful even without the AI backend. Show a notice: "We couldn't reach our AI reviewer, but here are some questions that could strengthen your submission."

---

## 10. Dependencies

### 10.1 Depends On

| Dependency | Why | Status |
|-----------|-----|--------|
| Conversational Questions (Spec 01) | The questions spec defines what data is collected in the wizard. Gap analysis checks that data for completeness. | Not yet written |
| Persistent Submissions (Spec 02) | Snooze + return-visit flows require session persistence beyond localStorage. | Not yet written |
| Existing wizard + detail forms | Gap analysis checks fields collected by DescribeIdeaForm, GatherDetailForm, RefineDetailForm, and the wizard trees. | Already implemented |
| Server API (`/api/gap-analysis`) | The LLM call for AI-generated questions. | Already implemented |
| Zustand store v5 | Gap analysis state, actions, and persistence. | Already implemented |

### 10.2 Depended On By

| Feature | Why |
|---------|-----|
| Summary Generation | Gap analysis answers are included in the summary generation prompt to enrich the output. |
| Two-Summary System (Spec 04) | The user-facing summary references gap analysis completeness. The OSI-facing summary uses gap answers to fill UCSD format sections. |
| Claude Code Prompt Bundle | Gap analysis answers contribute to the requirements and context sections of the prompt bundle. |
| Admin Dashboard | The completeness score is displayed in the submission queue and can be filtered/sorted. |

---

## 11. Acceptance Criteria

### 11.1 Core Flow

- [ ] **AC-1:** When all three wizard stages are complete and the user navigates to `/gap-analysis`, the system automatically runs gap analysis (API call to `/api/gap-analysis`).
- [ ] **AC-2:** The gap analysis page displays a completeness score (0-100%) with a visual progress bar and readiness label ("Ready for review" / "Almost there" / "Let's fill in some gaps").
- [ ] **AC-3:** Follow-up questions are displayed as cards, grouped by priority (Critical first, Nice to Have second).
- [ ] **AC-4:** Each question card shows the question text, optional context, an input area (free text / single choice / multi choice), and two buttons (Submit Answer, Snooze).
- [ ] **AC-5:** Submitting an answer updates the question's status to `'answered'`, stores the answer, and animates the card out of the pending list.
- [ ] **AC-6:** The completeness score updates in real time as questions are answered.
- [ ] **AC-7:** The "Generate Summary" button is disabled while there are still `'pending'` questions. It enables when all questions are either answered or snoozed.

### 11.2 Snooze

- [ ] **AC-8:** Clicking "Snooze" changes the question status to `'snoozed'` and moves it to the collapsed "Snoozed" section at the bottom.
- [ ] **AC-9:** Snoozed questions do NOT count toward completeness (they are treated as unanswered for scoring).
- [ ] **AC-10:** The snoozed section shows a count badge and is expandable. Each snoozed question has an "Answer now" button.
- [ ] **AC-11:** Snoozed questions survive page refresh (persisted in localStorage via Zustand persist middleware).

### 11.3 No-Gaps and Error States

- [ ] **AC-12:** If the AI finds no gaps, a success card is shown and the "Generate Summary" button is immediately enabled.
- [ ] **AC-13:** If the API call fails, an error card is shown with a "Try Again" button. Retryable errors show "Try Again"; non-retryable errors show a message.
- [ ] **AC-14:** If the API is unreachable after retries, the system falls back to showing static gap questions only, with a notice explaining the AI reviewer is unavailable.

### 11.4 Reclassification

- [ ] **AC-15:** If the AI detects a protection level mismatch, a reclassification banner appears above the question list.
- [ ] **AC-16:** "Accept Reclassification" updates the store's protection level and clears the banner. "Keep Current Level" dismisses the banner without changing the level.

### 11.5 Conversational Tone

- [ ] **AC-17:** No question displayed to the user contains UCSD format terminology (desirability, viability, feasibility, process overview, context/challenge/request, intake form).
- [ ] **AC-18:** AI-generated questions reference specific things the user already said (verified by manual review of LLM output for 5+ test submissions).
- [ ] **AC-19:** All questions are 1-2 sentences maximum. Context/reason text is displayed in a smaller, gray font below the question.

### 11.6 Re-Analysis

- [ ] **AC-20:** After answering questions, the user can trigger a re-analysis. The re-analysis includes previously answered questions as context and does not re-ask them.
- [ ] **AC-21:** The re-analysis may return fewer questions (gaps filled) or new questions (revealed by answers). Previously snoozed questions that the AI still flags are returned to pending.

### 11.7 Integration

- [ ] **AC-22:** Gap analysis answers are included in the summary generation payload (`postGenerateSummary` already accepts `gapAnswers`).
- [ ] **AC-23:** The gap analysis state (questions, answers, snooze status, completeness score) is included in the session snapshot and persists across save/load cycles.

---

## 12. Open Questions

1. **Completeness score display on pipeline page?** Should the pipeline page show the completeness score before the user enters gap analysis, based on the client-side heuristic? This could motivate users to provide more detail in the wizard itself.

2. **Maximum snooze count?** Should there be a limit on how many questions a user can snooze? Currently there is no limit -- a user could snooze everything and proceed with a low completeness score.

3. **Auto-save gap answers to server?** Currently gap answers are only in localStorage. Should answering a gap question trigger an auto-save to the server (if the user has a saved submission)? This depends on Spec 02 (Persistent Submissions).

4. **Re-analysis trigger UX:** Currently the user must manually click to re-analyze. Should re-analysis happen automatically after the user answers the last pending question? This could be surprising if it generates new questions.
