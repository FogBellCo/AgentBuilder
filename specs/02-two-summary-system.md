# Spec 02: Two-Summary System & Claude Code Prompt Bundle

> **Status:** Draft
> **Last updated:** 2026-03-17
> **Depends on:** Spec 01 (Questions — new conversational questions woven into existing wizard stages)
> **Scope:** Sections 4 and 5 from FEATURES-BRAINSTORM.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [User-Facing Summary](#2-user-facing-summary)
3. [OSI-Facing Summary (UCSD Intake Format)](#3-osi-facing-summary-ucsd-intake-format)
4. [Claude Code Prompt Bundle](#4-claude-code-prompt-bundle)
5. [Export Formats](#5-export-formats)
6. [AI Integration](#6-ai-integration)
7. [New Components](#7-new-components)
8. [Data Flow](#8-data-flow)
9. [Store Changes](#9-store-changes)
10. [Dependencies](#10-dependencies)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Overview

### The Core Idea

The same set of user answers powers **three completely separate outputs**:

| Output | Audience | Tone | Content |
|--------|----------|------|---------|
| **User-Facing Summary** | The person who filled out the wizard | Warm, plain-English, no jargon | "Here's what you told us" |
| **OSI-Facing Summary** | TritonAI / OSI internal team | Structured, professional, matches UCSD template | Process Overview, Desirability, Viability, Feasibility, Context/Challenge/Request, Savings |
| **Claude Code Prompt Bundle** | Developer (Claude Code) | Technical, structured markdown | Requirements, constraints, architecture suggestions |

### Design Principle

The user **never** sees UCSD intake format terminology. They never encounter the words "desirability," "viability," "feasibility," "process overview," or any OSI internal jargon — not in questions, not in the summary, not in exports. The system maps their natural-language answers to the structured format behind the scenes.

### Current State

Today there is a single `AISummaryView` component that shows an AI-generated 7-section summary (Executive Summary, Project Overview, Data Classification, AI Processing Plan, Output Deliverables, Feasibility Summary, Compliance & Next Steps). This is a hybrid — it uses professional language but is shown directly to users. There is also a `SummaryView` (the older view) and a `MyAnswersView` tab showing raw answers.

**What changes:**
- The current AI summary becomes the foundation for the **OSI view** (restructured to match the UCSD template exactly).
- A **new user-facing summary** is built that reads like a friendly confirmation email.
- A **new Claude Code prompt bundle** export is added.
- The current `SummaryTabToggle` ("AI Summary" / "My Answers") is replaced with a new tab system.

---

## 2. User-Facing Summary

### 2.1 When It Appears

This is the **default view** the user sees after completing all three wizard stages. It auto-generates when all stages are complete, just like the current AI summary does.

### 2.2 Page Layout

```
+--------------------------------------------------+
| [< Back]                                         |
|                                                  |
|         Here's What You Told Us                  |
|     A quick recap of your AI project idea        |
|                                                  |
| +----------------------------------------------+ |
| | [Did we get this right? banner]              | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | YOUR PROJECT                                 | |
| | [Project title + what you're trying to do]   | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | THE DATA                                     | |
| | [Data sources, sensitivity, access info]     | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | WHAT AI WOULD HANDLE                         | |
| | [Processing tasks in plain language]         | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | HOW YOU'D SEE RESULTS                        | |
| | [Output formats, delivery description]       | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | TIME SAVINGS                                 | |
| | [Calculated savings in friendly language]    | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | WHAT'S NEXT                                  | |
| | [Next steps, timeline expectations]          | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| |   [Download PDF]  [Share Link]               | |
| +----------------------------------------------+ |
|                                                  |
| [My Answers] tab to see raw responses            |
+--------------------------------------------------+
```

### 2.3 Section Structure and Field Mappings

Each section below describes the exact heading, the data sources, and how the content is composed.

#### Section 1: "Your Project: {title}"

**Heading:** `Your Project: {projectIdea.title}`

**Content:** A 2-3 sentence AI-generated paragraph that weaves together the user's description, goal, and current process into a natural narrative.

**Data sources:**
| Store field | Used for |
|---|---|
| `projectIdea.title` | Section heading |
| `projectIdea.description` | Primary input to narrative |
| `projectIdea.projectGoal` | "You want to..." clause |
| `projectIdea.currentProcess` | "Today, you..." clause |
| `projectIdea.domain` | Context for narrative ("In your [domain] work...") |
| `projectIdea.timeline` | Mentioned if not "exploring" |

**AI generation:** Yes. The backend composes a friendly paragraph from these fields. If AI is unavailable, fall back to a bullet-point list of the raw values.

**Example output:**
> **Your Project: Student Feedback Analyzer**
>
> Your team in Academic Affairs manually reviews about 200 course evaluations per quarter, looking for common themes and flagging urgent issues. You want AI to do the heavy lifting so your analysts can focus on writing recommendations instead of reading through every response. You're hoping to have something in place this quarter.

**Editable:** Yes. User can click to edit the narrative text. Title is not editable (it comes from the Describe page; they can go back to change it).

#### Section 2: "The Data"

**Heading:** `The Data`

**Content:** A short paragraph describing what data is involved, where it lives, and what access looks like — all in plain language. No mention of "protection level" by name; instead, use natural phrasing.

**Data sources:**
| Store field | Used for |
|---|---|
| `stages.GATHER.result.protectionLevel` | Determines access language (see mapping below) |
| `gather.selectedDataSources[].label` | Named in the narrative |
| `gatherDetails.dataType[]` | "Things like [dataType]" |
| `gatherDetails.sourceSystem` | "from [sourceSystem]" |
| `gatherDetails.dataSize` | Mentioned if provided |
| `gatherDetails.regulatoryContext[]` | Mentioned if not "none" |
| `gatherDetails.additionalNotes` | Appended if provided |

**Protection level language mapping (user never sees "P1/P2/P3/P4"):**
| Level | User-facing language |
|---|---|
| P1 | "This is publicly available data — no special access needed." |
| P2 | "This is internal UCSD data that requires a UCSD login to access." |
| P3 | "This is confidential data that needs special access permissions." |
| P4 | "This data is restricted under UC policy — AI tools can't process it directly, but there may be workarounds." |

**Regulatory context language (if present):**
| Value | User-facing language |
|---|---|
| `FERPA` | "Since this involves student records, FERPA rules apply." |
| `HIPAA` | "Since this involves health information, HIPAA rules apply." |
| `PCI` | "Since this involves payment data, PCI compliance is required." |
| `GLBA` | "Since this involves financial records, GLBA rules apply." |
| Other | "This data has additional regulatory requirements: {value}." |

**AI generation:** Yes. The backend composes a friendly paragraph. Fallback: bullet list.

**Example output:**
> **The Data**
>
> You're working with course evaluations from Canvas — internal UCSD data that requires a UCSD login to access. Since this involves student records, FERPA rules apply. New data comes in every quarter, and you're looking at roughly 200 records per cycle.

**Editable:** Yes, narrative text only.

#### Section 3: "What AI Would Handle"

**Heading:** `What AI Would Handle`

**Content:** A plain-language description of the AI processing tasks, derived from the Refine stage.

**Data sources:**
| Store field | Used for |
|---|---|
| `refineDetails.refinements[].taskType` | Primary task description |
| `refineDetails.refinements[].description` | Detail for each task |
| `refineDetails.refinements[].dataPrep` | Mentioned if not "as-is" |
| `refineDetails.additionalContext` | Appended context |
| `stages.REFINE.result.answers['refine-audience']` | Who sees the results |

**Task type friendly labels (reuse from `MyAnswersView`):**
| taskType | Friendly label |
|---|---|
| `summarize` | "Summarize key points" |
| `analyze` | "Spot trends and patterns" |
| `compare` | "Compare different data sets" |
| `recommend` | "Generate recommendations" |
| `classify` | "Sort and categorize items" |
| `answer` | "Answer questions from your documents" |
| `generate` | "Draft content" |
| `extract` | "Pull data from files" |

**AI generation:** Yes. Backend weaves task descriptions into a natural paragraph.

**Example output:**
> **What AI Would Handle**
>
> The AI would read through your course evaluations and pull out the key themes — what students are happy about, what they're frustrated with, and any urgent issues that need attention. It would also flag recurring patterns across sections so your team doesn't have to read every single response.

**Editable:** Yes.

#### Section 4: "How You'd See Results"

**Heading:** `How You'd See Results`

**Content:** Description of the chosen output format(s) in friendly language, with feasibility status expressed naturally.

**Data sources:**
| Store field | Used for |
|---|---|
| `presentDetails.outputs[].format` | Output type |
| `presentDetails.outputs[].description` | User's description of what they want |
| `presentDetails.outputs[].feasibility.feasibility` | Status |
| `presentDetails.outputs[].feasibility.conditions` | Any conditions |

**Feasibility language mapping (user never sees "feasibility"):**
| Status | User-facing language |
|---|---|
| `allowed` | "Good news — this works with your data." |
| `allowed_with_conditions` | "This can work, but {conditions}." |
| `not_allowed` | "Unfortunately, this output type isn't available for your data classification. {alternativeSuggestion ? 'You might consider [alternative] instead.' : ''}" |

**AI generation:** Yes, for the narrative wrapping. The feasibility determination is deterministic (from the matrix), not AI-generated.

**Example output:**
> **How You'd See Results**
>
> You'd get a visual dashboard your team can check after each evaluation cycle. Good news — this works with your data, as long as the dashboard is hosted behind UCSD SSO.

**Editable:** Yes.

#### Section 5: "Time Savings"

**Heading:** `Time Savings`

**Content:** A friendly summary of the calculated time savings. This section only appears if the Spec 01 questions provide enough data to calculate savings (frequency, time-per-instance, number-of-people).

**Data sources (from Spec 01 new questions — these fields do not exist yet):**
| Future store field | Used for |
|---|---|
| `workloadDetails.taskFrequency` | How often the task happens |
| `workloadDetails.timePerInstance` | How long each instance takes |
| `workloadDetails.peopleInvolved` | How many people do this |

**Calculation logic (performed client-side, not AI):**

```typescript
// Frequency multipliers (instances per month)
const frequencyMultiplier: Record<string, number> = {
  'few_times_month': 4,
  'few_times_week': 12,
  'daily': 22,
  'multiple_daily': 66,  // 3x per day * 22 working days
};

// Time per instance (hours)
const timePerInstance: Record<string, number> = {
  'few_minutes': 0.15,     // ~10 min
  'half_hour': 0.5,
  'couple_hours': 2,
  'half_day': 4,
};

// People multiplier
const peopleMultiplier: Record<string, number> = {
  'just_me': 1,
  '2_3_people': 2.5,
  'small_team': 6,
  'large_group': 15,
};

const monthlyHours =
  frequencyMultiplier[frequency] *
  timePerInstance[time] *
  peopleMultiplier[people];
```

**Display logic:**
- If `monthlyHours < 5`: "Your team spends a few hours a month on this. AI could help streamline it."
- If `monthlyHours >= 5 && < 40`: "It sounds like your team spends about **{monthlyHours} hours/month** on this. AI could help get a good chunk of that time back."
- If `monthlyHours >= 40 && < 160`: "It sounds like your team spends about **{monthlyHours} hours/month** on this — that's like having a person dedicated to it {Math.round(monthlyHours/160*10)/10 > 0.3 ? 'part-time' : ''}. AI could help get most of that time back."
- If `monthlyHours >= 160`: "Your team spends roughly **{monthlyHours} hours/month** on this — that's more than a full-time position. AI could have a major impact here."

**If savings data is unavailable:** The section is hidden entirely. No placeholder, no "we couldn't calculate" message.

**AI generation:** No. This is purely calculated. The sentence template is filled client-side.

**Editable:** No. The numbers are derived; editing would break the calculation.

#### Section 6: "What's Next"

**Heading:** `What's Next`

**Content:** A friendly description of what happens after submission, tailored to the protection level.

**Data sources:**
| Store field | Used for |
|---|---|
| `stages.GATHER.result.protectionLevel` | Determines next steps |
| `gapAnalysis.questions` (snoozed count) | If snoozed questions exist, mention them |

**Content by protection level:**
| Level | Next steps |
|---|---|
| P1 | "Our team will review this and you should hear back within a few business days. Since your data is public, you could even start experimenting with UCSD-approved AI tools right away." |
| P2 | "Our team will review this and follow up within a few business days. We may have a couple of quick questions about access and permissions." |
| P3 | "Our team will review this carefully given the data sensitivity. Expect to hear back within a week — we'll want to discuss access controls and compliance details." |
| P4 | "Since this involves restricted data, our team will review this closely and reach out to discuss alternative approaches. We'll be in touch within a week." |

**If snoozed questions exist, append:**
> "You still have {count} question(s) you skipped — you can come back and answer them anytime to strengthen your submission."

**AI generation:** No. Template-based.

**Editable:** No.

### 2.4 "Did We Get This Right?" Prompt

At the top of the summary (below the header, above the sections), display a dismissible banner:

```
+--------------------------------------------------+
| [lightbulb icon]                                 |
| Did we get this right?                           |
| Take a look through the summary below. You can   |
| click any section to edit it — we want to make   |
| sure this accurately represents your project.    |
|                                        [Got it]  |
+--------------------------------------------------+
```

**Behavior:**
- Appears on first view of the summary
- Dismisses when user clicks "Got it" or edits any section
- Does not reappear after dismissal (store a `userSummaryPromptDismissed: boolean` flag in the session store)
- Uses the `blue/5` background with `blue/20` border (matches existing info banner style)

### 2.5 Editing Behavior (Notion-like)

**What can be edited:**
- Sections 1-4 (Your Project, The Data, What AI Would Handle, How You'd See Results)
- Click anywhere in a section's text to enter edit mode
- Edit mode shows a `<textarea>` with auto-resize (same as current `EditableSection`)

**What cannot be edited:**
- Section headings
- Section 5 (Time Savings) — calculated, not narrative
- Section 6 (What's Next) — template-based
- Protection level badges or status indicators

**Edit indicators:**
- On hover, show a subtle pencil icon + "Edit" label (same as current `EditableSection`)
- After editing, show "Edited" badge below the section in small gray italic text
- Edits are stored in `aiSummary.manualEdits` keyed by the user-facing section key (e.g., `user_yourProject`, `user_theData`, etc.)

**Edit persistence:**
- Edits persist in localStorage via the Zustand store
- If the summary is regenerated (e.g., after answering a snoozed gap question), the `ManualEditConflict` modal appears for any sections the user has edited, just as it does today

### 2.6 Mobile Layout

- Single column, full width with 16px horizontal padding
- Section cards stack vertically with 16px gaps
- "Did we get this right?" banner is full-width
- Edit mode textarea fills the card width
- Export buttons stack vertically on screens < 640px
- Font sizes remain the same (the design already uses `text-sm` and `text-xs` which work on mobile)

### 2.7 User Export Options

The user sees only two export actions:

1. **"Download a copy" (PDF)** — generates a PDF of the user-facing summary (see Section 5.1)
2. **"Share with a colleague"** — copies a shareable link (if persistent submissions are enabled from Spec 06) OR falls back to a mailto: link with plain-text summary

These appear as a bottom bar, similar to the current `SummaryExportBar` but with only these two buttons.

---

## 3. OSI-Facing Summary (UCSD Intake Format)

### 3.1 Access

The OSI summary is **never shown to the user**. It is:
- Visible on the OSI admin dashboard (Spec 07, future)
- Available as a downloadable export (JSON, PDF, Markdown) from the admin dashboard
- Generated server-side when the user submits
- Stored in the database alongside the submission

For the purposes of this spec (before the admin dashboard exists), the OSI summary is accessible via:
- The "Submit to TritonAI" button (already exists) — sends the structured data to the server, which generates and stores the OSI summary
- A hidden admin route `/admin/submission/:id` that renders the UCSD-format view (development/testing only)

### 3.2 UCSD Template Layout

Based on the screenshots in `/Format/`, the UCSD intake template has this exact structure:

```
+------------------------------------------------------------------+
|                        PROCESS OVERVIEW                          |
+------------------------------------------------------------------+
| Purpose     | [1-2 sentences]                                    |
| Description | [1-2 paragraphs]                                   |
| Key Points  | [3-5 bullet points]                                |
+------------------------------------------------------------------+
|                   AI SOLUTION CONSIDERATIONS                     |
+------------------------------------------------------------------+
| Potential   | [3-5 bullet points]                                |
| Impact      |                                                    |
| Questions & | [3-5 bullet points]                                |
| Considerati-|                                                    |
| ons         |                                                    |
+------------------------------------------------------------------+
|                                                                  |
| +------------------+  +-------------------+  +-----------------+ |
| | DESIRABILITY     |  | VIABILITY         |  | FEASIBILITY     | |
| | Customer Size:   |  | Process Volume:   |  | Alignment w/    | |
| |   [value]        |  |   [value]         |  |   Existing:     | |
| | Customer Need:   |  | Potential Savings |  |   [value]       | |
| |   [Low/Med/High] |  |   per Cycle:      |  | Data            | |
| |                  |  |   [value]         |  |   Availability: | |
| |                  |  | Potential Savings |  |   [value]       | |
| |                  |  |   per Month:      |  | Complexity:     | |
| |                  |  |   [value]         |  |   [Low/Med/High]| |
| +------------------+  +-------------------+  +-----------------+ |
|                                                                  |
| +---------+  +-------------------+  +-----------------+          |
| | VC Area:|  | Submitted by:     |  | On behalf of:   |          |
| | [value] |  | [email]           |  | [name/self]     |          |
| +---------+  +-------------------+  +-----------------+          |
|                                                                  |
+------------------------------------------------------------------+
|    CONTEXT         |    CHALLENGE        |    REQUEST             |
+------------------------------------------------------------------+
| [2-3 paragraphs    | [2-3 paragraphs     | [2-3 paragraphs       |
|  describing the    |  describing the     |  describing what      |
|  current state]    |  pain points]       |  they want built]     |
+------------------------------------------------------------------+
|                         SAVINGS                                  |
+------------------------------------------------------------------+
| Time Savings:                                                    |
|   - Expected Volume: [X / period]                                |
|   - Time spent per instance: [X hours]                           |
|   - Potential time savings per instance: [~X%]                   |
|   - Time savings: [~X hours / period]                            |
|                                                                  |
| Impact:                                                          |
|   - [2-3 bullet points about broader impact]                    |
+------------------------------------------------------------------+
```

### 3.3 Field-by-Field Mapping

#### Process Overview Section

All fields in this section are **100% AI-generated** from user answers. The user never sees or fills these fields directly.

| UCSD Template Field | Generation Strategy | Primary Data Sources |
|---|---|---|
| **Purpose** | AI composes 1-2 sentences | `projectIdea.title` + `projectIdea.description` + `projectIdea.projectGoal` |
| **Description** | AI composes 1-2 paragraphs | All `projectIdea` fields + `refineDetails.refinements` + `presentDetails.outputs` + `gatherDetails.sourceSystem` |
| **Key Points** | AI extracts 3-5 bullet points | All wizard answers + gap analysis answers — the AI identifies the most important facts |
| **Potential Impact** | AI composes 3-5 bullets | Savings calculation + audience size (`refine.audience`) + `projectIdea.projectGoal` |
| **Questions & Considerations** | AI composes 3-5 bullets | Gap analysis snoozed/unanswered questions + P-level warnings + feasibility conditions from matrix |

**AI prompt for Process Overview** (included in the server-side summary generation prompt):

```
For the Process Overview section:
- Purpose: Synthesize the project title, description, and goal into 1-2 crisp sentences
  explaining what this AI solution would do and why.
- Description: Write 1-2 paragraphs that explain the full scope — current process, what
  changes with AI, data involved, who benefits. Write for a technical reviewer, not the
  end user.
- Key Points: Extract the 3-5 most important facts from all available data. Each point
  should be one line. Focus on: scale of impact, data sensitivity, technical complexity,
  timeline, and any unique constraints.
- Potential Impact: Based on the savings calculation and audience data, describe the
  concrete impact. Include time savings numbers, affected user count, and broader
  organizational benefits.
- Questions & Considerations: List open questions, risks, and things the review team
  should investigate. Include: any snoozed gap questions, P-level compliance concerns,
  feasibility conditions, and technical unknowns.
```

#### Desirability Section

Derived deterministically from user answers. **Not AI-generated.**

| UCSD Template Field | Derivation |
|---|---|
| **Customer Size** | Mapped from Spec 01 question: "Would other departments benefit from this too, or is it just your team?" |
| **Customer Need** | Mapped from Spec 01 question: "How much is this slowing your team down?" |

**Customer Size mapping:**

| User's answer | UCSD value |
|---|---|
| "Just my team" | "One department" |
| "A few other groups might use it" | "Multiple departments" |
| "Lots of departments could use this" | "Multiple VC areas" |
| "The whole campus" | "Campus-wide" |

**Customer Need mapping:**

| User's answer | UCSD value |
|---|---|
| "It's a minor annoyance" | "Low" |
| "It eats up real time every week" | "Medium" |
| "It's a serious bottleneck" | "High" |
| "We can't keep up" | "High" |

**Fallback:** If these questions haven't been answered yet (Spec 01 not implemented), derive approximate values:
- Customer Size: Use `refine.audience` — "just-me"/"my-team" = "One department", "campus-wide" = "Campus-wide"
- Customer Need: Use `projectIdea.timeline` — "exploring" = "Low", "this_quarter" = "Medium", "this_month"/"immediate" = "High"

#### Viability Section

Derived from the savings calculation (same data as user-facing Time Savings section).

| UCSD Template Field | Derivation |
|---|---|
| **Process Volume** | From Spec 01 question: "Roughly how often do you do this task?" — display as "~{X} per month" |
| **Potential Savings per Cycle** | `timePerInstance` value formatted as hours/minutes |
| **Potential Savings per Month** | `monthlyHours` from the savings calculation, formatted as hours. If > 160, also show FTE equivalent: "~{X} hours (~{X/160} FTE)" |

**Fallback mapping if Spec 01 questions unavailable:**

| UCSD Field | Fallback source | Fallback logic |
|---|---|---|
| Process Volume | `projectIdea.timeline` | "exploring" = "<100 per month", "this_quarter" = "100-1000 per month", "this_month"/"immediate" = ">1000 per month" |
| Savings per Cycle | Not available | Display "TBD — follow up needed" |
| Savings per Month | Not available | Display "TBD — follow up needed" |

#### Feasibility Section

Mix of deterministic derivation and calculation.

| UCSD Template Field | Derivation |
|---|---|
| **Alignment with Existing Solutions** | From Spec 01 question: "Have you heard of TritonGPT?" |
| **Data Availability** | From Spec 01 question: "Is the data you'd need easy to get to?" |
| **Complexity** | Auto-calculated (never asked to user) |

**Alignment with Existing Solutions mapping:**

| User's answer | UCSD value |
|---|---|
| "Yes, I already use it" | "Already using TritonGPT" |
| "I've heard of it" | "Aware of TritonGPT — not yet using" |
| "No, what's that?" | "Not aware of existing solutions" |
| *(also consider `projectIdea.preferredTool`)* | If "TritonGPT" is selected: "TritonGPT preferred" |

**Data Availability mapping:**

| User's answer | UCSD value |
|---|---|
| "I can get to it myself" | "Readily available" |
| "Someone would need to help" | "Requires new integration" |
| "I'm not sure where it lives" | "Requires new data source" |

**Complexity auto-calculation:**

```typescript
function calculateComplexity(state: SessionState): 'Low' | 'Medium' | 'High' {
  let score = 0;

  // Number of data sources
  const sourceCount = state.stages.GATHER.result?.answers['gather-start']
    ?.split(',').filter(Boolean).length ?? 0;
  if (sourceCount === 1) score += 0;
  else if (sourceCount <= 3) score += 1;
  else score += 2;

  // Protection level
  const pLevel = state.stages.GATHER.result?.protectionLevel ?? 'P1';
  if (pLevel === 'P1') score += 0;
  else if (pLevel === 'P2') score += 1;
  else if (pLevel === 'P3') score += 2;
  else score += 3; // P4

  // Number of processing steps
  const refinementCount = state.refineDetails?.refinements.length ?? 0;
  if (refinementCount <= 1) score += 0;
  else if (refinementCount <= 3) score += 1;
  else score += 2;

  // Number of output formats
  const outputCount = state.presentDetails?.outputs.length ?? 0;
  if (outputCount <= 1) score += 0;
  else if (outputCount <= 2) score += 1;
  else score += 2;

  // Has conditional feasibility?
  const hasConditional = state.presentDetails?.outputs.some(
    o => o.feasibility.feasibility === 'allowed_with_conditions'
  ) ?? false;
  if (hasConditional) score += 1;

  // Regulatory context
  const regContext = state.gatherDetails?.regulatoryContext ?? [];
  const hasReg = regContext.length > 0 && !(regContext.length === 1 && regContext[0] === 'none');
  if (hasReg) score += 1;

  if (score <= 2) return 'Low';
  if (score <= 5) return 'Medium';
  return 'High';
}
```

**Fallback:** If Spec 01 questions unavailable, Alignment = derive from `projectIdea.preferredTool`, Data Availability = derive from `gatherDetails.sourceSystem` presence.

#### Metadata Section

| UCSD Template Field | Source |
|---|---|
| **VC Area** | From Spec 01 question: "Which part of campus are you in?" (dropdown of VC areas) |
| **Submitted by** | User's email (from `useUserEmail` hook / Spec 06) |
| **On behalf of** | From Spec 01 question: "Are you submitting this for yourself or someone else?" |

**Fallback:** If these fields are not yet available, display "Not provided" and flag as incomplete in gap analysis.

#### Context / Challenge / Request Section

These three narrative sections are **100% AI-generated** from the user's short answers. The user never writes a paragraph.

| UCSD Section | AI Generation Strategy | Primary Data Sources |
|---|---|---|
| **Context** | AI writes 2-3 paragraphs about the current state | `projectIdea.currentProcess` + `gatherDetails.sourceSystem` + Spec 01 "what tools do you use" + Spec 01 "how long have you been doing it this way" |
| **Challenge** | AI writes 2-3 paragraphs about the pain points | `projectIdea.description` + Spec 01 "what's the most annoying part" + Spec 01 "why is now the right time" + Spec 01 "what happens when it falls behind" |
| **Request** | AI writes 2-3 paragraphs about what they want | `projectIdea.projectGoal` + Spec 01 "magic wand" + Spec 01 "what would great look like" + `refineDetails` + `presentDetails` |

**AI prompt for Context/Challenge/Request:**

```
Write three separate narrative sections for the UCSD AI intake format.

CONTEXT (2-3 paragraphs): Describe the current state of affairs. What systems are in
use? How long has this process been in place? Who does this work today? Write as if
describing the situation to a colleague who has never seen this department.

CHALLENGE (2-3 paragraphs): Describe the pain points and why change is needed now.
What's broken, slow, or unsustainable? What are the consequences of the status quo?
Be specific with numbers and timelines where available.

REQUEST (2-3 paragraphs): Describe what the submitter wants built. Be specific about
functionality, not just outcomes. Reference the specific AI tasks (summarize, classify,
etc.) and output formats. Include the "definition of done" from the user's own words.

Use the following data from the user's submission:
{serialized relevant fields}
```

#### Savings Section

Calculated deterministically, formatted into the UCSD template structure.

| UCSD Template Field | Source |
|---|---|
| **Expected Volume** | `workloadDetails.taskFrequency` mapped to monthly number |
| **Time spent per instance** | `workloadDetails.timePerInstance` mapped to hours |
| **Potential time savings per instance** | Default to "~80%" (industry standard for AI automation of routine tasks) — can be overridden by OSI |
| **Time savings per period** | `monthlyHours * 0.8` formatted as "~X hours/month" |
| **Impact** (bullet points) | AI-generated from savings data + audience + goal |

**Impact bullets AI prompt:**

```
Based on the following savings data, write 2-3 impact bullets for the UCSD intake format:
- Monthly time savings: {monthlyHours} hours
- Affected users: {audience}
- Project goal: {projectGoal}
- Department: {domain}

Each bullet should describe a concrete organizational benefit. Reference specific numbers.
Example: "Repurposing 810+ hours a year (16+ hrs/week * 50 weeks) to more high-value tasks
would provide the University more benefits from their workforce."
```

### 3.4 OSI Summary Data Structure

The structured data stored in the database for each submission:

```typescript
interface OSISummary {
  // Process Overview (all AI-generated)
  processOverview: {
    purpose: string;
    description: string;
    keyPoints: string[];     // 3-5 bullets
    potentialImpact: string[];  // 3-5 bullets
    questionsAndConsiderations: string[];  // 3-5 bullets
  };

  // Three-column scoring
  desirability: {
    customerSize: string;       // "One department" | "Multiple departments" | etc.
    customerNeed: 'Low' | 'Medium' | 'High';
  };

  viability: {
    processVolume: string;            // "~400 per month"
    potentialSavingsPerCycle: string;  // "2 hours"
    potentialSavingsPerMonth: string;  // "~640 hours (~4 FTE)"
  };

  feasibility: {
    alignmentWithExisting: string;
    dataAvailability: string;
    complexity: 'Low' | 'Medium' | 'High';
  };

  // Metadata
  metadata: {
    vcArea: string;
    submittedBy: string;
    onBehalfOf: string;
  };

  // Narrative sections (all AI-generated)
  context: string;    // 2-3 paragraphs
  challenge: string;  // 2-3 paragraphs
  request: string;    // 2-3 paragraphs

  // Savings
  savings: {
    expectedVolume: string;
    timePerInstance: string;
    savingsPercentage: string;
    timeSavings: string;
    impactBullets: string[];  // 2-3 bullets
  };
}
```

---

## 4. Claude Code Prompt Bundle

### 4.1 Purpose

A structured markdown document designed to be pasted directly into Claude Code (or any AI coding assistant) to scaffold the AI project. It gives the developer everything they need to start building without reading through the intake form.

### 4.2 Template

The template below uses `{placeholder}` syntax. Each placeholder maps to specific data from the store and/or AI-generated content.

```markdown
# Project: {projectIdea.title}

## Business Context

{ai_generated_business_context}

## Requirements

### Functional Requirements
{ai_generated_functional_requirements}

### Data Requirements
- **Data sources:** {gatherDetails.sourceSystem || gather.selectedDataSources[].label}
- **Data types:** {gatherDetails.dataType[].join(', ')}
- **Data volume:** {gatherDetails.dataSize}
- **Data freshness:** {spec01_data_freshness || 'Not specified'}
- **Protection level:** {gather.protectionLevel} ({gather.protectionLevelLabel})

### Processing Requirements
{refineDetails.refinements mapped to bullet list}

### Output Requirements
{presentDetails.outputs mapped to bullet list with descriptions}

## Constraints

### Data Classification
- Must comply with UC **{gather.protectionLevel} ({gather.protectionLevelLabel})** data classification
- {protection_level_specific_constraints}

### Regulatory
{regulatoryContext mapped to specific requirements, or "No specific regulatory requirements identified"}

### Feasibility
{feasibility conditions from matrix for each output format}

### Platform
- {preferredTool context, e.g., "User prefers TritonGPT — design for that platform" or "No platform preference specified"}

## User Profile

- **Primary users:** {ai_generated_user_description}
- **User count:** {desirability.customerSize}
- **Technical level:** Non-technical (university staff)
- **Current workflow:** {projectIdea.currentProcess}

## Scope

### In Scope
- **Process volume:** {viability.processVolume}
- **Current time per instance:** {viability.potentialSavingsPerCycle}
- **Target time savings:** ~80% reduction (~{calculated_monthly_savings} hours/month)
- **Processing tasks:** {refinements as bullet list}
- **Output formats:** {outputs as bullet list}

### Out of Scope
{ai_generated_out_of_scope}

## Suggested Architecture

{ai_generated_architecture}

## Acceptance Criteria

{ai_generated_acceptance_criteria}

## Implementation Notes

{ai_generated_implementation_notes}
```

### 4.3 Section Generation Details

#### Business Context
**AI-generated.** A 2-3 paragraph narrative combining Context + Challenge + Request from the OSI summary, rewritten for a developer audience. Should emphasize the "what" and "why" rather than organizational details.

**Prompt:**
```
Rewrite the following Context, Challenge, and Request narratives for a developer audience.
Focus on what the system needs to do and why, not organizational politics. Be concise.

Context: {osi_summary.context}
Challenge: {osi_summary.challenge}
Request: {osi_summary.request}
```

#### Functional Requirements
**AI-generated.** A bulleted list of concrete functional requirements derived from:
- `refineDetails.refinements` (each becomes a requirement)
- `presentDetails.outputs` (output format requirements)
- Gap analysis answers (additional detail)
- "Magic wand" answer from Spec 01 (aspiration)

**Prompt:**
```
From the following user answers, generate a bulleted list of functional requirements
for building this AI solution. Each requirement should be specific and testable.
Do NOT include data or infrastructure requirements (those are separate).

Processing tasks: {refinements}
Output formats: {outputs}
User's ideal outcome: {magic_wand_answer}
Additional context: {refineDetails.additionalContext}
Gap analysis answers: {relevant_gap_answers}
```

#### Protection Level Specific Constraints
**Deterministic.** Mapped from protection level:

| Level | Constraints |
|---|---|
| P1 | "No access restrictions required. Data is public." |
| P2 | "- All endpoints must require UCSD SSO authentication\n- Data must not be exposed to unauthenticated users\n- Use UCSD Active Directory for identity" |
| P3 | "- Requires API key authentication beyond SSO\n- All data access must be audit-logged\n- VPN may be required for data source access\n- Data steward approval required before deployment\n- Consider encryption at rest and in transit" |
| P4 | "- **AI processing of raw data is prohibited under UC policy**\n- Must use de-identified data only\n- Consult UCSD IT Security before proceeding\n- Consider synthetic data for development/testing" |

#### Out of Scope
**AI-generated.** Inferred from what the user did NOT select:

**Prompt:**
```
Based on what this project DOES include and what it DOES NOT include, generate a
bulleted "Out of Scope" list. This helps the developer know where to draw the line.

Selected output formats: {selected_formats}
All available formats: {all_formats}
Selected processing tasks: {selected_tasks}
All available tasks: {all_tasks}
Protection level: {level} (meaning: {constraints})

Generate 3-6 "Out of Scope" bullets. Examples:
- "Real-time streaming — batch processing is sufficient"
- "Public-facing access — internal users only"
- "Mobile app — web dashboard is sufficient"
```

#### Suggested Architecture
**AI-generated.** Based on the combination of output format + data sources + protection level.

**Prompt:**
```
Suggest a high-level architecture for this AI solution. Output as markdown with a brief
description followed by a component list.

Output format: {output_format_labels}
Data sources: {data_sources}
Protection level: {protection_level}
Processing tasks: {refinement_tasks}
Preferred platform: {preferredTool}

Guidelines:
- For chat outputs: Suggest RAG pipeline architecture
- For dashboards: Suggest data pipeline + visualization layer
- For automation: Suggest event-driven workflow
- For P2+: Always include auth layer
- For P3+: Include audit logging component
- Keep it high-level (3-6 components)
- Mention specific technologies only when the user specified a preference (e.g., TritonGPT)
```

#### Acceptance Criteria
**AI-generated.** Derived from the user's "what does success look like" answer (Spec 01) and the project goal.

**Prompt:**
```
Generate 4-6 acceptance criteria for this project in "Given/When/Then" or checkbox format.
Base them on:

Project goal: {projectIdea.projectGoal}
Success definition: {spec01_success_definition}
Output format: {output_formats}
Processing tasks: {refinements}
Time savings target: {monthly_savings} hours/month

Each criterion should be specific and verifiable.
```

#### Implementation Notes
**AI-generated.** Practical guidance for the developer.

**Prompt:**
```
Generate 3-5 implementation notes for the developer building this project.
Consider:
- Data access: {data_sources} at {protection_level}
- Regulatory: {regulatory_context}
- User skill level: Non-technical university staff
- Platform: {preferred_tool}

Focus on gotchas, integration details, and UC-specific considerations.
```

### 4.4 Generation Flow

The Claude Code Prompt Bundle is generated **on demand** (when the user or admin clicks "Export Claude Code Bundle"), not preemptively. It requires a server round-trip because it uses AI generation for several sections.

1. Client sends `POST /api/generate-prompt-bundle` with `{ intakePayload, gapAnswers, osiSummary }`
2. Server calls the LLM with the prompt bundle generation prompt
3. Server returns the complete markdown string
4. Client offers it as a download or copy-to-clipboard

---

## 5. Export Formats

### 5.1 PDF Generation

**Approach:** Client-side HTML-to-PDF using the browser's `window.print()` with a dedicated print stylesheet, enhanced with `@media print` CSS rules.

**Why not a PDF library:** The current app already has a "Print / Save as PDF" button that calls `window.print()`. This approach is zero-dependency, works across browsers, and produces native-quality PDFs. Libraries like `jsPDF` or `html2pdf` add bundle size and produce lower-quality output.

**Implementation:**

1. **Print stylesheet** (`src/styles/print.css`):
```css
@media print {
  /* Hide non-print elements */
  [data-no-print],
  [data-export-bar],
  [data-tab-toggle],
  [data-unanswered-panel],
  [data-edit-button],
  nav, header, footer {
    display: none !important;
  }

  /* Reset page layout */
  body {
    margin: 0;
    padding: 20mm;
    font-size: 11pt;
    color: #000;
    background: #fff;
  }

  /* Prevent page breaks inside sections */
  [data-summary-section] {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 12pt;
  }

  /* Add page break before Context/Challenge/Request */
  [data-page-break-before] {
    break-before: page;
  }

  /* Header on each page */
  @page {
    margin: 20mm;
    @top-center {
      content: "UCSD AI Tool Request";
      font-size: 8pt;
      color: #666;
    }
    @bottom-center {
      content: counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #666;
    }
  }

  /* Force color printing for badges */
  .print-color-exact {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

2. **User-facing PDF:** When user clicks "Download a copy", `window.print()` is called while the user-facing summary tab is active. The print stylesheet hides all chrome and formats the summary sections.

3. **OSI PDF (future, admin dashboard):** A dedicated print view at `/admin/submission/:id/print` renders the UCSD template layout and calls `window.print()`.

### 5.2 JSON Export

The JSON export serves two purposes:
- Machine-readable data for integrations
- Complete data archive

**Schema:** The export combines both the raw intake payload and the AI-generated summaries:

```typescript
interface FullExportJSON {
  // Metadata
  version: '2.0.0';
  exportedAt: string;          // ISO timestamp
  sessionId: string;

  // Raw intake data (existing IntakePayload)
  intake: IntakePayload;

  // User-facing summary (AI-generated sections)
  userSummary: {
    yourProject: string;
    theData: string;
    whatAIWouldHandle: string;
    howYoudSeeResults: string;
    timeSavings: string | null;  // null if not calculable
    whatsNext: string;
  };

  // OSI-facing summary (UCSD format)
  osiSummary: OSISummary;

  // Gap analysis results
  gapAnalysis: {
    questions: GapQuestion[];
    overallAssessment: string;
  };

  // Manual edits the user made
  manualEdits: Record<string, string>;
}
```

**File naming:** `ucsd-ai-intake-{sessionId}.json`

**Download trigger:** Same mechanism as current `downloadJson()` function — create blob, create anchor, trigger click.

### 5.3 Markdown Export

Two separate markdown exports:

#### User-Facing Markdown
```markdown
# {projectIdea.title}

> Generated on {date}

## Your Project
{user_yourProject_section}

## The Data
{user_theData_section}

## What AI Would Handle
{user_whatAIWouldHandle_section}

## How You'd See Results
{user_howYoudSeeResults_section}

## Time Savings
{user_timeSavings_section}

## What's Next
{user_whatsNext_section}
```

#### OSI-Facing Markdown
The existing `buildSpecMarkdown()` in `src/lib/summary-markdown.ts` is the foundation. It needs to be extended to include:
- Process Overview structured fields (Purpose, Description, Key Points)
- Desirability / Viability / Feasibility as a formatted table
- Context / Challenge / Request as separate sections
- Savings breakdown
- Metadata (VC Area, Submitted by, On behalf of)

#### Claude Code Bundle Markdown
This is the prompt bundle from Section 4 — it is already in markdown format.

### 5.4 Export Button Matrix

| Export | User sees? | Admin sees? | Format |
|--------|-----------|-------------|--------|
| Download a copy | Yes | No | PDF (print) |
| Share with a colleague | Yes | No | URL or mailto |
| Download JSON | No | Yes | .json file |
| Copy as Markdown | No | Yes | Clipboard |
| UCSD Intake PDF | No | Yes | PDF (print) |
| Claude Code Bundle | No | Yes | .md file or clipboard |
| Share via Email | No | Yes | mailto |

---

## 6. AI Integration

### 6.1 New API Endpoints

#### `POST /api/generate-user-summary`

Generates the user-facing summary sections.

**Request body:**
```typescript
{
  intakePayload: IntakePayload;
  gapAnswers: GapQuestion[];
}
```

**Response:**
```typescript
{
  sections: {
    yourProject: string;
    theData: string;
    whatAIWouldHandle: string;
    howYoudSeeResults: string;
  };
}
```

**Note:** `timeSavings` and `whatsNext` are NOT AI-generated — they are computed client-side.

#### `POST /api/generate-osi-summary`

Generates the OSI-facing UCSD intake format summary.

**Request body:**
```typescript
{
  intakePayload: IntakePayload;
  gapAnswers: GapQuestion[];
  calculatedFields: {
    desirability: OSISummary['desirability'];
    viability: OSISummary['viability'];
    feasibility: OSISummary['feasibility'];
    metadata: OSISummary['metadata'];
    savings: Omit<OSISummary['savings'], 'impactBullets'>;
  };
}
```

The client sends the deterministically-calculated fields; the server generates the narrative fields (processOverview, context, challenge, request, savings.impactBullets).

**Response:**
```typescript
{
  processOverview: OSISummary['processOverview'];
  context: string;
  challenge: string;
  request: string;
  impactBullets: string[];
}
```

#### `POST /api/generate-prompt-bundle`

Generates the Claude Code prompt bundle.

**Request body:**
```typescript
{
  intakePayload: IntakePayload;
  gapAnswers: GapQuestion[];
  osiSummary: OSISummary;
}
```

**Response:**
```typescript
{
  markdown: string;  // The complete prompt bundle as markdown
}
```

### 6.2 Relationship to Existing `/api/generate-summary`

The existing endpoint generates 7 sections (executiveSummary, projectOverview, dataClassification, aiProcessingPlan, outputDeliverables, feasibilitySummary, complianceAndNextSteps). These map roughly to the OSI summary but not exactly.

**Migration plan:**
1. Keep the existing endpoint working during transition
2. Add the three new endpoints above
3. Update the frontend to call the new endpoints
4. Deprecate the old endpoint once the new system is stable
5. Eventually consolidate: a single `/api/generate-summaries` call that returns all three outputs in one LLM call (more efficient — one context window, one API call)

### 6.3 Prompt Templates

All prompts are stored in `server/src/llm/prompts.ts`. New prompts to add:

#### User Summary System Prompt
```
You are writing a friendly, warm summary for a non-technical university staff member
who just completed an AI project intake form. They should read this and think "yes,
that's exactly what I meant."

Rules:
- Write in second person ("Your team...", "You want...")
- No jargon: never say "protection level", "P1/P2/P3/P4", "desirability",
  "viability", "feasibility", "process overview", or any internal UCSD terms
- Keep it conversational — like a smart colleague summarizing what you told them
- Be specific: use the actual numbers, system names, and team details they provided
- Each section should be 2-4 sentences
- If data is missing for a section, write a shorter section that still feels complete
  (don't say "no information provided")
```

#### OSI Summary System Prompt
```
You are a technical writer for UCSD's TritonAI team. You generate structured intake
summaries that match the UCSD AI intake template format.

Rules:
- Write in third person professional voice
- Be thorough and specific — the review team uses this to prioritize and plan
- For Process Overview fields, synthesize across all provided data
- For Context/Challenge/Request, write full narrative paragraphs (2-3 each)
- Reference specific systems, data volumes, and timelines where available
- If gap analysis answers provide additional detail beyond the intake form, integrate
  that information
- Flag uncertainties explicitly: "The submitter did not specify X; follow-up recommended"
```

#### Prompt Bundle System Prompt
```
You are generating a Claude Code project prompt bundle — a structured markdown document
that a developer will paste into an AI coding assistant to scaffold this project.

Rules:
- Be technically precise
- Include concrete implementation guidance, not just requirements
- Reference UC data classification constraints specifically
- For suggested architecture, name actual patterns (RAG, ETL, event-driven) and
  explain briefly why
- Acceptance criteria should be testable (Given/When/Then or checkbox format)
- Out of scope should be inferred from what was NOT selected
- Implementation notes should address UCSD-specific gotchas (SSO, TritonGPT, etc.)
```

### 6.4 Error Handling

| Failure mode | User-facing behavior | OSI-facing behavior |
|---|---|---|
| AI API timeout (>30s) | Show "Taking longer than expected..." with a retry button. After 2 retries, show fallback (see below). | Same, but since OSI view is admin-only, show more technical error details. |
| AI API rate limit | Queue and retry after backoff (1s, 2s, 4s). Show spinner with "Generating..." | Same. |
| AI API error (500) | Show error banner: "We couldn't generate your summary right now. Your answers are saved — try again in a moment." with retry button. | Same. |
| AI API returns malformed JSON | Retry once. If still malformed, show fallback. Log the raw response server-side. | Same. |
| Network offline | Detect with `navigator.onLine`. Show: "You appear to be offline. Your answers are saved locally and the summary will generate when you're back online." | N/A (admin is always online). |

**Fallback content (when AI is unavailable):**

The user-facing summary falls back to a **structured bullet-point view** built entirely client-side from the store data. This is essentially a friendlier version of the current `MyAnswersView`:

```typescript
function buildFallbackUserSummary(state: SessionState): UserSummaryFallback {
  return {
    yourProject: buildProjectBullets(state.projectIdea),
    theData: buildDataBullets(state.gatherDetails, state.stages.GATHER.result),
    whatAIWouldHandle: buildRefineBullets(state.refineDetails),
    howYoudSeeResults: buildOutputBullets(state.presentDetails),
  };
}
```

Each fallback builder produces an array of `{ label: string; value: string }` pairs displayed as a clean list. Not as pretty as the AI narrative, but always available.

The OSI summary cannot fall back as gracefully since the Process Overview and Context/Challenge/Request sections require AI composition. For those, display "AI generation pending — raw data available" and include the raw intake JSON.

### 6.5 Single-Call Optimization (Future)

Currently, generating all three outputs requires three separate API calls (user summary, OSI summary, prompt bundle). For efficiency, consolidate into a single call:

```
POST /api/generate-all-summaries
```

The server makes one LLM call with a combined prompt that returns all three outputs in a single structured response. This reduces latency and cost. Implement this after the three-endpoint version is stable.

---

## 7. New Components

### 7.1 Components to Create

| Component | Path | Purpose |
|---|---|---|
| `UserFriendlySummary` | `src/components/summary/UserFriendlySummary.tsx` | Main container for the user-facing summary view |
| `UserSummarySection` | `src/components/summary/UserSummarySection.tsx` | Individual section card with edit capability (replaces `EditableSection` for user view) |
| `TimeSavingsDisplay` | `src/components/summary/TimeSavingsDisplay.tsx` | Calculated time savings with friendly messaging |
| `WhatsNextSection` | `src/components/summary/WhatsNextSection.tsx` | Template-based next steps (replaces current `NextSteps` for user view) |
| `DidWeGetThisRight` | `src/components/summary/DidWeGetThisRight.tsx` | Dismissible prompt banner |
| `UserExportBar` | `src/components/summary/UserExportBar.tsx` | PDF download + share link (simplified export bar for users) |
| `OSISummaryView` | `src/components/summary/OSISummaryView.tsx` | Full UCSD template layout (admin-only) |
| `OSIProcessOverview` | `src/components/summary/OSIProcessOverview.tsx` | Process Overview table section |
| `OSIScoringColumns` | `src/components/summary/OSIScoringColumns.tsx` | Desirability / Viability / Feasibility three-column layout |
| `OSINarrativeColumns` | `src/components/summary/OSINarrativeColumns.tsx` | Context / Challenge / Request three-column layout |
| `OSISavingsSection` | `src/components/summary/OSISavingsSection.tsx` | Savings breakdown table |
| `PromptBundlePreview` | `src/components/summary/PromptBundlePreview.tsx` | Preview/copy UI for the Claude Code bundle (admin-only) |

### 7.2 Components to Modify

| Component | Change |
|---|---|
| `AISummaryView` | Refactor: this becomes the orchestrator that switches between user view and "My Answers" view. Remove the current 7-section rendering — that moves to `OSISummaryView`. |
| `SummaryTabToggle` | Update tabs: "Your Summary" (default) and "My Answers". Remove "AI Summary" label. |
| `SummaryExportBar` | Split into `UserExportBar` (for user view) and `AdminExportBar` (for admin, future). Current component stays as the admin version. |
| `SummaryView` | Remove or redirect to `AISummaryView`. This is the old pre-AI summary view and is no longer needed. |

### 7.3 Component Hierarchy

```
Summary (page)
  └── AISummaryView (orchestrator)
        ├── DidWeGetThisRight (banner, dismissible)
        ├── UnansweredQuestionsPanel (snoozed gap questions)
        ├── ReclassificationBanner (if applicable)
        ├── SummaryTabToggle
        │     ├── Tab: "Your Summary" (default)
        │     │     └── UserFriendlySummary
        │     │           ├── UserSummarySection (Your Project)
        │     │           ├── UserSummarySection (The Data)
        │     │           ├── UserSummarySection (What AI Would Handle)
        │     │           ├── UserSummarySection (How You'd See Results)
        │     │           ├── TimeSavingsDisplay
        │     │           └── WhatsNextSection
        │     └── Tab: "My Answers"
        │           └── MyAnswersView (existing, no changes)
        ├── UserExportBar
        └── ManualEditConflict (modal, if applicable)
```

For the admin view (future):
```
AdminSubmissionPage
  └── OSISummaryView
        ├── OSIProcessOverview
        ├── OSIScoringColumns
        ├── OSIMetadataRow
        ├── OSINarrativeColumns
        ├── OSISavingsSection
        ├── AdminExportBar
        │     ├── Download JSON
        │     ├── Copy Markdown
        │     ├── UCSD Intake PDF
        │     ├── Claude Code Bundle
        │     └── Share via Email
        └── PromptBundlePreview (expandable)
```

---

## 8. Data Flow

### 8.1 User-Facing Summary Generation

```
User completes all 3 stages
         │
         ▼
AISummaryView mounts, detects allComplete && status === 'idle'
         │
         ▼
Builds IntakePayload from store (buildIntakeJson)
         │
         ▼
Calls POST /api/generate-user-summary
  with { intakePayload, gapAnswers }
         │
         ▼
Server: buildUserSummaryPrompt(intakePayload, gapAnswers)
         │
         ▼
Server: LLM call → returns { sections: { yourProject, theData, ... } }
         │
         ▼
Client stores in new store field: userSummary.sections
         │
         ▼
Client computes timeSavings locally (if data available)
Client computes whatsNext locally (template-based)
         │
         ▼
UserFriendlySummary renders all sections
```

### 8.2 OSI Summary Generation (on submit)

```
User clicks "Submit to TritonAI"
         │
         ▼
Client computes deterministic fields:
  - desirability (from answers mapping)
  - viability (from savings calculation)
  - feasibility (from answers mapping + auto-calc)
  - metadata (from answers)
  - savings base numbers
         │
         ▼
Calls POST /api/generate-osi-summary
  with { intakePayload, gapAnswers, calculatedFields }
         │
         ▼
Server: buildOSISummaryPrompt(intakePayload, gapAnswers, calculatedFields)
         │
         ▼
Server: LLM call → returns AI-generated narrative fields
         │
         ▼
Server: merges calculatedFields + AI narratives → full OSISummary
         │
         ▼
Server: stores in database alongside submission
         │
         ▼
Returns success to client
```

### 8.3 Claude Code Bundle Generation (on demand)

```
Admin clicks "Export Claude Code Bundle" on submission detail page
         │
         ▼
Client sends POST /api/generate-prompt-bundle
  with { intakePayload, gapAnswers, osiSummary }
         │
         ▼
Server: buildPromptBundlePrompt(intakePayload, gapAnswers, osiSummary)
         │
         ▼
Server: LLM call → returns { markdown: string }
         │
         ▼
Client offers download as .md file or copy-to-clipboard
```

### 8.4 Regeneration on New Data

When a snoozed gap question is answered:

```
User answers a snoozed question
         │
         ▼
Store updated: gapAnalysis.questions[i].status = 'answered'
         │
         ▼
AISummaryView detects change, triggers regeneration
         │
         ▼
New POST /api/generate-user-summary with updated gapAnswers
         │
         ▼
If user has manual edits → ManualEditConflict modal
         │
         ▼
Updated sections render
```

---

## 9. Store Changes

### 9.1 New State Fields

Add to `SessionState` in `src/store/session-store.ts`:

```typescript
// User-facing summary
userSummary: {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sections: {
    yourProject: string;
    theData: string;
    whatAIWouldHandle: string;
    howYoudSeeResults: string;
  } | null;
  manualEdits: Record<string, string>;
  errorMessage?: string;
};

// Workload details (for savings calculation — from Spec 01 new questions)
workloadDetails: {
  taskFrequency: string;     // 'few_times_month' | 'few_times_week' | 'daily' | 'multiple_daily'
  timePerInstance: string;   // 'few_minutes' | 'half_hour' | 'couple_hours' | 'half_day'
  peopleInvolved: string;   // 'just_me' | '2_3_people' | 'small_team' | 'large_group'
} | null;

// "Did we get this right?" dismissal flag
userSummaryPromptDismissed: boolean;
```

### 9.2 New Actions

```typescript
// User summary actions
setUserSummaryLoading: () => void;
setUserSummaryResult: (sections: UserSummaryState['sections']) => void;
setUserSummaryError: (message: string) => void;
editUserSummarySection: (sectionKey: string, content: string) => void;
clearUserSummaryEdit: (sectionKey: string) => void;

// Workload details
setWorkloadDetails: (details: WorkloadDetails) => void;

// Prompt dismissal
dismissUserSummaryPrompt: () => void;
```

### 9.3 Store Version Migration

Bump store version from `5` to `6`. Migration function:

```typescript
if (version < 6) {
  return {
    ...state,
    userSummary: {
      status: 'idle',
      sections: null,
      manualEdits: {},
    },
    workloadDetails: null,
    userSummaryPromptDismissed: false,
  };
}
```

---

## 10. Dependencies

### 10.1 Hard Dependencies

| Dependency | What it provides | Spec |
|---|---|---|
| **Spec 01 (Questions)** | The new conversational questions that map to Desirability, Viability, Feasibility, Savings, and Metadata. Without these, many UCSD template fields will show "TBD" or use fallback values. | Not yet written |

### 10.2 Soft Dependencies (works without, better with)

| Dependency | What it provides | Impact if missing |
|---|---|---|
| **Spec 06 (Persistent Submissions)** | User email, share links, submission status | "Share with a colleague" falls back to mailto; no persistent URL |
| **Spec 07 (Admin Dashboard)** | Where the OSI view lives | OSI summary is generated and stored but has no UI; accessible via JSON export only |
| **Spec 02 Gap Analysis (already built)** | Gap analysis answers enrich all summaries | Summaries work without gap answers but are less detailed |

### 10.3 Technical Dependencies

| Dependency | Current status | Notes |
|---|---|---|
| Server API (`/api/generate-summary`) | Exists | Need 2 new endpoints (user summary, OSI summary) + 1 on-demand endpoint (prompt bundle) |
| OpenAI/Anthropic API | Server has `server/src/llm/client.ts` | No changes needed to LLM client; just new prompts |
| Print CSS | Partially exists (`window.print()` button exists) | Need dedicated print stylesheet |
| `summary-formatter.ts` | Exists | Extend with savings calculation, complexity auto-calc, and field mappings |
| `summary-markdown.ts` | Exists | Extend with OSI format and user-friendly format |

---

## 11. Acceptance Criteria

### User-Facing Summary

- [ ] When all three wizard stages are complete, the user sees a friendly summary with headings "Your Project", "The Data", "What AI Would Handle", "How You'd See Results", and "What's Next"
- [ ] No UCSD intake terminology (desirability, viability, feasibility, process overview, protection level codes P1-P4) appears anywhere in the user-facing summary
- [ ] The "Time Savings" section appears only when sufficient workload data is available; otherwise it is hidden
- [ ] Each editable section enters edit mode on click, with a textarea that auto-resizes
- [ ] Edits are persisted in localStorage and survive page refresh
- [ ] The "Did we get this right?" banner appears on first view and dismisses permanently when "Got it" is clicked or any section is edited
- [ ] Answering a snoozed gap question triggers summary regeneration
- [ ] If a user has edited a section and regeneration produces different content, the ManualEditConflict modal appears
- [ ] The "Download a copy" button produces a clean PDF via `window.print()` with the print stylesheet hiding all chrome
- [ ] The "Share with a colleague" button opens a mailto: link (or persistent URL if Spec 06 is implemented)
- [ ] On mobile (< 640px), all sections stack vertically, export buttons stack, and the layout remains usable
- [ ] When the AI API is unavailable, the fallback bullet-point view renders immediately with data from the store

### OSI-Facing Summary

- [ ] The OSI summary matches the UCSD template layout: Process Overview (Purpose, Description, Key Points, Potential Impact, Questions & Considerations), Desirability, Viability, Feasibility, Metadata, Context, Challenge, Request, Savings
- [ ] Desirability Customer Size and Customer Need are derived from user answers (or fallback values) — never AI-hallucinated
- [ ] Viability Process Volume and Savings are calculated from workload data — never AI-hallucinated
- [ ] Feasibility Complexity is auto-calculated from data sources count, protection level, refinement count, output count, conditional feasibility, and regulatory context
- [ ] Context, Challenge, and Request are AI-generated paragraphs (2-3 each)
- [ ] Process Overview fields are AI-generated from all available data
- [ ] The OSI summary is stored in the database when the user submits
- [ ] The OSI summary JSON export includes both raw intake data and all generated fields

### Claude Code Prompt Bundle

- [ ] The prompt bundle is a valid markdown document with sections: Business Context, Requirements, Constraints, User Profile, Scope, Suggested Architecture, Acceptance Criteria, Implementation Notes
- [ ] Data Requirements include actual values from the store (data sources, types, volume, protection level)
- [ ] Constraints include protection-level-specific rules (deterministic, not AI-guessed)
- [ ] The bundle is generated on demand (not preemptively)
- [ ] The bundle can be downloaded as a `.md` file or copied to clipboard

### Export Formats

- [ ] JSON export includes the complete `FullExportJSON` schema (intake + user summary + OSI summary + gap analysis + manual edits)
- [ ] Markdown export produces clean, readable markdown for both user-facing and OSI-facing formats
- [ ] PDF export via print produces a professional document with UCSD branding (navy/blue color scheme)

### Error Handling

- [ ] AI API timeout shows "Taking longer than expected..." with retry button
- [ ] After 2 failed retries, the fallback view renders
- [ ] Network offline is detected and the user sees an appropriate message
- [ ] All user data is preserved in localStorage regardless of AI API status
