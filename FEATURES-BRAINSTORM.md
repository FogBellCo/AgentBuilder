# AgentBuilder Feature Brainstorm

> **Goal:** Make the tool collect enough information from non-technical UCSD users that OSI doesn't need follow-up meetings, the output maps to the UCSD intake format, and the data is rich enough to hand to Claude Code for building.

> **Core Design Principle:** Users never see the UCSD intake format. They never encounter terms like "desirability," "viability," "feasibility," "process overview," or any internal OSI terminology — not in the questions, not in the summary, not anywhere. The tool asks natural, short, friendly questions — like a helpful colleague would — and the system maps their answers to the UCSD format behind the scenes. There are **two separate summaries**: the user sees a warm, plain-English recap ("Here's what you told us"); OSI sees the structured UCSD intake document. Same data, two views.

---

## 1. Conversational Data Collection (High Priority)

The UCSD intake format requires specific fields (Process Overview, Desirability, Viability, Feasibility, Context/Challenge/Request, Savings, Metadata). Users should never know these categories exist. Instead, the tool asks simple questions woven naturally into the existing wizard flow, and the system assembles the answers into the right format on export.

### Design Philosophy
- Every question should feel like something a friendly coworker would ask over coffee
- No jargon, no business-speak, no form-field labels from the intake template
- One short question at a time, Typeform-style
- Show examples and "why we're asking" hints to reduce friction
- If a question feels intimidating, it needs to be broken into smaller pieces or rephrased

### 1a. "Tell me about your team" (maps to → Desirability)

Users never see the word "desirability." Instead, natural questions:

| What the user sees | What it maps to |
|---|---|
| **"Who on your team does this work today?"** (free text, e.g., "2 analysts in our office") | Customer Size + Context |
| **"Would other departments benefit from this too, or is it just your team?"** → Just my team / A few other groups might use it / Lots of departments could use this / The whole campus | Customer Size (one dept → campus) |
| **"How much is this slowing your team down?"** → It's a minor annoyance / It eats up real time every week / It's a serious bottleneck / We can't keep up | Customer Need (Low → High) |

### 1b. "Help me understand the workload" (maps to → Viability / Savings)

Users never see "ROI" or "viability." Instead, a friendly walkthrough:

| What the user sees | What it maps to |
|---|---|
| **"Roughly how often do you do this task?"** → A few times a month / A few times a week / Daily / Multiple times a day | Process Volume |
| **"How long does it take each time?"** → A few minutes / About half an hour / A couple hours / Half a day or more | Time per Instance |
| **"How many people spend time on this?"** → Just me / 2-3 people / A small team / A large group | Scale multiplier for savings |

The system auto-calculates savings behind the scenes and shows the user a simple, encouraging result:
> "It sounds like your team spends about **40 hours/month** on this. AI could help get a lot of that time back."

No spreadsheet, no calculator UI, no asking users to estimate percentages. The system does the math.

### 1c. "What's going on today?" (maps to → Context / Challenge / Request)

Users never see "Context/Challenge/Request" as section headers. Instead, a natural story-gathering flow:

**About the current situation (→ Context):**
- **"What tools or systems do you use for this right now?"** → Checkboxes: Canvas, ServiceNow, Oracle, Excel/Sheets, Email, Paper forms, Other ___
- **"How long have you been doing it this way?"** → Less than a year / 1-3 years / It's been like this forever

**About the pain (→ Challenge):**
- **"What's the most annoying part?"** → Free text with example prompts: *"For example: 'We have to copy-paste between two systems' or 'It takes 3 people to review one form'"*
- **"Why is now the right time to fix this?"** → Options: Volume is going up / We're losing staff / New policy requires it / Leadership asked for it / Just want to improve things
- **"What happens when it falls behind?"** → Free text with prompts: *"For example: 'Reports are late' or 'Students don't get answers in time'"*

**About what they want (→ Request):**
- **"If you could wave a magic wand, what would the AI do?"** → Free text, deliberately open-ended
- **"What would 'great' look like 6 months from now?"** → Free text with prompts: *"For example: 'Processing time drops from days to minutes' or 'Staff can focus on advising instead of data entry'"*

The system takes all of these short answers and uses AI to compose polished Context, Challenge, and Request paragraphs for the UCSD format. The user never writes a paragraph — they answer simple questions, and the narrative writes itself.

### 1d. "A few quick details" (maps to → Feasibility + Metadata)

Users never see "feasibility." These feel like natural wrap-up questions:

| What the user sees | What it maps to |
|---|---|
| **"Have you heard of TritonGPT?"** → Yes, I already use it / I've heard of it / No, what's that? | Alignment with Existing Solutions |
| **"Is the data you'd need easy to get to, or would someone need to set up access?"** → I can get to it myself / Someone would need to help / I'm not sure where it lives | Data Availability |
| **"Which part of campus are you in?"** → Dropdown of VC areas | VC Area |
| **"What's your email?"** (pre-filled if already captured) | Submitted by |
| **"Are you submitting this for yourself or someone else?"** → For myself / On behalf of ___ | On behalf of |

**Complexity** is never asked — the system auto-calculates it from the number of data sources, protection level, processing steps, and output format chosen.

### 1e. Process Overview (100% AI-Generated, never asked)

The entire Process Overview section of the UCSD format (Purpose, Description, Key Points, AI Solution Considerations, Potential Impact, Questions & Considerations) is generated by AI from the user's answers across all stages. The user never sees or fills out these fields. The system:

1. Takes the project title + description + "magic wand" answer → generates **Purpose**
2. Combines all wizard answers into a coherent → **Description**
3. Extracts key points from context/challenge/request answers → **Key Points**
4. Derives from protection level + data sources + tool alignment → **AI Solution Considerations**
5. Uses savings calculation + audience size → **Potential Impact**
6. Flags from gap analysis + P-level warnings → **Questions & Considerations**

---

## 2. AI-Powered Gap Analysis & Follow-Up (High Priority)

After the user completes the wizard, an AI reviews all collected data against the UCSD format requirements and identifies gaps.

### How it works:
1. User completes all wizard stages
2. AI analyzes completeness against the UCSD intake template
3. Presents a "Gap Analysis" screen showing:
   - **Complete** sections (green checkmarks)
   - **Needs more detail** sections (yellow, with specific follow-up questions)
   - **Missing** sections (red, with guided prompts)
4. AI asks targeted follow-up questions conversationally:
   - "You mentioned the data comes from Canvas. Can you tell me roughly how many records are involved per month?"
   - "You said this is for your department — about how many people would use the AI tool day-to-day?"
5. User can **snooze** any question ("I'll answer this later")
6. Snoozed questions persist — user gets a link to come back and complete them
7. Each time they answer more, the summary/export updates automatically

### Completeness Score
- Show a percentage: "Your intake is 73% complete"
- Map to readiness: <50% = "We'll need a meeting" / 50-80% = "Almost there, a few questions" / 80%+ = "Ready for review"

---

## 3. Typeform-Style UX Overhaul (High Priority)

Upgrade the wizard experience to feel more like a Typeform conversation:

### Features:
- **One question per screen** with smooth vertical scroll transitions (already partially done)
- **Progress indicator** showing section + question number (e.g., "Gather 3/7")
- **Contextual help tooltips** — hover/tap for plain-English explanations of terms like "protection level" or "data classification"
- **Smart defaults** — pre-select the most common answer and let users change it
- **Undo/back** with preserved answers (already exists, enhance with animation)
- **Keyboard navigation** — number keys to select options, Enter to continue
- **Mobile-first responsive design** — many users may access from phone
- **Micro-animations** — subtle confetti or checkmark on section completion
- **Estimated time remaining** — "About 5 minutes left"

### Conversational Tone
- Rewrite all questions in plain, friendly language
- Add brief "why we ask this" explanations under each question
- Use examples liberally: "For example, if your team manually reviews 200 contracts per quarter..."

---

## 4. Two-Summary System: User View vs. OSI View (High Priority)

The user and OSI see completely different summaries generated from the same answers.

### 4a. User-Facing Summary ("Here's what you told us")
This is what the user sees after completing the wizard. It reads like a friendly recap — no jargon, no UCSD format fields, no terms like desirability/viability/feasibility.

**Example of what the user sees:**
> **Your Project: Student Feedback Analyzer**
>
> **What you're trying to do:** Your team manually reviews about 200 course evaluations per quarter, looking for common themes. You want AI to do the heavy lifting so your analysts can focus on recommendations instead of reading.
>
> **The data:** Course evaluations from Canvas — internal UCSD data that requires SSO access. New data comes in every quarter.
>
> **What AI would handle:** Summarize feedback, identify recurring themes, and flag urgent issues.
>
> **How you'd see results:** A dashboard your team can check after each evaluation cycle.
>
> **Time savings:** Your team currently spends about 40 hours/quarter on this. AI could help get most of that time back.
>
> **What's next:** Our team will review this and follow up within a few days. You can come back and add more detail anytime.

Features:
- Written in plain, warm language — feels like a confirmation email, not a government form
- Editable with a Notion-like block editor — users can tweak wording before submitting
- No UCSD intake terminology anywhere
- Includes a "Did we get this right?" prompt encouraging corrections

### 4b. OSI-Facing Summary (UCSD Intake Format)
This is what the OSI admin dashboard shows. It maps directly to the UCSD intake template structure. Users never see this view.

**Auto-generated sections:**
- **Process Overview:** Purpose, Description, Key Points, AI Solution Considerations, Potential Impact, Questions & Considerations
- **Desirability:** Customer Size, Customer Need (Low/Medium/High)
- **Viability:** Process Volume, Potential Savings per Cycle, Potential Savings per Month
- **Feasibility:** Alignment with Existing Solutions, Data Availability, Complexity
- **Context / Challenge / Request:** Full narrative paragraphs
- **Savings:** Time savings breakdown with FTE equivalent, Impact statement
- **Metadata:** VC Area, Submitted by, On behalf of

### 4c. Claude Code Prompt Bundle (Third Export — for Building)
See Section 5.

### Export formats available to OSI:
- **UCSD Intake PDF** — formatted to match the official template exactly
- **Claude Code Prompt Bundle** — structured markdown ready to paste into Claude Code
- **JSON** — machine-readable for integrations
- **Markdown** — for pasting into docs, Notion, etc.

### Export available to users:
- **PDF of their friendly summary** — "Here's a copy of what you submitted"
- **Share link** — to send to a colleague or supervisor for visibility

---

## 5. Claude Code Prompt Bundle Export (High Priority)

Generate a structured output specifically designed to be pasted into Claude Code to scaffold the AI project.

### Bundle contents:
```
# Project: [Title]

## Business Context
[AI-generated Context/Challenge/Request narrative]

## Requirements
- [Bullet list derived from all wizard answers]
- Data sources: [from Gather]
- Processing tasks: [from Refine]
- Output format: [from Present]
- Protection level: [P-level with implications]

## Constraints
- Must comply with UC [P-level] data classification
- [Feasibility conditions from matrix]
- [Regulatory context: FERPA/HIPAA/etc.]

## User Profile
- Primary users: [role descriptions from intake]
- User count: [from customer size]
- Technical level: Non-technical / Semi-technical

## Scope
- Process volume: [X per month]
- Current time per instance: [X hours]
- Target: [savings % reduction]

## Suggested Architecture
[AI-generated based on output format + data sources + protection level]
- For chat: "RAG pipeline with UCSD SSO auth"
- For dashboard: "Data pipeline + visualization layer"
- For automation: "Event-driven workflow with approval gates"

## Acceptance Criteria
[AI-generated from "what does success look like" answer]

## Out of Scope
[AI-generated based on what was NOT selected in the wizard]
```

This gives Claude Code enough context to generate a project scaffold, CLAUDE.md, and initial task breakdown.

---

## 6. Persistent Submissions & Return Visits (Medium Priority)

Allow users to save progress and come back later.

### Features:
- **Email-based identification** — no password needed, just email to retrieve submissions
- **Magic link** — email a link to resume an in-progress submission
- **Multiple submissions** — one user can have multiple project intakes
- **Submission status** — Draft / Submitted / In Review / Needs Info / Approved / Building / Complete
- **Snoozed gap analysis questions** — resurface when user returns
- **Updated exports** — re-download updated documents after answering snoozed questions
- **Submission history** — see all past submissions and their status

---

## 7. OSI Admin Dashboard (Medium Priority)

A separate admin view for the OSI team to manage all submissions.

### 7a. Submission Queue
- List of all submissions sortable by date, department, status, completeness score
- Filter by: VC area, protection level, status, completeness %, date range
- Quick actions: change status, assign to team member, flag for follow-up
- Click into any submission to see full details

### 7b. Analytics Overview
- **Submissions over time** — trend chart (weekly/monthly)
- **By department** — bar chart of submissions per VC area
- **By project type** — pie chart (chatbot vs. automation vs. data processing)
- **By protection level** — distribution of P1-P4
- **Average completeness score** at submission time
- **Time to review** — how long submissions sit before OSI acts
- **Common data sources** — what systems are most frequently mentioned

### 7c. Prioritization Matrix
Auto-score each submission on three axes (from the UCSD format):
- **Desirability** (customer size × need level)
- **Viability** (savings potential × process volume)
- **Feasibility** (complexity inverse × data availability × tool alignment)

Display as a 2D scatter plot (impact vs. effort) or ranked list. OSI team can override scores.

### 7d. Admin Actions
- Leave internal notes on submissions (not visible to submitter)
- Send questions back to the user (triggers email, user answers in-app)
- Export batch of submissions as CSV/Excel for reporting
- Archive completed or rejected submissions

---

## 8. New Questions Woven Into Existing Stages (High Priority)

These are additional simple questions added naturally within the existing GATHER → REFINE → PRESENT wizard flow. Users experience them as part of the same friendly conversation — they don't know they're filling UCSD format gaps.

### Describe Stage — "Tell us about your idea"
The current Describe page already collects title, description, domain, and timeline. Add these naturally:
- **"Who on your team does this work today?"** — sets up the "people" context early
- **"Why is now the right time to explore this?"** — feels natural after "what's your timeline?"
- **"If this doesn't get built, what happens?"** — friendly way to capture urgency without saying "business impact"

### Gather Stage — "Where does the information live?"
After the data classification questions, weave in:
- **"What systems or tools does your team use day-to-day?"** — checkbox list (Canvas, ServiceNow, Oracle, Box, Excel, etc.) with "Other"
- **"How often does new data come in?"** — All the time / Every day / A few times a week / Monthly / Not sure
- **"Is there anyone on your team who really knows this data well?"** — captures institutional knowledge context

### Refine Stage — "What does the work look like?"
After the "what do you want AI to do?" question, add:
- **"Walk me through a typical example of how you do this today"** — free text with a prompt like *"Start from when you first get the request..."*
- **"Who uses the result of this work?"** — My team / Other departments / Students / Leadership / External partners
- **"Does anyone need to review or approve the result before it goes out?"** — Yes, always / Sometimes / No, I just send it

### Present Stage — "How should the results show up?"
After output format selection, add:
- **"How quickly do people need to see results?"** — Right away / Same day / Within a week / Whenever it's ready
- **"Would other departments benefit from this too, or just yours?"** — Just us / Maybe a few others / Lots of teams could use this

---

## 9. Smart Examples & Templates (Low Priority)

Help non-technical users by showing them what good answers look like.

### Features:
- **Example projects** — "See how a department like yours described a similar project" (anonymized past submissions)
- **Template starters** — Pre-filled templates for common project types:
  - "Document Q&A Bot" (chatbot that answers questions from department docs)
  - "Report Summarizer" (AI that condenses long reports)
  - "Data Entry Automator" (AI that extracts info and fills systems)
  - "Email Classifier" (AI that sorts/routes incoming emails)
- **"I want something like this, but..."** — Start from a template and customize
- **Tooltips with examples** on every free-text field

---

## 10. Process Flow Visualizer (Low Priority)

Help users articulate their current process visually.

### Features:
- Simple drag-and-drop flowchart builder (3-8 steps max)
- Pre-built process step blocks: "Receive data" → "Review" → "Transform" → "Approve" → "Send"
- User marks which steps they want AI to handle
- AI generates a "before and after" comparison showing current vs. AI-assisted flow
- Exports as part of the Context/Challenge narrative

---

## 11. Collaboration Features (Low Priority, Future)

For cases where multiple people need to contribute to one submission.

### Features:
- **Share link** — invite a colleague to co-fill a submission
- **Role-based sections** — "The data person should fill out Gather, the manager should fill out Viability"
- **Comments** — Leave notes on specific sections for collaborators
- **Activity log** — See who changed what and when

---

## Summary: Priority Roadmap

### Phase 1 — Core Gaps (Must Have)
1. Conversational data collection — friendly questions that secretly map to the UCSD intake format (1a-1e)
2. New questions woven naturally into existing wizard stages (8)
3. Auto-calculated savings — system does the math from simple "how often / how long" answers (1b)
4. AI-generated narratives — system composes Context/Challenge/Request paragraphs from short answers (1c, 1e)
5. Claude Code prompt bundle export (5)

### Phase 2 — Smart Experience
6. Two-summary system — friendly user view + structured OSI/UCSD format view (4)
7. AI gap analysis with snoozed questions (2)
8. Typeform-style UX polish (3)
9. Persistent submissions & return visits (6)

### Phase 3 — Admin & Scale
10. OSI admin dashboard (7)
11. Smart examples & templates (9)

### Phase 4 — Nice to Have
12. Process flow visualizer (10)
13. Collaboration features (11)
