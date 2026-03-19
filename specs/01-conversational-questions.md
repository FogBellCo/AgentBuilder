# Spec 01: Conversational Data Collection

> **Status:** Draft
> **Last updated:** 2026-03-17
> **Depends on:** Nothing (this is the foundation)
> **Depended on by:** Spec 02 (Two-Summary System), Spec 03 (AI Gap Analysis), Spec 05 (Claude Code Prompt Bundle)

---

## 1. Overview

### What this spec covers

This spec defines every new question that gets woven into the AgentBuilder wizard to collect the data required by the UCSD intake format. Users never see UCSD terminology -- they answer short, friendly, conversational questions. The system maps their answers to the structured UCSD fields behind the scenes.

### Core design principle

> Users never see the UCSD intake format. They never encounter terms like "desirability," "viability," "feasibility," "process overview," or any internal OSI terminology. The tool asks natural, short, friendly questions and the system maps their answers to the UCSD format behind the scenes.

### What changes

1. **Three new questions added to the Describe stage** (the `DescribeIdeaForm` component)
2. **Three new decision-tree nodes added to the Gather stage** (after the data classification confirmation nodes)
3. **Three new decision-tree nodes added to the Refine stage** (after the audience question)
4. **Two new decision-tree nodes added to the Present stage** (after the output format selection)
5. **Four new "workload" questions added to a new Workload section** (collected as part of the Describe stage, after the existing fields)
6. **Three new "pain/context" questions added to a new Context section** (collected as part of the Describe stage)
7. **Two new metadata questions** (VC area dropdown already exists as `domain`; email + "on behalf of" collected at the end)
8. **New TypeScript interfaces and store fields** to hold all new data
9. **Auto-calculated savings** derived from workload answers
10. **Auto-calculated complexity score** derived from data sources, protection level, processing steps, and output format

### What does NOT change

- The existing decision tree nodes (gather-start, gather-help-classify, gather-confirm-*, gather-p4-stop, refine-task, refine-transform, refine-audience, refine-audience-warning, refine-confirm, present-format, present-confirm) remain exactly as they are.
- The existing `ProjectIdea`, `GatherDetails`, `RefineDetails`, `PresentDetails` interfaces remain intact. New fields are added alongside them, not replacing them.
- The existing `DecisionNode` type needs one new `inputType` value: `'free_text'`. See Section 7.

---

## 2. Complete Question Inventory

Questions are organized by where they appear in the user flow. Each question includes all implementation details.

---

### 2A. Describe Stage -- New Questions

These are added to `DescribeIdeaForm.tsx` below the existing fields. They appear as part of the same scrollable form, not as separate wizard screens.

---

#### Q-D1: "Who on your team does this work today?"

| Attribute | Value |
|---|---|
| **ID** | `describe-team-who` |
| **Question text** | "Who on your team does this work today?" |
| **Input type** | Free text |
| **Placeholder** | "e.g., 2 analysts in our office, or the entire advising team" |
| **Why we ask (hint)** | "This helps us understand the scope of the project and who would benefit." |
| **Example answer** | "2 analysts in our office" |
| **Max length** | 300 characters |
| **Required?** | No |
| **Maps to** | `Desirability > Customer Size` (context), `Context` paragraph (AI-generated) |
| **Position** | After "How is this done today?" (`currentProcess`) |

---

#### Q-D2: "Why is now the right time to explore this?"

| Attribute | Value |
|---|---|
| **ID** | `describe-why-now` |
| **Question text** | "Why is now the right time to explore this?" |
| **Input type** | Multi-select (pick all that apply) |
| **Options** | `volume_up` = "Volume is going up", `losing_staff` = "We're losing staff or bandwidth", `new_policy` = "New policy or mandate requires it", `leadership` = "Leadership asked us to look into it", `improve` = "Just want to improve how we work" |
| **Why we ask (hint)** | "Understanding your timing helps us prioritize and plan." |
| **Example answer** | ["volume_up", "improve"] |
| **Required?** | No |
| **Maps to** | `Challenge` paragraph (AI-generated), `Desirability > Customer Need` (derived) |
| **Position** | After Q-D1 |

---

#### Q-D3: "If this doesn't get built, what happens?"

| Attribute | Value |
|---|---|
| **ID** | `describe-consequences` |
| **Question text** | "If this doesn't get built, what happens?" |
| **Input type** | Free text |
| **Placeholder** | "e.g., Reports keep being late, or we just keep doing it by hand" |
| **Why we ask (hint)** | "This helps us understand the urgency and make a stronger case for your project." |
| **Example answer** | "Reports are late every quarter and students don't get answers in time" |
| **Max length** | 500 characters |
| **Required?** | No |
| **Maps to** | `Challenge` paragraph (AI-generated), `Desirability > Customer Need` (derived) |
| **Position** | After Q-D2 |

---

### 2B. Describe Stage -- Workload Section (New)

These questions appear as a visually distinct section within the Describe form, after the existing fields and Q-D1 through Q-D3. They have a section header: **"Help us understand the workload"** with a subtitle: "Just rough estimates -- we'll do the math."

---

#### Q-W1: "Roughly how often do you do this task?"

| Attribute | Value |
|---|---|
| **ID** | `workload-frequency` |
| **Question text** | "Roughly how often do you do this task?" |
| **Input type** | Single-select |
| **Options** | `few_monthly` = "A few times a month", `few_weekly` = "A few times a week", `daily` = "Daily", `multiple_daily` = "Multiple times a day" |
| **Why we ask (hint)** | "This helps us estimate how much time AI could save." |
| **Example answer** | "few_weekly" |
| **Required?** | No |
| **Maps to** | `Viability > Process Volume`, `Savings > Expected Volume` |
| **Position** | First in the workload section |
| **Numeric mapping** | `few_monthly` = 4/mo, `few_weekly` = 12/mo, `daily` = 22/mo, `multiple_daily` = 60/mo |

---

#### Q-W2: "How long does it take each time?"

| Attribute | Value |
|---|---|
| **ID** | `workload-duration` |
| **Question text** | "How long does it take each time?" |
| **Input type** | Single-select |
| **Options** | `few_minutes` = "A few minutes", `half_hour` = "About half an hour", `couple_hours` = "A couple hours", `half_day` = "Half a day or more" |
| **Why we ask (hint)** | "Even rough guesses help -- we're looking for the ballpark." |
| **Example answer** | "couple_hours" |
| **Required?** | No |
| **Maps to** | `Viability > Potential Savings per Process Cycle`, `Savings > Time spent per instance` |
| **Position** | After Q-W1 |
| **Numeric mapping (hours)** | `few_minutes` = 0.1, `half_hour` = 0.5, `couple_hours` = 2, `half_day` = 4 |

---

#### Q-W3: "How many people spend time on this?"

| Attribute | Value |
|---|---|
| **ID** | `workload-people` |
| **Question text** | "How many people spend time on this?" |
| **Input type** | Single-select |
| **Options** | `just_me` = "Just me", `two_three` = "2-3 people", `small_team` = "A small team (4-10)", `large_group` = "A large group (10+)" |
| **Why we ask (hint)** | "This helps us understand how widely the time savings would spread." |
| **Example answer** | "two_three" |
| **Required?** | No |
| **Maps to** | `Desirability > Customer Size` (scale), `Savings` multiplier |
| **Position** | After Q-W2 |
| **Numeric mapping** | `just_me` = 1, `two_three` = 2.5, `small_team` = 7, `large_group` = 15 |

---

#### Q-W4: "What's the most annoying part?"

| Attribute | Value |
|---|---|
| **ID** | `workload-pain-point` |
| **Question text** | "What's the most annoying part?" |
| **Input type** | Free text |
| **Placeholder** | "e.g., We have to copy-paste between two systems, or it takes 3 people to review one form" |
| **Why we ask (hint)** | "The specific pain points help us figure out what AI should focus on." |
| **Example answer** | "We have to copy-paste data from Canvas into a spreadsheet, then manually check for errors" |
| **Max length** | 500 characters |
| **Required?** | No |
| **Maps to** | `Challenge` paragraph (AI-generated) |
| **Position** | After Q-W3 |

After Q-W1 through Q-W3 are answered, the form displays a calculated savings callout (see Section 4):

> "It sounds like your team spends about **X hours/month** on this. AI could help get a lot of that time back."

This callout only appears if all three of Q-W1, Q-W2, and Q-W3 have been answered. It is purely informational and not editable.

---

### 2C. Describe Stage -- Context Section (New)

These appear as another visually distinct section within the Describe form, after the Workload section. Section header: **"A little more context"** with subtitle: "Almost done -- just a few more so we can tell your story."

---

#### Q-C1: "What tools or systems do you use for this right now?"

| Attribute | Value |
|---|---|
| **ID** | `context-current-tools` |
| **Question text** | "What tools or systems do you use for this right now?" |
| **Input type** | Multi-select checkboxes with "Other" free-text |
| **Options** | `canvas` = "Canvas", `servicenow` = "ServiceNow", `oracle` = "Oracle", `concur` = "Concur", `box` = "Box", `excel` = "Excel / Google Sheets", `email` = "Email", `paper` = "Paper forms", `other` = "Other" |
| **"Other" behavior** | When "Other" is selected, a text input appears below: placeholder "What else?", max 100 chars |
| **Why we ask (hint)** | "Knowing your current tools helps us plan the integration." |
| **Example answer** | ["canvas", "excel"] |
| **Required?** | No |
| **Maps to** | `Context` paragraph (AI-generated), `Feasibility > Data Availability`, `Feasibility > Alignment with Existing Solutions` |
| **Position** | First in the context section |

---

#### Q-C2: "If you could wave a magic wand, what would the AI do?"

| Attribute | Value |
|---|---|
| **ID** | `context-magic-wand` |
| **Question text** | "If you could wave a magic wand, what would the AI do?" |
| **Input type** | Free text |
| **Placeholder** | "Dream big -- there's no wrong answer here" |
| **Why we ask (hint)** | "This helps us understand your ideal outcome, even if we start smaller." |
| **Example answer** | "Read all the course evaluations, find the common themes, and create a summary report I can send to the dean" |
| **Max length** | 1000 characters |
| **Required?** | No |
| **Maps to** | `Request` paragraph (AI-generated), `Process Overview > Purpose` (AI-generated) |
| **Position** | After Q-C1 |

---

#### Q-C3: "What would 'great' look like 6 months from now?"

| Attribute | Value |
|---|---|
| **ID** | `context-success-vision` |
| **Question text** | "What would 'great' look like 6 months from now?" |
| **Input type** | Free text |
| **Placeholder** | "e.g., Processing time drops from days to minutes, or staff can focus on advising instead of data entry" |
| **Why we ask (hint)** | "This becomes part of the success criteria for your project." |
| **Example answer** | "Processing time drops from days to minutes and staff can focus on advising instead of data entry" |
| **Max length** | 500 characters |
| **Required?** | No |
| **Maps to** | `Process Overview > Potential Impact` (AI-generated), `Request` paragraph (AI-generated) |
| **Position** | After Q-C2 |

---

### 2D. Gather Stage -- New Decision Tree Nodes

These are new nodes added to `gather-tree.ts`. They appear **after** the protection level confirmation nodes (gather-confirm-p1, gather-confirm-p2, gather-confirm-p3) but **before** the stage completes. The confirmation nodes' `nextNodeId: null` values are changed to point to the first new gather node.

---

#### Q-G1: "What systems or tools does your team use day-to-day?"

| Attribute | Value |
|---|---|
| **Node ID** | `gather-daily-tools` |
| **Question text** | "What systems or tools does your team use day-to-day?" |
| **Description** | "Select everything your team touches regularly -- even if it's not related to this project." |
| **Input type** | `multi_choice` |
| **Options** | `canvas` = "Canvas" (icon: `BookOpen`), `servicenow` = "ServiceNow" (icon: `Headset`), `oracle` = "Oracle / PeopleSoft" (icon: `Database`), `box` = "Box" (icon: `FolderOpen`), `excel` = "Excel / Google Sheets" (icon: `Table`), `concur` = "Concur" (icon: `Receipt`), `slack-teams` = "Slack or Teams" (icon: `MessageSquare`), `custom-app` = "A custom-built tool" (icon: `Code`), `other-system` = "Something else" (icon: `MoreHorizontal`) |
| **Next node** | `gather-data-frequency` |
| **Why we ask** | Displayed in the `description` field |
| **Maps to** | `Context` paragraph (AI-generated), `Feasibility > Data Availability`, `Feasibility > Alignment with Existing Solutions` |
| **classifiesProtectionLevel** | `false` |

---

#### Q-G2: "How often does new data come in?"

| Attribute | Value |
|---|---|
| **Node ID** | `gather-data-frequency` |
| **Question text** | "How often does new data come in?" |
| **Description** | "This helps us understand how your data flows and whether AI should run continuously or on a schedule." |
| **Input type** | `single_choice` |
| **Options** | `continuous` = "All the time -- it's a constant stream" (icon: `Zap`), `daily` = "Every day" (icon: `CalendarDays`), `few_weekly` = "A few times a week" (icon: `CalendarRange`), `monthly` = "Monthly or less" (icon: `Calendar`), `not_sure` = "Not sure" (icon: `HelpCircle`) |
| **Next node** | `gather-data-expert` |
| **Maps to** | `Viability > Process Volume` (secondary signal), `Context` paragraph |
| **classifiesProtectionLevel** | `false` |

---

#### Q-G3: "Is there anyone on your team who really knows this data well?"

| Attribute | Value |
|---|---|
| **Node ID** | `gather-data-expert` |
| **Question text** | "Is there anyone on your team who really knows this data well?" |
| **Description** | "It helps to know if there's a go-to person who understands the data's quirks and history." |
| **Input type** | `single_choice` |
| **Options** | `yes_me` = "Yes -- that's me" (icon: `User`), `yes_someone` = "Yes -- someone else on my team" (icon: `Users`), `sort_of` = "Sort of -- we all know bits and pieces" (icon: `UsersRound`), `no_one` = "Not really -- the knowledge is scattered" (icon: `HelpCircle`) |
| **Next node** | `null` (stage completes here -- triggers GatherDetailForm) |
| **Maps to** | `Feasibility > Data Availability` (secondary signal), `Questions & Considerations` (AI-generated) |
| **classifiesProtectionLevel** | `false` |

**Wiring change:** The `nextNodeId` for the "That sounds right -- continue" options in `gather-confirm-p1`, `gather-confirm-p2`, and `gather-confirm-p3` changes from `null` to `'gather-daily-tools'`.

---

### 2E. Refine Stage -- New Decision Tree Nodes

These are new nodes added to `refine-tree.ts`. They appear **after** `refine-confirm` but **before** the stage completes.

---

#### Q-R1: "Walk me through a typical example of how you do this today"

| Attribute | Value |
|---|---|
| **Node ID** | `refine-walkthrough` |
| **Question text** | "Walk me through a typical example of how you do this today" |
| **Description** | "Start from when you first get the request or task. What's step one? Then what?" |
| **Input type** | `free_text` (NEW -- see Section 7) |
| **Placeholder** | "e.g., First I get an email with a spreadsheet attached. I open it in Excel, scan for errors, copy the data into our system..." |
| **Max length** | 1500 |
| **Next node** | `refine-result-audience` |
| **Maps to** | `Process Overview > Description` (AI-generated), `Context` paragraph (AI-generated) |
| **Required?** | No (user can skip with a "Skip" button) |

---

#### Q-R2: "Who uses the result of this work?"

| Attribute | Value |
|---|---|
| **Node ID** | `refine-result-audience` |
| **Question text** | "Who uses the result of this work?" |
| **Description** | "This helps us understand who the AI output needs to serve." |
| **Input type** | `multi_choice` |
| **Options** | `my_team` = "My team" (icon: `Users`), `other_depts` = "Other departments" (icon: `Building2`), `students` = "Students" (icon: `GraduationCap`), `leadership` = "Leadership" (icon: `Crown`), `external` = "External partners" (icon: `Globe`) |
| **Next node** | `refine-approval` |
| **Maps to** | `Desirability > Customer Size` (derived), `Process Overview > Potential Impact` (AI-generated) |
| **classifiesProtectionLevel** | `false` |

---

#### Q-R3: "Does anyone need to review or approve the result before it goes out?"

| Attribute | Value |
|---|---|
| **Node ID** | `refine-approval` |
| **Question text** | "Does anyone need to review or approve the result before it goes out?" |
| **Description** | "Some outputs need a human check before they're shared. That's totally fine -- we just need to plan for it." |
| **Input type** | `single_choice` |
| **Options** | `always` = "Yes, always" (icon: `ShieldCheck`), `sometimes` = "Sometimes, depends on the situation" (icon: `Scale`), `never` = "No, I just send it" (icon: `Send`) |
| **Next node** | `null` (stage completes here -- triggers RefineDetailForm) |
| **Maps to** | `Feasibility > Complexity` (factor), `Process Overview > AI Solution Considerations` (AI-generated) |
| **classifiesProtectionLevel** | `false` |

**Wiring change:** The `nextNodeId` for the "Continue to add details" option in `refine-confirm` changes from `null` to `'refine-walkthrough'`.

---

### 2F. Present Stage -- New Decision Tree Nodes

These are new nodes added to `present-tree.ts`. They appear **after** `present-confirm` but **before** the stage completes.

---

#### Q-P1: "How quickly do people need to see results?"

| Attribute | Value |
|---|---|
| **Node ID** | `present-urgency` |
| **Question text** | "How quickly do people need to see results?" |
| **Description** | "This helps us decide whether the AI should work in real-time, on a schedule, or on demand." |
| **Input type** | `single_choice` |
| **Options** | `realtime` = "Right away -- as fast as possible" (icon: `Zap`), `same_day` = "Same day is fine" (icon: `Clock`), `within_week` = "Within a week" (icon: `CalendarDays`), `whenever` = "Whenever it's ready" (icon: `Coffee`) |
| **Next node** | `present-cross-dept` |
| **Maps to** | `Feasibility > Complexity` (factor), `Process Overview > AI Solution Considerations` (AI-generated) |
| **classifiesProtectionLevel** | `false` |

---

#### Q-P2: "Would other departments benefit from this too, or just yours?"

| Attribute | Value |
|---|---|
| **Node ID** | `present-cross-dept` |
| **Question text** | "Would other departments benefit from this too, or just yours?" |
| **Description** | "If others could use this, it might change how we build and deploy it." |
| **Input type** | `single_choice` |
| **Options** | `just_us` = "Just us" (icon: `User`), `few_others` = "Maybe a few other groups" (icon: `Users`), `many_teams` = "Lots of teams could use this" (icon: `Building2`), `whole_campus` = "The whole campus" (icon: `Globe`) |
| **Next node** | `null` (stage completes here -- triggers present output selection detail) |
| **Maps to** | `Desirability > Customer Size` |
| **classifiesProtectionLevel** | `false` |

**Wiring change:** The `nextNodeId` for the "See my complete summary" option in `present-confirm` changes from `null` to `'present-urgency'`.

---

### 2G. Metadata Questions (End of Flow)

These are collected on the Summary page before the user can submit/export. They are NOT decision tree nodes -- they are form fields on the summary page.

---

#### Q-M1: "Are you submitting this for yourself or someone else?"

| Attribute | Value |
|---|---|
| **ID** | `meta-on-behalf` |
| **Question text** | "Are you submitting this for yourself or someone else?" |
| **Input type** | Single-select with conditional free text |
| **Options** | `self` = "For myself", `other` = "On behalf of someone else" |
| **Conditional** | If `other` is selected, show text input: "Who are you submitting for?" placeholder: "Their name and role" |
| **Maps to** | `Metadata > On behalf of` |
| **Required?** | No |

---

#### Q-M2: "Have you heard of TritonGPT?"

| Attribute | Value |
|---|---|
| **ID** | `meta-tritongpt` |
| **Question text** | "Have you heard of TritonGPT?" |
| **Input type** | Single-select |
| **Options** | `use_it` = "Yes, I already use it", `heard_of` = "I've heard of it", `no` = "No, what's that?" |
| **Maps to** | `Feasibility > Alignment with Existing Solutions` |
| **Required?** | No |

Note: The user's email is already captured by the existing `EmailPrompt` component on the landing page. The domain/department dropdown on the Describe page already maps to `Metadata > VC Area`.

---

## 3. UCSD Intake Format Mapping Table

This table maps every field in the UCSD intake format to its data source(s) within AgentBuilder.

### Process Overview (100% AI-Generated)

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Purpose | Q-C2 (magic wand) + project title + project description | AI-generated paragraph |
| Description | Q-R1 (walkthrough) + all wizard answers + Q-D1 (team who) | AI-generated paragraph |
| Key Points | Q-W4 (pain point) + Q-D3 (consequences) + Q-C1 (current tools) | AI-generated bullet points |
| AI Solution Considerations | Protection level + Q-G1 (daily tools) + Q-M2 (TritonGPT) + Q-R3 (approval) + Q-P1 (urgency) | AI-generated paragraph |
| Potential Impact | Savings calculation + Q-P2 (cross-dept) + Q-R2 (result audience) + Q-C3 (success vision) | AI-generated paragraph |
| Questions & Considerations | P-level warnings + Q-G3 (data expert) + regulatory context + feasibility conditions | AI-generated paragraph |

### Desirability

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Customer Size | Q-P2 (cross-dept) + Q-D1 (team who) + Q-W3 (people) + Q-R2 (result audience) | **Calculated** -- see Section 4.2 |
| Customer Need | Q-D2 (why now) + Q-D3 (consequences) + Q-W1 (frequency) | **Calculated** -- see Section 4.3 |

### Viability

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Process Volume | Q-W1 (frequency) | **Direct map** -- see Section 4.1 |
| Potential Savings per Process Cycle | Q-W2 (duration) | **Direct map** |
| Potential Savings per Month | Q-W1 + Q-W2 + Q-W3 | **Calculated** -- `frequency * duration * people` (see Section 4.1) |

### Feasibility

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Alignment with Existing Solutions | Q-M2 (TritonGPT) + `projectGoal` (existing Describe field) + `preferredTool` (existing Describe field) | **Calculated** -- see Section 4.4 |
| Data Availability | Q-G1 (daily tools) + Q-G2 (data frequency) + Q-G3 (data expert) + `gatherDetails.sourceSystem` | **Calculated** -- see Section 4.5 |
| Complexity | Auto-calculated from multiple signals | **Calculated** -- see Section 4.6 |

### Context / Challenge / Request

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Context | Q-D1 (team who) + Q-C1 (current tools) + `currentProcess` (existing Describe field) + `existingStatus` (existing Describe field) | AI-generated paragraph |
| Challenge | Q-W4 (pain point) + Q-D2 (why now) + Q-D3 (consequences) | AI-generated paragraph |
| Request | Q-C2 (magic wand) + Q-C3 (success vision) + refine-task answer + present-format answer | AI-generated paragraph |

### Savings

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| Expected Volume | Q-W1 (frequency) | **Direct map** to monthly number, annualized x12 |
| Time spent per instance | Q-W2 (duration) | **Direct map** to hours |
| Potential time savings per instance | Q-W2 (duration) | **Calculated** -- 80% of duration (assumption) |
| Time savings per year | Q-W1 + Q-W2 + Q-W3 | **Calculated** -- monthly savings x 12 |
| Impact | Savings number + Q-P2 (cross-dept) + Q-C3 (success vision) | AI-generated paragraph |

### Metadata

| UCSD Field | Source Questions | Derivation Method |
|---|---|---|
| VC Area | `domain` (existing Describe field) | **Direct map** |
| Submitted by | User email (from EmailPrompt on landing page) | **Direct map** |
| On behalf of | Q-M1 (on behalf) | **Direct map** or "self" |

---

## 4. Auto-Calculated Fields

### 4.1 Savings Calculation

The system calculates monthly and annual time savings from three inputs:

```typescript
// Frequency -> monthly occurrences
const FREQUENCY_MAP: Record<string, number> = {
  few_monthly: 4,
  few_weekly: 12,
  daily: 22,
  multiple_daily: 60,
};

// Duration -> hours per occurrence
const DURATION_MAP: Record<string, number> = {
  few_minutes: 0.1,
  half_hour: 0.5,
  couple_hours: 2,
  half_day: 4,
};

// People -> multiplier
const PEOPLE_MAP: Record<string, number> = {
  just_me: 1,
  two_three: 2.5,
  small_team: 7,
  large_group: 15,
};

// Assumed AI time savings percentage
const AI_SAVINGS_PERCENTAGE = 0.80; // 80% -- conservative estimate

function calculateSavings(frequency: string, duration: string, people: string) {
  const monthlyOccurrences = FREQUENCY_MAP[frequency] ?? 0;
  const hoursPerOccurrence = DURATION_MAP[duration] ?? 0;
  const peopleMultiplier = PEOPLE_MAP[people] ?? 1;

  const monthlyHoursTotal = monthlyOccurrences * hoursPerOccurrence * peopleMultiplier;
  const monthlySavings = Math.round(monthlyHoursTotal * AI_SAVINGS_PERCENTAGE);
  const annualSavings = monthlySavings * 12;

  return {
    monthlyHoursTotal: Math.round(monthlyHoursTotal),
    monthlySavings,
    annualSavings,
    // For the UCSD "Expected Volume" field (annualized)
    expectedVolumePerYear: monthlyOccurrences * 12,
    // For "Time spent per instance"
    hoursPerInstance: hoursPerOccurrence,
    // For "Potential time savings per instance"
    savingsPerInstance: Math.round(hoursPerOccurrence * AI_SAVINGS_PERCENTAGE * 10) / 10,
  };
}
```

**Display logic:** After the user answers Q-W1, Q-W2, and Q-W3, show:

> "It sounds like your team spends about **{monthlyHoursTotal} hours/month** on this. AI could help get a lot of that time back."

If `monthlyHoursTotal` is 0 or any input is missing, do not show the callout.

### 4.2 Customer Size Derivation

Maps to one of: `One department`, `Multiple departments`, `Multiple VC areas`, `Campus`.

```typescript
function deriveCustomerSize(
  crossDept: string,       // Q-P2
  resultAudience: string[], // Q-R2 (multi-select IDs)
  people: string,           // Q-W3
): string {
  // Q-P2 is the primary signal
  if (crossDept === 'whole_campus') return 'Campus';
  if (crossDept === 'many_teams') return 'Multiple VC areas';
  if (crossDept === 'few_others') return 'Multiple departments';

  // Secondary: if result audience includes students or external, bump up
  if (resultAudience.includes('students') || resultAudience.includes('external'))
    return 'Multiple VC areas';
  if (resultAudience.includes('other_depts') || resultAudience.includes('leadership'))
    return 'Multiple departments';

  return 'One department';
}
```

### 4.3 Customer Need Derivation

Maps to: `Low`, `Medium`, `High`.

```typescript
function deriveCustomerNeed(
  whyNow: string[],       // Q-D2 (multi-select IDs)
  consequences: string,    // Q-D3 (free text, check if non-empty)
  frequency: string,       // Q-W1
): 'Low' | 'Medium' | 'High' {
  let score = 0;

  // Why now signals
  if (whyNow.includes('volume_up')) score += 2;
  if (whyNow.includes('losing_staff')) score += 3;
  if (whyNow.includes('new_policy')) score += 3;
  if (whyNow.includes('leadership')) score += 2;
  if (whyNow.includes('improve')) score += 1;

  // Consequences provided = urgency signal
  if (consequences.trim().length > 20) score += 2;

  // High frequency = higher need
  if (frequency === 'multiple_daily') score += 2;
  if (frequency === 'daily') score += 1;

  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}
```

### 4.4 Alignment with Existing Solutions Derivation

Maps to one of: `Add-on to existing TGPT tool`, `New TGPT tool`, `New tool (non-TGPT)`.

```typescript
function deriveAlignment(
  tritonGPT: string,     // Q-M2
  projectGoal: string,   // existing Describe field
  preferredTool: string, // existing Describe field
): string {
  // If user specifically wants to add to TritonGPT
  if (projectGoal === 'add_to_tritongpt') return 'Add-on to existing TGPT tool';

  // If they already use TritonGPT and haven't specified a different tool
  if (tritonGPT === 'use_it' && !preferredTool) return 'New TGPT tool';

  // If they've heard of it, suggest TGPT
  if (tritonGPT === 'heard_of' && !preferredTool) return 'New TGPT tool';

  // If they specified a non-TGPT tool, or don't know about TGPT
  if (preferredTool && !preferredTool.toLowerCase().includes('triton'))
    return 'New tool (non-TGPT)';

  // Default: new TGPT tool (campus standard)
  return 'New TGPT tool';
}
```

### 4.5 Data Availability Derivation

Maps to one of: `Readily available`, `Requires new integration`, `Requires new data source`.

```typescript
function deriveDataAvailability(
  dailyTools: string[],    // Q-G1 (multi-select IDs)
  dataFrequency: string,   // Q-G2
  dataExpert: string,      // Q-G3
  sourceSystem: string,    // existing GatherDetails field
): string {
  let accessScore = 0;

  // Known systems are easier to integrate with
  const knownSystems = ['canvas', 'servicenow', 'oracle', 'concur', 'box', 'excel'];
  const knownCount = dailyTools.filter(t => knownSystems.includes(t)).length;
  if (knownCount > 0) accessScore += 2;

  // Source system explicitly named
  if (sourceSystem.trim().length > 0) accessScore += 1;

  // Data expert available
  if (dataExpert === 'yes_me' || dataExpert === 'yes_someone') accessScore += 1;

  // Data comes in regularly (not "not sure")
  if (dataFrequency !== 'not_sure') accessScore += 1;

  // Custom or unnamed tools are harder
  if (dailyTools.includes('custom-app') || dailyTools.includes('other-system'))
    accessScore -= 1;

  if (accessScore >= 3) return 'Readily available';
  if (accessScore >= 1) return 'Requires new integration';
  return 'Requires new data source';
}
```

### 4.6 Complexity Score Derivation

Maps to: `Low`, `Medium`, `High`. The user never sees or answers a complexity question -- this is 100% auto-calculated.

```typescript
function deriveComplexity(
  protectionLevel: string,       // from Gather stage
  dailyTools: string[],          // Q-G1 (number of systems)
  dataPrep: string,              // from refine-transform answer
  approval: string,              // Q-R3
  urgency: string,               // Q-P1
  outputFormatCount: number,     // number of outputs selected in Present
  projectComplexity: string,     // existing Describe field (user's self-assessment)
): 'Low' | 'Medium' | 'High' {
  let score = 0;

  // Protection level
  if (protectionLevel === 'P3') score += 3;
  if (protectionLevel === 'P2') score += 1;

  // Number of data sources
  if (dailyTools.length >= 4) score += 3;
  else if (dailyTools.length >= 2) score += 1;

  // Data preparation needs
  if (dataPrep === 'combine') score += 2;
  if (dataPrep === 'deidentify') score += 2;

  // Approval required
  if (approval === 'always') score += 1;

  // Urgency
  if (urgency === 'realtime') score += 2;

  // Multiple output formats
  if (outputFormatCount >= 3) score += 2;
  else if (outputFormatCount >= 2) score += 1;

  // User's own complexity assessment as a tiebreaker
  if (projectComplexity === 'multiple') score += 1;

  if (score >= 7) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}
```

### 4.7 Viability: Process Volume Mapping

The UCSD format uses ranges. Map Q-W1 to the correct range:

| Q-W1 Answer | Monthly Count | UCSD Process Volume |
|---|---|---|
| `few_monthly` | ~4 | `<100 per month` |
| `few_weekly` | ~12 | `<100 per month` |
| `daily` | ~22 | `<100 per month` |
| `multiple_daily` | ~60 | `<100 per month` |

Note: These are per-person counts. When combined with Q-W3 (people multiplier):

| Combined Monthly Volume | UCSD Process Volume |
|---|---|
| < 100 | `<100 per month` |
| 100 - 1000 | `100-1000 per month` |
| > 1000 | `>1000 per month` |

```typescript
function deriveProcessVolume(frequency: string, people: string): string {
  const monthly = (FREQUENCY_MAP[frequency] ?? 0) * (PEOPLE_MAP[people] ?? 1);
  if (monthly > 1000) return '>1000 per month';
  if (monthly >= 100) return '100-1000 per month';
  return '<100 per month';
}
```

### 4.8 Viability: Potential Savings per Cycle Mapping

| Q-W2 Answer | Hours | UCSD Savings per Cycle |
|---|---|---|
| `few_minutes` | ~0.1 hr | `<15 min` |
| `half_hour` | ~0.5 hr | `15 min - 1 hour` |
| `couple_hours` | ~2 hr | `1 - 200 hours` |
| `half_day` | ~4 hr | `>200 hours` |

Note: The UCSD format categories in the screenshot are `<1 hour`, `1 hour - 200 hours`, `>200 hours` for Potential Savings per Month. The per-cycle mapping uses: `<15 min`, `15 min - 1 hour`, `>1 hour`.

```typescript
function deriveSavingsPerCycle(duration: string): string {
  const hours = DURATION_MAP[duration] ?? 0;
  const savingsHours = hours * AI_SAVINGS_PERCENTAGE;
  if (savingsHours < 0.25) return '<15 min';
  if (savingsHours <= 1) return '15 min - 1 hour';
  return '>1 hour';
}
```

---

## 5. New Data Model

### 5.1 New TypeScript Interfaces

Add to `src/types/decision-tree.ts`:

```typescript
/** Answers to the new conversational questions woven throughout the wizard */
export interface ConversationalAnswers {
  // Describe stage -- team & context
  teamWho: string;                // Q-D1
  whyNow: string[];               // Q-D2 (multi-select IDs)
  consequences: string;           // Q-D3

  // Describe stage -- workload
  workloadFrequency: string;      // Q-W1 (option ID)
  workloadDuration: string;       // Q-W2 (option ID)
  workloadPeople: string;         // Q-W3 (option ID)
  workloadPainPoint: string;      // Q-W4

  // Describe stage -- context
  currentTools: string[];         // Q-C1 (multi-select IDs)
  currentToolsOther: string;      // Q-C1 "Other" free text
  magicWand: string;              // Q-C2
  successVision: string;          // Q-C3

  // Metadata (summary page)
  onBehalf: 'self' | 'other' | ''; // Q-M1 selection
  onBehalfName: string;            // Q-M1 conditional text
  tritonGPT: string;              // Q-M2 (option ID)
}

/** Auto-calculated values derived from conversational answers */
export interface DerivedIntakeValues {
  // Savings
  monthlyHoursTotal: number;
  monthlySavings: number;
  annualSavings: number;
  expectedVolumePerYear: number;
  hoursPerInstance: number;
  savingsPerInstance: number;

  // UCSD format fields
  customerSize: string;     // "One department" | "Multiple departments" | "Multiple VC areas" | "Campus"
  customerNeed: string;     // "Low" | "Medium" | "High"
  processVolume: string;    // "<100 per month" | "100-1000 per month" | ">1000 per month"
  savingsPerCycle: string;  // "<15 min" | "15 min - 1 hour" | ">1 hour"
  savingsPerMonth: string;  // "<1 hour" | "1 - 200 hours" | ">200 hours"
  alignment: string;        // "Add-on to existing TGPT tool" | "New TGPT tool" | "New tool (non-TGPT)"
  dataAvailability: string; // "Readily available" | "Requires new integration" | "Requires new data source"
  complexity: string;       // "Low" | "Medium" | "High"
}
```

### 5.2 DecisionNode Type Extension

The `DecisionNode.inputType` union needs a new member to support free-text questions in the decision tree:

```typescript
// In src/types/decision-tree.ts
export interface DecisionNode {
  id: string;
  stage: Stage;
  question: string;
  description?: string;
  inputType: 'single_choice' | 'multi_choice' | 'confirmation' | 'free_text'; // ADD 'free_text'
  options: DecisionOption[];
  classifiesProtectionLevel?: boolean;
  // NEW optional fields for free_text nodes:
  placeholder?: string;
  maxLength?: number;
  skippable?: boolean;  // if true, show a "Skip" button
}
```

### 5.3 Zustand Store Changes

Add to `SessionState` interface in `src/store/session-store.ts`:

```typescript
// New state fields
conversationalAnswers: ConversationalAnswers;

// New actions
setConversationalAnswer: <K extends keyof ConversationalAnswers>(
  key: K,
  value: ConversationalAnswers[K]
) => void;
setConversationalAnswers: (partial: Partial<ConversationalAnswers>) => void;
```

Default value:

```typescript
const defaultConversationalAnswers: ConversationalAnswers = {
  teamWho: '',
  whyNow: [],
  consequences: '',
  workloadFrequency: '',
  workloadDuration: '',
  workloadPeople: '',
  workloadPainPoint: '',
  currentTools: [],
  currentToolsOther: '',
  magicWand: '',
  successVision: '',
  onBehalf: '',
  onBehalfName: '',
  tritonGPT: '',
};
```

**Store version bump:** Increment from `5` to `6`. Migration function:

```typescript
if (version < 6) {
  return {
    ...state,
    conversationalAnswers: { ...defaultConversationalAnswers },
  };
}
```

**Note:** `DerivedIntakeValues` is NOT stored in the Zustand store. It is computed on-the-fly by a pure function whenever needed (for display in the savings callout, or for export). This avoids stale derived data.

### 5.4 New Utility Module

Create `src/lib/intake-calculations.ts` containing:

- `calculateSavings(frequency, duration, people)` -- Section 4.1
- `deriveCustomerSize(crossDept, resultAudience, people)` -- Section 4.2
- `deriveCustomerNeed(whyNow, consequences, frequency)` -- Section 4.3
- `deriveAlignment(tritonGPT, projectGoal, preferredTool)` -- Section 4.4
- `deriveDataAvailability(dailyTools, dataFrequency, dataExpert, sourceSystem)` -- Section 4.5
- `deriveComplexity(...)` -- Section 4.6
- `deriveProcessVolume(frequency, people)` -- Section 4.7
- `deriveSavingsPerCycle(duration)` -- Section 4.8
- `deriveSavingsPerMonth(frequency, duration, people)` -- returns "<1 hour" | "1 - 200 hours" | ">200 hours"
- `computeAllDerivedValues(conversationalAnswers, stageAnswers, projectIdea, gatherDetails, presentDetails)` -- master function that calls all of the above and returns a `DerivedIntakeValues` object

All constants (`FREQUENCY_MAP`, `DURATION_MAP`, `PEOPLE_MAP`, `AI_SAVINGS_PERCENTAGE`) are exported from this module.

---

## 6. Decision Tree Changes (Detailed)

### 6.1 gather-tree.ts

**Modify existing nodes:**

1. `gather-confirm-p1`: Change option `confirm-p1.nextNodeId` from `null` to `'gather-daily-tools'`
2. `gather-confirm-p2`: Change option `confirm-p2.nextNodeId` from `null` to `'gather-daily-tools'`
3. `gather-confirm-p3`: Change option `confirm-p3.nextNodeId` from `null` to `'gather-daily-tools'`

**Add new nodes** (append to the array):

```typescript
{
  id: 'gather-daily-tools',
  stage: 'GATHER',
  question: 'What systems or tools does your team use day-to-day?',
  description: 'Select everything your team touches regularly -- even if it\'s not related to this project.',
  inputType: 'multi_choice',
  options: [
    { id: 'canvas', label: 'Canvas', icon: 'BookOpen', nextNodeId: 'gather-data-frequency' },
    { id: 'servicenow', label: 'ServiceNow', icon: 'Headset', nextNodeId: 'gather-data-frequency' },
    { id: 'oracle', label: 'Oracle / PeopleSoft', icon: 'Database', nextNodeId: 'gather-data-frequency' },
    { id: 'concur', label: 'Concur', icon: 'Receipt', nextNodeId: 'gather-data-frequency' },
    { id: 'box', label: 'Box', icon: 'FolderOpen', nextNodeId: 'gather-data-frequency' },
    { id: 'excel', label: 'Excel / Google Sheets', icon: 'Table', nextNodeId: 'gather-data-frequency' },
    { id: 'slack-teams', label: 'Slack or Teams', icon: 'MessageSquare', nextNodeId: 'gather-data-frequency' },
    { id: 'custom-app', label: 'A custom-built tool', icon: 'Code', nextNodeId: 'gather-data-frequency' },
    { id: 'other-system', label: 'Something else', icon: 'MoreHorizontal', nextNodeId: 'gather-data-frequency' },
  ],
},
{
  id: 'gather-data-frequency',
  stage: 'GATHER',
  question: 'How often does new data come in?',
  description: 'This helps us understand how your data flows and whether AI should run continuously or on a schedule.',
  inputType: 'single_choice',
  options: [
    { id: 'continuous', label: 'All the time -- it\'s a constant stream', icon: 'Zap', nextNodeId: 'gather-data-expert' },
    { id: 'daily', label: 'Every day', icon: 'CalendarDays', nextNodeId: 'gather-data-expert' },
    { id: 'few_weekly', label: 'A few times a week', icon: 'CalendarRange', nextNodeId: 'gather-data-expert' },
    { id: 'monthly', label: 'Monthly or less', icon: 'Calendar', nextNodeId: 'gather-data-expert' },
    { id: 'not_sure', label: 'Not sure', icon: 'HelpCircle', nextNodeId: 'gather-data-expert' },
  ],
},
{
  id: 'gather-data-expert',
  stage: 'GATHER',
  question: 'Is there anyone on your team who really knows this data well?',
  description: 'It helps to know if there\'s a go-to person who understands the data\'s quirks and history.',
  inputType: 'single_choice',
  options: [
    { id: 'yes_me', label: 'Yes -- that\'s me', icon: 'User', nextNodeId: null },
    { id: 'yes_someone', label: 'Yes -- someone else on my team', icon: 'Users', nextNodeId: null },
    { id: 'sort_of', label: 'Sort of -- we all know bits and pieces', icon: 'UsersRound', nextNodeId: null },
    { id: 'no_one', label: 'Not really -- the knowledge is scattered', icon: 'HelpCircle', nextNodeId: null },
  ],
},
```

### 6.2 refine-tree.ts

**Modify existing node:**

1. `refine-confirm`: Change option `confirm-refine.nextNodeId` from `null` to `'refine-walkthrough'`

**Add new nodes:**

```typescript
{
  id: 'refine-walkthrough',
  stage: 'REFINE',
  question: 'Walk me through a typical example of how you do this today',
  description: 'Start from when you first get the request or task. What\'s step one? Then what?',
  inputType: 'free_text',
  placeholder: 'e.g., First I get an email with a spreadsheet attached. I open it in Excel, scan for errors, copy the data into our system...',
  maxLength: 1500,
  skippable: true,
  options: [], // free_text nodes have no options
},
{
  id: 'refine-result-audience',
  stage: 'REFINE',
  question: 'Who uses the result of this work?',
  description: 'This helps us understand who the AI output needs to serve.',
  inputType: 'multi_choice',
  options: [
    { id: 'my_team', label: 'My team', icon: 'Users', nextNodeId: 'refine-approval' },
    { id: 'other_depts', label: 'Other departments', icon: 'Building2', nextNodeId: 'refine-approval' },
    { id: 'students', label: 'Students', icon: 'GraduationCap', nextNodeId: 'refine-approval' },
    { id: 'leadership', label: 'Leadership', icon: 'Crown', nextNodeId: 'refine-approval' },
    { id: 'external', label: 'External partners', icon: 'Globe', nextNodeId: 'refine-approval' },
  ],
},
{
  id: 'refine-approval',
  stage: 'REFINE',
  question: 'Does anyone need to review or approve the result before it goes out?',
  description: 'Some outputs need a human check before they\'re shared. That\'s totally fine -- we just need to plan for it.',
  inputType: 'single_choice',
  options: [
    { id: 'always', label: 'Yes, always', icon: 'ShieldCheck', nextNodeId: null },
    { id: 'sometimes', label: 'Sometimes, depends on the situation', icon: 'Scale', nextNodeId: null },
    { id: 'never', label: 'No, I just send it', icon: 'Send', nextNodeId: null },
  ],
},
```

**Free text node handling:** The `refine-walkthrough` node uses `inputType: 'free_text'`. The wizard components need to handle this new type. When the user submits text (or skips), the engine advances to `refine-result-audience`. The free text answer is stored as `stageAnswers.REFINE['refine-walkthrough']`.

### 6.3 present-tree.ts

**Modify existing node:**

1. `present-confirm`: Change option `confirm-present.nextNodeId` from `null` to `'present-urgency'`

**Add new nodes:**

```typescript
{
  id: 'present-urgency',
  stage: 'PRESENT',
  question: 'How quickly do people need to see results?',
  description: 'This helps us decide whether the AI should work in real-time, on a schedule, or on demand.',
  inputType: 'single_choice',
  options: [
    { id: 'realtime', label: 'Right away -- as fast as possible', icon: 'Zap', nextNodeId: 'present-cross-dept' },
    { id: 'same_day', label: 'Same day is fine', icon: 'Clock', nextNodeId: 'present-cross-dept' },
    { id: 'within_week', label: 'Within a week', icon: 'CalendarDays', nextNodeId: 'present-cross-dept' },
    { id: 'whenever', label: 'Whenever it\'s ready', icon: 'Coffee', nextNodeId: 'present-cross-dept' },
  ],
},
{
  id: 'present-cross-dept',
  stage: 'PRESENT',
  question: 'Would other departments benefit from this too, or just yours?',
  description: 'If others could use this, it might change how we build and deploy it.',
  inputType: 'single_choice',
  options: [
    { id: 'just_us', label: 'Just us', icon: 'User', nextNodeId: null },
    { id: 'few_others', label: 'Maybe a few other groups', icon: 'Users', nextNodeId: null },
    { id: 'many_teams', label: 'Lots of teams could use this', icon: 'Building2', nextNodeId: null },
    { id: 'whole_campus', label: 'The whole campus', icon: 'Globe', nextNodeId: null },
  ],
},
```

---

## 7. Component Changes

### 7.1 New `inputType: 'free_text'` Support

The `QuestionCard` component in `src/components/wizard/QuestionCard.tsx` currently handles `single_choice`, `multi_choice`, and `confirmation`. It needs to also handle `free_text`.

When `node.inputType === 'free_text'`:
- Display the question + description as usual
- Render a `<textarea>` with the node's `placeholder` and `maxLength`
- Show a "Continue" button (disabled until text is non-empty OR `skippable` is true)
- If `node.skippable` is true, show a "Skip" link/button below the textarea
- On continue, call `onSelectOption(textValue)` with the textarea content
- On skip, call `onSelectOption('')` with empty string

The tree engine handles `free_text` nodes by looking at the first option's `nextNodeId` if options exist, or treating `nextNodeId` as a property on the node itself. Since `free_text` nodes have `options: []`, add a new optional field:

```typescript
export interface DecisionNode {
  // ... existing fields ...
  nextNodeId?: string | null; // For free_text nodes: where to go after text is submitted
}
```

For `refine-walkthrough`, set `nextNodeId: 'refine-result-audience'` directly on the node (not on an option).

### 7.2 DescribeIdeaForm Changes

The `DescribeIdeaForm` component needs these changes:

1. Add state variables for all new fields (Q-D1, Q-D2, Q-D3, Q-W1-W4, Q-C1-C3)
2. Read/write these from `conversationalAnswers` in the store
3. Add the new form sections (see Section 2A, 2B, 2C)
4. Add the savings callout display (see Section 4.1)
5. On submit, call `setConversationalAnswers(...)` with all new values alongside `setProjectIdea(...)`

### 7.3 Summary Page Changes

The summary page needs:

1. A "Before you submit" section with Q-M1 and Q-M2
2. Read/write these from `conversationalAnswers` in the store
3. The savings callout displayed in the user-facing summary
4. Call `computeAllDerivedValues(...)` for the export

### 7.4 Tree Engine Changes

The `useDecisionTree` hook in `src/hooks/use-decision-tree.ts` needs to handle the new `free_text` inputType:

- When a `free_text` node is reached, the wizard displays the textarea UI
- When the user submits text, `recordAnswer(stage, nodeId, textContent)` is called
- The engine then navigates to `node.nextNodeId` (the node-level field, not option-level)

---

## 8. Validation Rules

### Required Fields (must be filled to proceed past their screen)

| Field | Required? | Validation |
|---|---|---|
| Project Title | **Yes** (existing) | Non-empty, max 100 chars |
| Project Description | **Yes** (existing) | Non-empty, max 2000 chars |
| All decision tree questions | **Yes** -- user must select an option | Enforced by UI (button only appears after selection) |

### Optional Fields (can be left blank)

All new conversational questions (Q-D1 through Q-C3, Q-W1 through Q-W4, Q-M1, Q-M2) are optional. The user can leave them blank and still proceed. The rationale:

1. We want zero friction. Making questions required would feel like a government form.
2. The AI gap analysis (separate spec) will identify missing data and prompt users to fill gaps later.
3. Partial data is better than no submission at all.

### Conditional Logic

| Condition | Effect |
|---|---|
| Q-M1 = "other" | Show "Who are you submitting for?" text input |
| Q-C1 includes "other" | Show "What else?" text input |
| Q-W1 + Q-W2 + Q-W3 all answered | Show savings callout |
| Q-W1 OR Q-W2 OR Q-W3 unanswered | Hide savings callout |
| Protection level = P4 | Gather stage ends at `gather-p4-stop` (existing behavior, unchanged). New gather nodes Q-G1/G2/G3 are NOT reached because P4 stop has `nextNodeId: null` already. |

### Skippable Decision Tree Nodes

The `refine-walkthrough` free-text node is skippable. The user sees a "Skip" button. If skipped, an empty string is recorded and the wizard advances to `refine-result-audience`.

Multi-choice nodes (Q-G1, Q-R2) require at least one selection before the "Continue" button is enabled -- this is existing behavior in `QuestionCard`.

---

## 9. Savings Callout: Potential Savings Per Month Mapping

For the UCSD format field "Potential Savings per Month":

```typescript
function deriveSavingsPerMonth(frequency: string, duration: string, people: string): string {
  const monthlyOccurrences = FREQUENCY_MAP[frequency] ?? 0;
  const hoursPerOccurrence = DURATION_MAP[duration] ?? 0;
  const peopleMultiplier = PEOPLE_MAP[people] ?? 1;
  const monthlySavingsHours =
    monthlyOccurrences * hoursPerOccurrence * peopleMultiplier * AI_SAVINGS_PERCENTAGE;

  if (monthlySavingsHours < 1) return '<1 hour';
  if (monthlySavingsHours <= 200) return '1 - 200 hours';
  return '>200 hours';
}
```

---

## 10. Dependencies

### This spec depends on

- Nothing. This is the foundational data collection layer.

### What depends on this spec

| Spec | Why |
|---|---|
| **Two-Summary System** | Needs all collected answers + derived values to generate both user-facing and OSI-facing summaries |
| **AI Gap Analysis** | Analyzes completeness of data collected by this spec |
| **Claude Code Prompt Bundle** | Uses all collected data to generate the structured prompt output |
| **AI-Generated Narratives** | Takes the raw answers from this spec and composes Context/Challenge/Request paragraphs |

---

## 11. Acceptance Criteria

### Data Collection

- [ ] All 18 new questions render correctly in their designated positions
- [ ] Free text fields accept input up to their max length
- [ ] Single-select fields allow exactly one selection
- [ ] Multi-select fields allow multiple selections with a "Continue" button
- [ ] The "Other" option on Q-C1 shows a conditional text input when selected
- [ ] Q-M1 "On behalf of someone else" shows a conditional text input when selected
- [ ] The `refine-walkthrough` free-text node renders a textarea in the wizard and has a working "Skip" button

### Savings Calculation

- [ ] The savings callout appears when Q-W1, Q-W2, and Q-W3 are all answered
- [ ] The savings callout does NOT appear when any of Q-W1, Q-W2, Q-W3 is unanswered
- [ ] The savings number is correct: `frequency * duration * people` (using the mapping tables)
- [ ] Edge case: selecting "A few minutes" + "Just me" + "A few times a month" = 0.4 hours/month, displayed as "about 0 hours/month" or hidden (too small to show)
- [ ] Edge case: selecting "Half a day or more" + "A large group" + "Multiple times a day" = 3,600 hours/month, displayed correctly

### Decision Tree Flow

- [ ] After confirming P1/P2/P3, the wizard proceeds to Q-G1 (gather-daily-tools) instead of ending
- [ ] After Q-G3, the Gather stage completes and shows the GatherDetailForm
- [ ] After refine-confirm, the wizard proceeds to Q-R1 (refine-walkthrough) instead of ending
- [ ] After Q-R3, the Refine stage completes and shows the RefineDetailForm
- [ ] After present-confirm, the wizard proceeds to Q-P1 (present-urgency) instead of ending
- [ ] After Q-P2, the Present stage completes normally
- [ ] P4 flow is unaffected -- still ends at gather-p4-stop with no new questions

### Data Persistence

- [ ] All new answers are saved to the Zustand store under `conversationalAnswers`
- [ ] Decision tree answers for new nodes are saved to `stageAnswers` (existing mechanism)
- [ ] Refreshing the page preserves all answers (localStorage persistence)
- [ ] The store migration from v5 to v6 adds `conversationalAnswers` with defaults

### Derived Values

- [ ] `computeAllDerivedValues()` produces correct UCSD field values for all combinations
- [ ] Customer Size correctly maps Q-P2 answers: "just_us" -> "One department", "whole_campus" -> "Campus"
- [ ] Customer Need correctly scores: high urgency signals -> "High", no signals -> "Low"
- [ ] Complexity is auto-calculated and never asked to the user
- [ ] Alignment uses TritonGPT awareness + project goal to determine the right bucket
- [ ] Data Availability uses tools, frequency, and expert availability to determine the right bucket

### Export Integration

- [ ] `buildIntakeJson()` in `summary-formatter.ts` includes all new fields in its output
- [ ] The JSON export contains the full `conversationalAnswers` object
- [ ] Derived values are computed fresh at export time (not stale cached values)

### No Regressions

- [ ] Existing Describe form fields (title, description, domain, timeline, projectGoal, existingStatus, currentProcess, projectComplexity, preferredTool) continue to work
- [ ] Existing decision tree flow (data classification, AI task, data prep, audience, output format) is unchanged
- [ ] Existing GatherDetailForm, RefineDetailForm, and output selection continue to work
- [ ] Back button navigation works correctly through the new nodes
- [ ] The progress bar accurately reflects the new total question count per stage

---

## Appendix A: Question Flow Summary

### Complete user journey with new questions marked

```
Landing Page
  -> Email prompt (existing)

Describe Page (scrollable form)
  -> Project Title (existing, required)
  -> What do you want to build? (existing, required)
  -> Domain / Department (existing, optional)
  -> Timeline (existing, optional)
  -> What best describes your goal? (existing, optional)
  -> Have you already started? (existing, optional)
  -> How is this done today? (existing, optional)
  -> Who on your team does this work today? (NEW Q-D1)
  -> Why is now the right time? (NEW Q-D2)
  -> If this doesn't get built, what happens? (NEW Q-D3)
  -> [Workload Section]
     -> How often do you do this task? (NEW Q-W1)
     -> How long does it take each time? (NEW Q-W2)
     -> How many people spend time on this? (NEW Q-W3)
     -> What's the most annoying part? (NEW Q-W4)
     -> [Savings callout if W1+W2+W3 answered]
  -> [Context Section]
     -> What tools do you use for this right now? (NEW Q-C1)
     -> If you could wave a magic wand? (NEW Q-C2)
     -> What would 'great' look like in 6 months? (NEW Q-C3)
  -> How complex is this project? (existing, optional)
  -> Any specific tools in mind? (existing, optional)
  -> [Continue to Pipeline]

Pipeline Page (existing)

Gather Stage (wizard, one question at a time)
  -> Where does the data live? (existing, multi-select)
  -> [If "not sure": help classify] (existing)
  -> Confirm protection level (existing)
  -> What systems does your team use day-to-day? (NEW Q-G1, multi-select)
  -> How often does new data come in? (NEW Q-G2)
  -> Anyone who really knows this data? (NEW Q-G3)
  -> [GatherDetailForm: data type, source system, size, regulatory, notes] (existing)
  -> [Return to Pipeline]

Refine Stage (wizard)
  -> What do you want AI to do? (existing)
  -> How should data be prepared? (existing)
  -> Who will see the output? (existing)
  -> [If wide audience: warning] (existing)
  -> Confirm refinement plan (existing)
  -> Walk me through how you do this today (NEW Q-R1, free text)
  -> Who uses the result? (NEW Q-R2, multi-select)
  -> Does anyone need to approve? (NEW Q-R3)
  -> [RefineDetailForm: task details, additional context] (existing)
  -> [Return to Pipeline]

Present Stage (wizard)
  -> How do you want to see results? (existing)
  -> Feasibility check (existing)
  -> How quickly do people need results? (NEW Q-P1)
  -> Would other departments benefit? (NEW Q-P2)
  -> [Output selection detail] (existing)
  -> [Return to Pipeline]

Summary Page
  -> [Before you submit]
     -> Submitting for yourself or someone else? (NEW Q-M1)
     -> Have you heard of TritonGPT? (NEW Q-M2)
  -> [Summary display]
  -> [Export/Submit]
```

### Question count by stage

| Stage | Existing Questions | New Questions | Total |
|---|---|---|---|
| Describe (form) | 9 fields | 10 fields (Q-D1-D3, Q-W1-W4, Q-C1-C3) | 19 fields |
| Gather (wizard) | 2-3 nodes | 3 nodes (Q-G1-G3) | 5-6 nodes |
| Gather (detail form) | 5 fields | 0 | 5 fields |
| Refine (wizard) | 4-5 nodes | 3 nodes (Q-R1-R3) | 7-8 nodes |
| Refine (detail form) | 3 fields | 0 | 3 fields |
| Present (wizard) | 2 nodes | 2 nodes (Q-P1-P2) | 4 nodes |
| Summary (metadata) | 0 | 2 fields (Q-M1, Q-M2) | 2 fields |

---

## Appendix B: File Change Checklist

| File | Change |
|---|---|
| `src/types/decision-tree.ts` | Add `ConversationalAnswers`, `DerivedIntakeValues` interfaces. Add `'free_text'` to `DecisionNode.inputType`. Add optional `placeholder`, `maxLength`, `skippable`, `nextNodeId` fields to `DecisionNode`. |
| `src/data/gather-tree.ts` | Modify 3 confirm nodes' `nextNodeId`. Add 3 new nodes. |
| `src/data/refine-tree.ts` | Modify `refine-confirm` `nextNodeId`. Add 3 new nodes. |
| `src/data/present-tree.ts` | Modify `present-confirm` `nextNodeId`. Add 2 new nodes. |
| `src/store/session-store.ts` | Add `conversationalAnswers` state + actions. Bump version to 6. Add migration. |
| `src/components/wizard/QuestionCard.tsx` | Handle `inputType === 'free_text'`: render textarea + skip button. |
| `src/hooks/use-decision-tree.ts` | Handle `free_text` node navigation (use `node.nextNodeId` instead of `option.nextNodeId`). |
| `src/components/describe/DescribeIdeaForm.tsx` | Add 10 new form fields, workload section, context section, savings callout. |
| `src/lib/intake-calculations.ts` | **New file.** All calculation functions from Section 4. |
| `src/lib/summary-formatter.ts` | Update `buildIntakeJson()` to include `conversationalAnswers` and `derivedValues`. |
| `src/pages/Summary.tsx` (or equivalent) | Add metadata questions (Q-M1, Q-M2) before submit. |
