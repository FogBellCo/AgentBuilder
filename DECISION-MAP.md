# UCSD AgentBuilder — Complete Decision Map

## Purpose & How to Use This Document

This document maps **every screen, question, option, and form field** a user encounters in the UCSD AgentBuilder wizard — a guided intake tool that helps non-technical UCSD staff plan AI workflows while respecting UC data classification policy (P1–P4).

**Use this document to validate past submissions:** Take any previous intake submission and walk it through this tree step by step. If the submission contains information that no question in this tree captures, the tree has a gap. If a question in this tree captures information the submission doesn't contain, that's expected (optional fields exist).

**How the tool works:** Users go through a linear flow of screens:
1. **Landing** → 2. **Describe** (free-form intake) → 3. **Pipeline** (stage overview) → 4. **Gather** (data classification wizard + detail form) → 5. **Refine** (AI task wizard + detail form) → 6. **Present** (output format picker + feasibility check) → 7. **Summary** (review + export)

Each of stages 4–6 has TWO parts: a **wizard** (structured decision-tree questions) followed by a **detail form** (additional free-form fields). Both parts must be completed to finish the stage.

---

## Screen 1: Landing Page (`/`)

**What the user sees:**

> **Let's Build Your AI Workflow**
>
> Got an idea for using AI at UCSD? Walk through a few quick questions...
>
> No technical background needed — you'll walk away with a clear plan and a summary you can share with your team.

A 4-step visual preview: **Describe → Gather → Refine → Present**

One button: **"Get Started"** → navigates to `/describe`

Footer disclaimer: *"This tool helps you plan — it doesn't access, store, or process your actual data. All recommendations follow UC data classification policy."*

**Data captured:** None.

---

## Screen 2: Describe Your Idea (`/describe`)

**What the user sees:** A form with 4 fields.

| # | Field Label | Type | Required | Validation | Placeholder / Options |
|---|------------|------|----------|------------|----------------------|
| 1 | **Project Title** | Text input | Yes | Max 100 characters | *"e.g., Student feedback analyzer, Research data dashboard"* |
| 2 | **What do you want to build?** | Textarea | Yes | Max 1,000 characters | *"In a few sentences, describe what you want to accomplish with AI. For example: 'I want to analyze student course evaluations...'"* |
| 3 | **Domain / Department** | Dropdown | No | Single selection | **"Research"**, **"Student Services"**, **"Finance"**, **"IT"**, **"Administration"**, **"Academic"**, **"Other"** |
| 4 | **Timeline** | Toggle buttons | No | Single selection | **"Just exploring"**, **"This quarter"**, **"This month"**, **"Immediate need"** |

The **"Continue"** button is disabled until both Title and Description are filled in.

**Data captured (stored as `projectIdea`):**
```
{
  title: string,
  description: string,
  domain: string | "",       // optional
  timeline: string | ""      // optional
}
```

---

## Screen 3: Pipeline Overview (`/pipeline`)

**What the user sees:** A visual pipeline of three stage nodes, each with a status indicator:

| Stage | Label | Status Options |
|-------|-------|---------------|
| GATHER | "Gather" | Not Started → In Progress → Complete |
| REFINE | "Refine" | Not Started → In Progress → Complete |
| PRESENT | "Present" | Not Started → In Progress → Complete |

Users click a stage node to enter that stage's wizard. Stages must be completed in order (GATHER → REFINE → PRESENT).

**Transition messages appear after stage completion:**
- After GATHER: *"You've identified your data and its access level — nice work! Next, tell us what you want AI to do with it."*
- After REFINE: *"Almost there! You've defined the AI tasks. Now choose how you want to see the results."*

When all three stages are complete, a **"View Complete Summary"** button appears.

**Data captured:** None (navigation only).

---

## Screen 4: GATHER Stage — Wizard (`/stage/gather`)

The GATHER wizard determines the UC protection level of the user's data. It's a short decision tree with 6 possible nodes. Users only see 2–3 nodes per path.

### GATHER Question 1: `gather-start` (ALWAYS shown first)

> **"Where does the data you want to work with live?"**
>
> *Select all that apply — your data might live in more than one place.*

**Input type: MULTI-SELECT** (user can pick one or more options)

| # | Option | Subtext shown to user | Protection Level |
|---|--------|----------------------|-----------------|
| A | **Public website or open data** | *"Anyone can access it without logging in"* | P1 |
| B | **UCSD internal system** | *"You use your UCSD SSO login to access it"* | P2 |
| C | **Restricted system with special access** | *"Requires an API key, VPN, or special permission"* | P3 |
| D | **Sensitive personal data** | *"Contains Social Security numbers, medical records, or financial data"* | P4 |
| E | **I'm not sure** | *"That's okay — we'll help you figure it out"* | — |

**Routing logic:**
- If user selects **only one option** → routes to that level's confirmation node
- If user selects **multiple options** → the **most restrictive level wins** (P4 > P3 > P2 > P1) and routes to that level's confirmation
- If user selects **"I'm not sure"** → routes to the help classifier

| User Selection | Resulting Level | Next Screen |
|---------------|----------------|-------------|
| A only | P1 | → Confirmation: P1 |
| B only | P2 | → Confirmation: P2 |
| C only | P3 | → Confirmation: P3 |
| D only | P4 | → P4 Stop |
| A + B | P2 | → Confirmation: P2 |
| A + C | P3 | → Confirmation: P3 |
| B + C | P3 | → Confirmation: P3 |
| A + B + C | P3 | → Confirmation: P3 |
| Any combo including D | P4 | → P4 Stop |
| E only | — | → Help Classifier |

A **"Continue"** button appears once at least one option is selected (since this is multi-select).

---

### GATHER Question 1b: `gather-help-classify` (ONLY shown if user picked "I'm not sure")

> **"Let's narrow it down. Do you need to log in to access this data?"**
>
> *This will help us determine the right access level for your data.*

**Input type: SINGLE-SELECT** (click one option, immediately advances)

| # | Option | Subtext shown to user | Protection Level | Next Screen |
|---|--------|----------------------|-----------------|-------------|
| A | **No — anyone can see it** | *"It's on a public website or open database"* | P1 | → Confirmation: P1 |
| B | **Yes — I use my UCSD username and password** | *"Standard UCSD Single Sign-On"* | P2 | → Confirmation: P2 |
| C | **Yes — and I need something extra beyond my UCSD login** | *"Like an API key, special software, or VPN"* | P3 | → Confirmation: P3 |
| D | **I think it may contain very sensitive personal information** | *"SSNs, medical records, credit card numbers, etc."* | P4 | → P4 Stop |

---

### GATHER Confirmation: P1 — `gather-confirm-p1`

> **"Your data is Public (P1) — openly available to anyone."**
>
> *AI tools can freely work with this data. No special permissions are needed.*

| # | Button | Action |
|---|--------|--------|
| 1 | **That sounds right — continue** | → Wizard complete. Shows classification result, then detail form. |
| 2 | **Actually, let me reconsider** | → Back to Question 1 (`gather-start`) |

---

### GATHER Confirmation: P2 — `gather-confirm-p2`

> **"Your data is Internal (P2) — accessible with UCSD SSO login."**
>
> *AI tools can work with this data through authenticated channels. You will need your UCSD login.*

| # | Button | Action |
|---|--------|--------|
| 1 | **That sounds right — continue** | → Wizard complete. Shows classification result, then detail form. |
| 2 | **Actually, let me reconsider** | → Back to Question 1 (`gather-start`) |

---

### GATHER Confirmation: P3 — `gather-confirm-p3`

> **"Your data is Confidential (P3) — requires special authorization."**
>
> *AI tools can work with this data, but you will need an API key or explicit data steward approval.*

| # | Button | Action |
|---|--------|--------|
| 1 | **That sounds right — continue** | → Wizard complete. Shows classification result, then detail form. |
| 2 | **Actually, let me reconsider** | → Back to Question 1 (`gather-start`) |

---

### GATHER Stop: P4 — `gather-p4-stop`

> **"This data is Restricted (P4) — AI tools cannot be used with it at this time."**
>
> *This classification exists to protect individuals and the university. This is not a dead end — there may be alternatives.*

| # | Button | Action |
|---|--------|--------|
| 1 | **I understand — show me alternatives** | → Wizard complete. User is routed to P4 guidance page. **AI workflow cannot proceed to REFINE or PRESENT.** |
| 2 | **Let me re-evaluate my data** *(subtext: "Maybe I can use a non-restricted subset")* | → Back to Question 1 (`gather-start`) |

---

### GATHER: Classification Result Screen

After confirming a protection level, the user sees a result card showing:
- Protection level badge with color (P1=blue, P2=teal, P3=orange, P4=red)
- Level name and tagline
- Description of what the level means
- "What you'll need" requirements
- Buttons: **"Continue"** (to detail form), **"Learn More"** (opens guidance page), **"Go Back"**

---

### GATHER: Detail Form (shown after wizard completion)

After the wizard, users fill in additional details about their data:

| # | Field Label | Type | Required | Options / Placeholder |
|---|------------|------|----------|----------------------|
| 1 | **Data Type** | Multi-select toggle buttons | No | **"Spreadsheet/CSV"**, **"Database/SQL"**, **"Documents/PDFs"**, **"API/Web Service"**, **"Images/Media"**, **"Other"** |
| 2 | **Source System** | Text input | No | *"e.g., TritonLink, ServiceNow, Canvas, Banner"* |
| 3 | **Approximate Data Size** | Single-select toggle buttons | No | **"Small (under 1,000 rows)"**, **"Medium (1,000–100,000 rows)"**, **"Large (100,000+ rows)"**, **"Not sure"** |
| 4 | **Additional Notes** | Textarea | No | Max 500 characters. *"Anything else about your data source..."* |

The form also displays all data sources selected during the wizard as badges showing their protection levels.

**Data captured (stored as `gatherDetails`):**
```
{
  dataType: string[],         // e.g. ["Spreadsheet/CSV", "Database/SQL"]
  sourceSystem: string,       // e.g. "Canvas"
  dataSize: string,           // e.g. "Medium (1,000–100,000 rows)"
  additionalNotes: string     // free text
}
```

Completing this form marks the GATHER stage as **complete**. User returns to the Pipeline.

---

## Screen 5: REFINE Stage — Wizard (`/stage/refine`)

The REFINE wizard captures what the user wants AI to do, how to prepare the data, and who will see the output. It's a linear flow of 3 questions (with an optional warning screen).

### REFINE Question 1: `refine-task`

> **"What do you want AI to do with your data?"**
>
> *Choose the primary task. You can combine tasks later.*

**Input type: SINGLE-SELECT** (click one, immediately advances)

| # | Option | Subtext shown to user |
|---|--------|----------------------|
| A | **Summarize or extract key points** | *"Get concise summaries from large amounts of information"* |
| B | **Analyze trends and patterns** | *"Discover insights, correlations, or anomalies"* |
| C | **Compare data sets** | *"Find differences, similarities, or changes over time"* |
| D | **Generate recommendations** | *"Get AI-powered suggestions based on your data"* |
| E | **Classify or categorize** | *"Sort items into groups, tag content, or label data"* |

All options → next question (Question 2).

---

### REFINE Question 2: `refine-transform`

> **"How should the data be prepared before AI processes it?"**
>
> *Think about whether the data needs any cleaning or filtering first.*

**Input type: SINGLE-SELECT**

| # | Option | Subtext shown to user |
|---|--------|----------------------|
| A | **Use it as-is** | *"The data is ready — no preparation needed"* |
| B | **Filter to a specific subset** | *"Only use part of the data (e.g., last quarter, one department)"* |
| C | **Combine multiple data sources** | *"Merge information from different places"* |
| D | **Clean or de-identify sensitive fields** | *"Remove or mask personal identifiers before processing"* |

All options → next question (Question 3).

---

### REFINE Question 3: `refine-audience`

> **"Who will see the AI output?"**
>
> *The intended audience affects what the AI can produce and how it should be delivered.*

**Input type: SINGLE-SELECT**

| # | Option | Subtext shown to user | Next Screen |
|---|--------|----------------------|-------------|
| A | **Just me** | *"I'm the only one who will see the results"* | → Confirmation |
| B | **My team or department** | *"Shared within a group that has similar access"* | → Confirmation |
| C | **Campus-wide** | *"Available to anyone at UCSD"* | → Audience Warning |
| D | **Public or external audience** | *"Will be shared outside of UCSD"* | → Audience Warning |

---

### REFINE Question 3b: `refine-audience-warning` (ONLY shown if user picked Campus-wide or Public)

> **"Heads up: sharing with a wider audience may change your data requirements."**
>
> *If your original data is Internal (P2) or higher, the AI output may still carry those restrictions. The output might need to be de-identified or access-controlled.*

| # | Button | Action |
|---|--------|--------|
| 1 | **I understand — continue** | → Confirmation |
| 2 | **Let me narrow my audience** | → Back to Question 3 (`refine-audience`) |

---

### REFINE Confirmation: `refine-confirm`

> **"Great — let's add some detail to your refinement plan."**
>
> *You've outlined the AI tasks, data preparation, and audience. Next, you can fine-tune each task with specific instructions.*

| # | Button | Action |
|---|--------|--------|
| 1 | **Continue to add details** | → Wizard complete. Shows detail form. |
| 2 | **Let me change my answers** | → Back to Question 1 (`refine-task`) |

---

### REFINE: Detail Form (shown after wizard completion)

Users can define **one or more refinement tasks** (add/remove dynamically). Each refinement has:

| # | Field Label | Type | Required | Options / Placeholder |
|---|------------|------|----------|----------------------|
| 1 | **AI Task** | Dropdown | Yes | **"Summarize or extract key points"**, **"Analyze trends and patterns"**, **"Compare data sets"**, **"Generate recommendations"**, **"Classify or categorize"** |
| 2 | **What specifically should AI do?** | Text input | No | *"e.g., Summarize student feedback by theme for each quarter"* |
| 3 | **Data Preparation** | Single-select toggle buttons | Yes | **"Use as-is"**, **"Filter to a subset"**, **"Combine sources"**, **"De-identify"** |

An **"+ Add Another Refinement"** button allows users to add more tasks. Each additional refinement appears as a numbered card and can be removed (if more than 1 exists).

Below the refinements there is also:

| # | Field Label | Type | Required | Placeholder |
|---|------------|------|----------|-------------|
| — | **Additional Context** | Textarea | No | Max 500 characters |

**Data captured (stored as `refineDetails`):**
```
{
  refinements: [
    {
      id: string,
      taskType: "summarize" | "analyze" | "compare" | "recommend" | "classify",
      description: string,
      dataPrep: "as-is" | "filter" | "combine" | "deidentify"
    },
    // ... additional refinements
  ],
  additionalContext: string
}
```

Completing this form marks the REFINE stage as **complete**. User returns to the Pipeline.

---

## Screen 6: PRESENT Stage — Output Picker (`/stage/present`)

The PRESENT stage does NOT use the same wizard format. Instead, it uses a **card-based output picker** where users select one or more output formats from a grid.

### PRESENT: Output Format Selection

> **"How do you want to see the results?"**
>
> *Choose the format that best fits how you and your audience will use the AI output.*

**Input type: MULTI-SELECT CARD GRID** (user picks one or more format cards)

| # | Format | Description shown to user | Internal Key |
|---|--------|--------------------------|-------------|
| 1 | **AI Chat Assistant** | *"Have a conversation with an AI that knows your data"* | `chat` |
| 2 | **Visual Dashboard** | *"Charts, graphs, and live metrics"* | `dashboard` |
| 3 | **Report or Document** | *"A polished report you can share or archive"* | `static_report` |
| 4 | **Interactive Explorer** | *"A filterable, searchable tool for your team"* | `interactive_app` |
| 5 | **Email Summary** | *"Automated AI-generated email digests on a schedule"* | `email_digest` |
| 6 | **Presentation Slides** | *"Auto-generated slides for meetings"* | `slide_deck` |
| 7 | **Smart Alerts** | *"Notifications when AI detects anomalies or thresholds"* | `smart_alerts` |
| 8 | **Team Knowledge Base** | *"AI-organized, searchable knowledge base"* | `knowledge_base` |
| 9 | **API Feed** | *(available in tree but may not surface in primary UI)* | `api_feed` |

For each selected format, users can optionally type a **description** of how they'd use it.

A **"Continue with X format(s)"** button appears once at least one format is selected.

---

### PRESENT: Feasibility Check

After selecting format(s), the system checks each against the user's protection level from GATHER.

**Three possible outcomes per format:**

| Status | Icon | Meaning |
|--------|------|---------|
| **Allowed** | Green checkmark | This format works freely with your data level. |
| **Allowed with Conditions** | Orange warning | This format works, but you'll need to meet specific requirements (shown to user). |
| **Not Allowed** | Red X | This format cannot be used with your data level. An alternative is suggested (if available). |

The user sees all their selected formats with feasibility status. If some are blocked, a warning message is shown. They can:
- **"See My Summary"** → proceed to summary (if at least one format is allowed/conditional)
- **"Change Selections"** / **"Choose a Different Format"** → go back to format picker

---

### PRESENT: Feasibility Matrix (complete reference)

This table shows exactly what the user will be told for every combination of format + protection level.

#### P1 — Public Data

| Format | Result | Conditions |
|--------|--------|-----------|
| AI Chat Assistant | **Allowed** | — |
| Visual Dashboard | **Allowed** | — |
| Report or Document | **Allowed** | — |
| Interactive Explorer | **Allowed** | — |
| Email Summary | **Allowed** | — |
| Presentation Slides | **Allowed** | — |
| API Feed | **Allowed** | — |
| Smart Alerts | **Allowed** | — |
| Team Knowledge Base | **Allowed** | — |

#### P2 — Internal (UCSD SSO)

| Format | Result | Conditions shown to user |
|--------|--------|--------------------------|
| AI Chat Assistant | **Conditional** | *"Requires SSO-authenticated chat session"* |
| Visual Dashboard | **Conditional** | *"Dashboard must be hosted behind UCSD SSO"* |
| Report or Document | **Conditional** | *"Report must be shared only within UCSD authenticated channels"* |
| Interactive Explorer | **Conditional** | *"Application must require UCSD SSO login"* |
| Email Summary | **Conditional** | *"Must be sent to UCSD email addresses only"* |
| Presentation Slides | **Conditional** | *"Slides should be shared within UCSD only"* |
| API Feed | **Conditional** | *"API must require SSO token authentication"* |
| Smart Alerts | **Conditional** | *"Alerts should not contain raw data — summaries only"* |
| Team Knowledge Base | **Conditional** | *"Knowledge base must be behind UCSD SSO"* |

#### P3 — Confidential (API Key / Special Access)

| Format | Result | Conditions shown to user | Alternative suggested |
|--------|--------|--------------------------|---------------------|
| AI Chat Assistant | **Conditional** | *"Must use UCSD-approved AI platform with API key authorization"* | — |
| Visual Dashboard | **Conditional** | *"Requires encrypted connection and audit logging"* | — |
| Report or Document | **Conditional** | *"Report must be encrypted and access-controlled"* | — |
| Interactive Explorer | **Conditional** | *"Requires API key authentication and data access audit trail"* | — |
| Email Summary | **Not Allowed** | *"Email is not a secure channel for confidential data"* | Visual Dashboard |
| Presentation Slides | **Conditional** | *"Slides must be encrypted and audience restricted"* | — |
| API Feed | **Conditional** | *"API must use encrypted transport and API key validation"* | — |
| Smart Alerts | **Conditional** | *"Alerts must be delivered through secure, authenticated channels"* | — |
| Team Knowledge Base | **Conditional** | *"Requires access controls and audit logging"* | — |

#### P4 — Restricted (AI Prohibited)

| Format | Result | Alternative suggested |
|--------|--------|---------------------|
| AI Chat Assistant | **Not Allowed** | Report or Document |
| Visual Dashboard | **Not Allowed** | Report or Document |
| Report or Document | **Not Allowed** | *(none)* |
| Interactive Explorer | **Not Allowed** | Visual Dashboard |
| Email Summary | **Not Allowed** | Report or Document |
| Presentation Slides | **Not Allowed** | Report or Document |
| API Feed | **Not Allowed** | *(none)* |
| Smart Alerts | **Not Allowed** | Visual Dashboard |
| Team Knowledge Base | **Not Allowed** | Report or Document |

**Note:** P4 users would not normally reach the PRESENT stage — they are stopped at GATHER with guidance. This matrix exists as a safeguard.

**Data captured (stored as `presentDetails`):**
```
{
  outputs: [
    {
      format: "chat" | "dashboard" | "static_report" | "interactive_app" | "email_digest" | "slide_deck" | "api_feed" | "smart_alerts" | "knowledge_base",
      description: string,          // user-provided description of how they'll use it
      feasibility: {
        feasibility: "allowed" | "allowed_with_conditions" | "not_allowed",
        conditions?: string,
        alternativeSuggestion?: string
      }
    },
    // ... additional formats if multi-selected
  ]
}
```

Completing this marks the PRESENT stage as **complete**. User returns to Pipeline, then proceeds to Summary.

---

## Screen 7: Summary Page (`/summary`)

Shows the complete intake in a reviewable format. The user sees:

### 1. Header
- Title: **"Your AI Workflow Summary"** (if all stages complete) or **"Progress So Far"** (if incomplete)

### 2. TritonAI Outreach Message (only when all stages complete)
> **"Thank you for completing your intake!"**
>
> *A member of the TritonAI team will reach out to you with next steps based on your responses. You'll receive a detailed email with recommendations tailored to your workflow.*

### 3. Project Idea Card
Displays the data from the `/describe` form:
- Project title (large, bold)
- Project description (full text)
- Domain badge (if provided)
- Timeline badge (if provided)

### 4. Stage Summary Cards
One card per completed stage, each showing:

**GATHER card:**
- Protection level badge (P1/P2/P3/P4 with color)
- All selected data sources from wizard (as badges with level)
- Data types selected in detail form
- Source system name
- Data size category
- Additional notes

**REFINE card:**
- Numbered list of refinement tasks, each showing:
  - AI task type
  - Description of what AI should do
  - Data preparation approach
- Additional context (if provided)

**PRESENT card:**
- List of selected output formats, each showing:
  - Format name
  - Feasibility status icon (green/orange/red)
  - User's description of how they'll use it (if provided)
  - Conditions (if applicable)

### 5. Action Buttons
| Button | Action |
|--------|--------|
| **Download JSON** | Exports the full intake payload as a JSON file |
| **Share via Email** | Opens email client with summary |
| **Copy to Clipboard** | Copies summary text (shows "Copied!" for 2 seconds) |

---

## Complete Data Model — What Gets Stored Per Submission

This is the full shape of a completed submission. Use this to compare against past submissions.

```
{
  sessionId: "uuid",

  projectIdea: {
    title: string,                    // Required, max 100 chars
    description: string,              // Required, max 1000 chars
    domain: string,                   // Optional: "Research" | "Student Services" | "Finance" | "IT" | "Administration" | "Academic" | "Other"
    timeline: string                  // Optional: "Just exploring" | "This quarter" | "This month" | "Immediate need"
  },

  protectionLevel: "P1" | "P2" | "P3" | "P4",

  gatherAnswers: {
    "gather-start": "public-web,ucsd-internal",    // comma-separated if multi-select
    "gather-confirm-p2": "confirm-p2"              // whichever confirmation was shown
  },

  gatherDetails: {
    dataType: ["Spreadsheet/CSV", "Database/SQL"],  // 0+ from: "Spreadsheet/CSV", "Database/SQL", "Documents/PDFs", "API/Web Service", "Images/Media", "Other"
    sourceSystem: "Canvas",                          // free text, optional
    dataSize: "Medium (1,000–100,000 rows)",         // optional: "Small (under 1,000 rows)" | "Medium (1,000–100,000 rows)" | "Large (100,000+ rows)" | "Not sure"
    additionalNotes: "..."                           // free text, optional, max 500 chars
  },

  refineAnswers: {
    "refine-task": "summarize",                      // one of: summarize, analyze, compare, recommend, classify
    "refine-transform": "filter",                    // one of: as-is, filter, combine, deidentify
    "refine-audience": "my-team"                     // one of: just-me, my-team, campus-wide, public-external
  },

  refineDetails: {
    refinements: [
      {
        id: "uuid",
        taskType: "summarize",                       // one of: summarize, analyze, compare, recommend, classify
        description: "Summarize student feedback by theme for each quarter",
        dataPrep: "filter"                           // one of: as-is, filter, combine, deidentify
      }
    ],
    additionalContext: "..."                          // free text, optional, max 500 chars
  },

  presentDetails: {
    outputs: [
      {
        format: "dashboard",                         // one of the 9 format keys
        description: "Live metrics for department heads",
        feasibility: {
          feasibility: "allowed_with_conditions",
          conditions: "Dashboard must be hosted behind UCSD SSO"
        }
      }
    ]
  }
}
```

---

## Validation Checklist — Comparing Past Submissions

When walking a past submission through this tree, check each row:

| # | Information | Where it's captured | Question to ask |
|---|------------|--------------------|----|
| 1 | What is the project about? | Describe: title + description | Does the tree capture the project's purpose? |
| 2 | What department/domain? | Describe: domain dropdown | Is their department represented in the 7 options? |
| 3 | How urgent is this? | Describe: timeline toggle | Is their urgency captured by the 4 timeline options? |
| 4 | Where does the data live? | GATHER Q1: data source multi-select | Does the submission's data source fit into one of the 5 options? |
| 5 | What protection level? | GATHER: classification result | Was the correct protection level assigned? |
| 6 | What type of data files? | GATHER detail: data type multi-select | Is their data format covered by the 6 type options? |
| 7 | What system is the data in? | GATHER detail: source system text field | Was this captured? |
| 8 | How much data? | GATHER detail: data size | Does the 4-option scale capture the volume? |
| 9 | What should AI do? | REFINE Q1: AI task selection | Does the submission's use case fit one of the 5 task types? |
| 10 | Does data need prep? | REFINE Q2: data preparation | Is their data prep need covered by the 4 options? |
| 11 | Who sees the output? | REFINE Q3: audience selection | Is their audience represented in the 4 options? |
| 12 | Detailed task descriptions? | REFINE detail: refinements (repeatable) | Did the detail form capture all the nuances of what they want? |
| 13 | What output format? | PRESENT: format picker | Is their desired output format one of the 9 options? |
| 14 | Is the format feasible? | PRESENT: feasibility check | Does the matrix correctly allow/block for their level? |

**If a past submission contains information that NO question captures → that's a gap in the tree.**

---

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                              │
│                    "Let's Build Your AI Workflow"                 │
│                       [Get Started]                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DESCRIBE YOUR IDEA                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Project Title*          [___________________________]   │     │
│  │ What do you want to     [___________________________]   │     │
│  │   build?*               [___________________________]   │     │
│  │ Domain / Department     [▼ Select one              ]    │     │
│  │ Timeline                [Just exploring] [This quarter] │     │
│  │                         [This month] [Immediate need]   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                       [Continue]                                 │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PIPELINE OVERVIEW                              │
│           ┌─────────┐   ┌─────────┐   ┌─────────┐               │
│           │ GATHER  │──▶│ REFINE  │──▶│ PRESENT │               │
│           └────┬────┘   └────┬────┘   └────┬────┘               │
└────────────────┼─────────────┼─────────────┼────────────────────┘
                 │             │             │
    ┌────────────▼──┐  ┌──────▼───────┐  ┌──▼──────────────┐
    │   GATHER      │  │    REFINE     │  │    PRESENT      │
    │   WIZARD      │  │    WIZARD     │  │   OUTPUT PICKER │
    │               │  │               │  │                 │
    │ Q1: Data      │  │ Q1: AI Task   │  │ Select 1+       │
    │   source      │  │ Q2: Data prep │  │  format cards   │
    │   (multi)     │  │ Q3: Audience  │  │                 │
    │ Q1b: Help     │  │ Q3b: Warning  │  │ Feasibility     │
    │   (if unsure) │  │   (if wide)   │  │  check          │
    │ Confirm level │  │ Confirm       │  │                 │
    ├───────────────┤  ├───────────────┤  ├─────────────────┤
    │ GATHER        │  │ REFINE        │  │                 │
    │ DETAIL FORM   │  │ DETAIL FORM   │  │                 │
    │               │  │               │  │                 │
    │ • Data type   │  │ • Refinements │  │                 │
    │   (multi)     │  │   (1 or more) │  │                 │
    │ • Source sys   │  │   - task type │  │                 │
    │ • Data size   │  │   - descript. │  │                 │
    │ • Notes       │  │   - data prep │  │                 │
    │               │  │ • Context     │  │                 │
    └───────┬───────┘  └──────┬────────┘  └────────┬────────┘
            │                 │                     │
            └─────────────────┴─────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUMMARY PAGE                              │
│                                                                  │
│  ┌─TritonAI Outreach Message────────────────────────────────┐   │
│  │ "A member of the TritonAI team will reach out..."        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─ Project Idea ───────────────────────────────────────────┐   │
│  │ Title, Description, Domain, Timeline                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─ GATHER Summary ────────────────────────────────────────┐    │
│  │ Protection Level, Data Sources, Types, System, Size     │    │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─ REFINE Summary ────────────────────────────────────────┐    │
│  │ Refinement tasks (numbered), Additional context          │    │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─ PRESENT Summary ───────────────────────────────────────┐    │
│  │ Output formats with feasibility status                   │    │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Download JSON]  [Share via Email]  [Copy to Clipboard]        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Example Walkthrough: Complete Submission

Here is one complete path a user could take, showing every screen and selection:

1. **Landing** → Click "Get Started"
2. **Describe** → Title: "Course Evaluation Analyzer", Description: "I want to summarize student course evaluations to identify common themes and trends across departments each quarter", Domain: "Academic", Timeline: "This quarter" → Click "Continue"
3. **Pipeline** → Click "GATHER"
4. **GATHER Q1** → Select "UCSD internal system" → Click "Continue"
5. **GATHER Confirm P2** → "Your data is Internal (P2)..." → Click "That sounds right — continue"
6. **GATHER Classification Result** → Shows P2 badge → Click "Continue"
7. **GATHER Detail Form** → Data Type: "Spreadsheet/CSV" + "Documents/PDFs", Source System: "Canvas", Data Size: "Medium (1,000–100,000 rows)", Notes: "Exported from Canvas course evaluation reports" → Click "Complete"
8. **Pipeline** → GATHER shows green check → Click "REFINE"
9. **REFINE Q1** → Click "Summarize or extract key points"
10. **REFINE Q2** → Click "Filter to a specific subset"
11. **REFINE Q3** → Click "My team or department"
12. **REFINE Confirm** → Click "Continue to add details"
13. **REFINE Detail Form** → Refinement 1: Task="Summarize or extract key points", Description="Identify recurring themes in student feedback per course per quarter", Prep="Filter to a subset" → Add Refinement 2: Task="Analyze trends and patterns", Description="Track sentiment changes over 3 years", Prep="Combine sources" → Context: "Focus on STEM departments first" → Click "Complete"
14. **Pipeline** → REFINE shows green check → Click "PRESENT"
15. **PRESENT Format Picker** → Select "Visual Dashboard" + "Report or Document" → Click "Continue with 2 formats"
16. **PRESENT Feasibility Check** → Dashboard: Conditional ("Dashboard must be hosted behind UCSD SSO"), Report: Conditional ("Report must be shared only within UCSD authenticated channels") → Click "See My Summary"
17. **Summary** → Full summary displayed with all data above → Click "Download JSON"
