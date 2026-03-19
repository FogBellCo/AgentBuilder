# Decision Tree Gap Analysis — Past Submissions vs. Current Flow

54 past AI idea submissions were mapped through the current AgentBuilder decision tree. This document captures every gap found: where the tree fails, what submission exposed it, and how to fix it.

**Key constraint:** All user-facing text must be plain, approachable language for non-technical UCSD office staff. No jargon.

---

## Executive Summary

The current tree is built around an **"analyze data and present results"** paradigm. But roughly **half of all submissions** describe one of these patterns the tree cannot represent:

1. **Building or adopting a tool/agent** that takes autonomous actions in backend systems
2. **Q&A / RAG chatbots** over document corpora (the most common GenAI use case — no dedicated task type)
3. **Process automation / RPA** where AI executes workflow steps, not just analyzes data

The 5 REFINE task types and 9 output formats cover analytical workflows well but miss generative, agentic, decisioning, and automation use cases.

> **Note:** Vendor product evaluation (e.g., "can we use RobinAI?") is **out of scope** for this tool. Submissions that are purely about procuring a third-party product (#11 RobinAI, #107 AppZen, #102 Oro Labs) would not go through this intake — they belong in a procurement process. This analysis focuses on gaps relevant to workflow planning and tool building.

---

## Gap 1: AI Task Types Are Too Narrow (REFINE Q1)

**Severity: P0 — affects 45+ of 54 submissions**

The current 5 task types (Summarize, Analyze, Compare, Recommend, Classify) are all **passive analytical operations**. The following task patterns appear repeatedly in submissions but have no matching option:

### Missing Task Types

| Missing Task | What It Covers | Submissions That Need It |
|-------------|---------------|------------------------|
| **Q&A / Knowledge Retrieval (RAG)** | Ask questions against a document corpus, get answers. The single most common GenAI use case. | #168, #167, #64, #62, #128, #25, #8, #6, #106 |
| **Generate / Create Content** | Write new text: job descriptions, study guides, legal arguments, product descriptions, assessments, reports from templates. | #49, #14, #7, #6, #50, #147, #106 |
| **Extract Structured Data** | Pull specific fields from unstructured documents (OCR, contract parsing, transcript reading, invoice matching). Distinct from "summarize." | #13, #9, #10, #169, #139, #112, #107 |
| **Validate / Verify Against Rules** | Check if data meets criteria, flag non-compliance. Rules-based validation, not classification. | #139, #132, #131, #124, #144, #153, #154, #10 |
| **Automate / Execute Actions** | AI takes autonomous actions in systems: approve transactions, create records, send emails, route requests. The "agentic" paradigm. | #186, #152, #151, #154, #108, #63, #102, #101 |
| **Search / Retrieve / Match** | Semantic search, record matching, entity resolution, faculty expertise lookup, supplier matching, mentor-mentee pairing. | #167, #104, #183, #173, #142 |
| **Transcribe / Convert** | Speech-to-text, format conversion, OCR. A preprocessing step the tree doesn't acknowledge. | #48, #169 |
| **Route / Orchestrate** | Understand user intent and direct to the right system, process, or person. Decision-tree navigation. | #102, #92, #128 |

### Implementation Plan

**Files:** `src/data/refine-tree.ts`, `src/components/refine/RefineDetailForm.tsx`

Expand the `refine-task` node from 5 → 8 options. All labels written for non-technical users:

| # | ID | Label | Description |
|---|---|---|---|
| 1 | `summarize` | **Summarize or extract key points** | *Get the important parts from a large amount of information* |
| 2 | `analyze` | **Analyze trends and patterns** | *Spot what's changing, find connections, or detect outliers* |
| 3 | `compare` | **Compare or cross-check** | *Check one thing against another — find matches, differences, or gaps* |
| 4 | `recommend` | **Give suggestions or guidance** | *Help people make decisions or find the right next step* |
| 5 | `classify` | **Sort, label, or score** | *Put things into categories, assign tags, or rate by priority* |
| 6 | `answer` | **Answer questions from documents** | *Let people ask questions and get answers based on your files and policies* |
| 7 | `generate` | **Draft or create content** | *Write descriptions, reports, emails, or other text based on your data* |
| 8 | `extract` | **Pull data from files** | *Read documents, images, or forms and pull out specific information* |

Also update the task type dropdown in `RefineDetailForm.tsx` to include the 3 new options (`answer`, `generate`, `extract`).

---

## Gap 2: "Existing AI Tool?" Field Missing

**Severity: P0 — affects ALL 54 submissions**

The CSV tracks whether the submitter already has an AI tool. The tree never asks this. This is critical because it changes the entire nature of the intake:

| Scenario | What the tree should do differently |
|----------|-------------------------------------|
| **No existing tool** | Current flow works — plan a new workflow |
| **Already using a tool** | Capture what tool, what it does, what's missing |
| **Extending TritonGPT** | Different path — what data to add, not what to build |
| **Have a proof of concept** | Capture results, accuracy, what's needed to productionize |

> Vendor product evaluation (e.g., #11 RobinAI, #107 AppZen, #102 Oro Labs) is **out of scope** — those belong in a procurement process, not this intake tool.

Submissions affected by this gap include tools already in production (#6 TritonGPT, #7 JDHelper, #8 Fund Manager Coach), PoCs (#169 OCR conveyor, #153 PO workflow, #9 ISPO Assistant), and TritonGPT extensions (#64, #62, #142, #118).

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`, `src/types/decision-tree.ts`, `src/store/session-store.ts`

Add to the Describe page:

| Field | Type | Required | Options |
|---|---|---|---|
| **Have you already started working on this?** | Single-select toggle buttons | No | **"Starting fresh"**, **"I have a prototype or pilot"**, **"This is already running and I want to improve it"** |

- Add `existingStatus: string` to `ProjectIdea` type
- Bump store to v4, migrate with default `''`
- Show in summary page

---

## Gap 3: Output Formats Don't Cover Actions or System Integration

**Severity: P1 — affects 15+ submissions**

The 9 output formats all assume **human consumption** — someone looking at a report, dashboard, or chat. Many submissions want AI output to **feed back into systems** or **take autonomous action**.

### Missing Output Patterns

| Missing Format | What It Covers | Submissions |
|---------------|---------------|-------------|
| **Automated Workflow Action** | AI approves transactions, creates records, routes requests, sends emails within existing systems. | #152, #151, #154, #108, #63, #101, #107 |
| **System Integration / Write-back** | Output goes into another system via API (data into Tririga, captions into lecture capture, descriptions into surplus site). Not for human eyes. | #48, #13, #112, #153, #169 |
| **Embedded Widget** | AI embedded in an existing website or application (chatbot on Nano3 site, search on surplus.ucsd.edu). | #168, #104 |
| **Automated Communications** | AI-generated emails, notifications, or outreach to end users (students, vendors). | #139, #131 |
| **Annotated / Red-lined Document** | Marked-up document with tracked changes, compliance flags, suggested revisions. | #144 |

### Implementation Plan

**Files:** `src/data/output-formats.ts`, `src/data/present-tree.ts`, `src/data/feasibility-matrix.ts`, `src/types/decision-tree.ts`, `src/lib/tree-engine.ts`

Add 3 new output formats:

| Key | Label | Description | Icon |
|---|---|---|---|
| `workflow_automation` | **Automated Actions** | *AI handles routine tasks in your existing systems — like approvals, routing, or data entry* | `Zap` |
| `system_integration` | **Data Pipeline** | *AI results get sent directly into another system — no manual copy-paste needed* | `ArrowRightLeft` |
| `embedded_widget` | **Embedded Assistant** | *An AI helper built into a website or tool your team already uses* | `PanelRight` |

Feasibility matrix for new formats:

| Format | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| `workflow_automation` | allowed | conditional: *"Must run within UCSD-approved systems with SSO"* | conditional: *"Requires API key auth, audit logging, and data steward approval"* | not_allowed |
| `system_integration` | allowed | conditional: *"Both systems must be behind UCSD SSO"* | conditional: *"Requires encrypted transport and API key validation"* | not_allowed |
| `embedded_widget` | allowed | conditional: *"Widget must require UCSD SSO login"* | conditional: *"Must use UCSD-approved platform with API key"* | not_allowed (suggest: static_report) |

Also add to `OutputFormat` type union and `mapOptionIdToOutputFormat` in tree-engine.

Consolidate `present-format` + `present-more-options` into one node with all formats visible.

---

## Gap 4: The Tree Can't Handle "Build a Tool" vs. "Plan a Workflow"

**Severity: P1 — affects ~20 submissions**

The tree assumes every user wants to plan a data-analysis workflow. But many submissions describe:

| Pattern | Examples | Count |
|---------|----------|-------|
| **Building a new interactive tool/application** | #186 (approval agent), #152 (logistics agent), #104 (supplier search), #142 (schedule builder), #92 (contractor classifier) | ~12 |
| **Extending TritonGPT with new data/capabilities** | #64, #62, #118, #119, #142, #147 | ~6 |
| **Requesting infrastructure/platform access** | #110 (SDSC sandbox) | ~1 |
| **Documenting an already-deployed tool** | #6 (TritonGPT), #7 (JDHelper), #8 (Fund Manager Coach) | ~3 |

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`, `src/types/decision-tree.ts`, `src/store/session-store.ts`

Add to the Describe page (not as a separate branching flow — just a field that captures intent):

| Field | Type | Required | Options |
|---|---|---|---|
| **What best describes your goal?** | Single-select toggle buttons | No | **"Plan something new"**, **"Add data or features to TritonGPT"**, **"Get support for something I've already built"** |

- Add `projectGoal: string` to `ProjectIdea` type
- This does NOT create different branches/flows — it's metadata that helps the TritonAI team understand the submission type
- Show in summary page

---

## Gap 5: Domain Dropdown Is Too Limited

**Severity: P1 — affects 15+ submissions**

Current options: Research, Student Services, Finance, IT, Administration, Academic, Other.

### Missing Domains (by frequency)

| Missing Domain | Submissions That Need It | Current Workaround |
|---------------|------------------------|-------------------|
| **Human Resources** | #7, #92 | Falls into "Administration" or "Other" |
| **Supply Chain / Logistics / Procurement** | #169, #152, #153, #154 | Falls into "Finance" or "Other" |
| **Health Sciences / Medical** | #25 | Falls into "Academic" or "Other" |
| **Alumni / Advancement** | #173 | Falls into "Student Services" or "Other" |
| **Facilities / Capital Planning** | #124 | Falls into "Other" |
| **Legal / Ethics & Compliance** | #106, #14 | Falls into "Administration" or "Other" |
| **Housing / Hospitality** | #151 | Falls into "Administration" or "Other" |
| **Enrollment / Admissions** | #139, #132, #131, #101 | Falls between "Student Services" and "Academic" |
| **Marine Sciences / SIO** | #110 | Falls into "Research" or "Other" |

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`

Replace 7 options with 14:

1. Academic Affairs
2. Admissions & Enrollment
3. Alumni & Advancement
4. Facilities & Planning
5. Finance & Business Services
6. Health Sciences
7. Housing & Hospitality
8. Human Resources
9. Information Technology
10. Legal & Compliance
11. Research & Innovation
12. Student Affairs & Services
13. Supply Chain & Logistics
14. Other

---

## Gap 6: Data Size Options Are Row-Based

**Severity: P1 — affects 12+ submissions**

Current options: Small (under 1,000 rows), Medium (1,000–100,000 rows), Large (100,000+ rows), Not sure.

This fails for:

| Data Type | Why Rows Don't Work | Submissions |
|-----------|-------------------|-------------|
| **Documents/PDFs** | Measured in pages, file count, or GB | #62, #64, #106, #124, #8 |
| **Audio/Video** | Measured in hours or GB | #49, #48 |
| **Images** | Measured in file count | #169, #147, #119 |
| **Streaming/Real-time data** | Continuous — no fixed size | #169, #186 |
| **Policy/Knowledge corpora** | Measured in document count, not rows | #128, #92 |

Also, "Large (100,000+ rows)" doesn't distinguish between 100K and 1.3M transactions (#108, #102).

### Implementation Plan

**Files:** `src/components/gather/GatherDetailForm.tsx`

Replace row-based labels with a general scale:

| Current | New Label | New Description |
|---|---|---|
| Small (under 1,000 rows) | **Small** | *A handful of files or a small spreadsheet* |
| Medium (1,000–100,000 rows) | **Medium** | *Dozens of files or a department-sized dataset* |
| Large (100,000+ rows) | **Large** | *Thousands of files, a full database, or campus-wide data* |
| Not sure | **Not sure** | *(no description)* |

No type changes needed — `dataSize` is already a string.

---

## Gap 7: Multi-System Integration Poorly Captured

**Severity: P2 — affects 10+ submissions**

The GATHER detail form has a single "Source System" text field. Many submissions involve 3-6+ enterprise systems:

| Submission | Systems Referenced |
|-----------|--------------------|
| #186 | Oracle, Concur, Kuali, ServiceNow, Ecotime, UCPath |
| #130 | COI system, ARC, federal databases, export control DBs, 10+ offices |
| #108 | Concur, US Bank portal, ServiceNow, Tremendous |
| #102 | Oracle, Concur, and multiple P2P systems |
| #132 | TES, Assist.org, application system |

### Implementation Plan

**Files:** `src/components/gather/GatherDetailForm.tsx`

Change the Source System text input:

- **Label:** "Source System" → **"Source System(s)"**
- **Placeholder:** `"e.g., TritonLink, ServiceNow, Canvas, Banner"` → **`"List all systems involved, e.g., Oracle, Concur, ServiceNow, Canvas"`**

No type changes — `sourceSystem` is already a string that can hold comma-separated values.

---

## Gap 8: P4 Stop Is Too Blunt

**Severity: P2 — affects 3-5 submissions**

When data is classified P4, the tree stops the user entirely: "AI tools cannot be used." But some submissions (#106 Ethics & Compliance, #25 Secure AI for Student Data) describe legitimate use cases where the user plans to de-identify data or use only approved subsets.

Current P4 options:
1. "I understand — show me alternatives"
2. "Let me re-evaluate my data"

### Implementation Plan

**Files:** `src/data/gather-tree.ts`

Add a third option to the `gather-p4-stop` node:

```
{
  id: 'p4-deidentify',
  label: 'I can remove the sensitive parts first',
  description: 'I plan to de-identify or use only non-restricted portions of this data',
  icon: 'EyeOff',
  nextNodeId: 'gather-confirm-p3',
}
```

This routes users who plan to de-identify their P4 data to the P3 confirmation, letting them continue through the flow.

---

## Gap 9: No Capture of Current State / Pain Points / Metrics

**Severity: P2 — affects 10+ submissions**

Many submissions include valuable context the tree doesn't capture:

| Information | Example from Submissions | Where It Should Go |
|------------|------------------------|--------------------|
| Current manual process time | "1-2.5 hours per contract" (#10), "4 hours → 2 minutes" (#9) | New field |
| Volume/throughput | "40,000 inquiries/year" (#115), "1.3M transactions/year" (#108) | New field |
| FTE impact | "1.5 FTE equivalent" (#10), "200 external readers hired annually" (#101) | New field |
| Accuracy of existing PoC | "94% accuracy" (#9) | New field |
| Error/failure rate | "41% of submissions have issues" (#131) | New field |

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`, `src/types/decision-tree.ts`, `src/store/session-store.ts`

Add to the Describe page:

| Field | Type | Required | Placeholder |
|---|---|---|---|
| **How is this done today?** | Textarea | No | *"Briefly describe the current process, if any. For example: 'We manually review 200 contracts per quarter, taking about 2 hours each.'"* |

- Add `currentProcess: string` to `ProjectIdea` type (max 500 chars)
- Show in summary page under the project idea card

---

## Gap 10: Missing Regulatory / Compliance Context

**Severity: P2 — affects 8+ submissions**

The tree classifies data by access level (P1–P4) but doesn't capture **why** data is sensitive or what regulations apply:

| Regulation | Submissions | Impact on Workflow |
|-----------|-------------|-------------------|
| FERPA (student records) | #25, #101, #142 | Imposes restrictions beyond access control |
| HIPAA (health data) | (potential) | Different compliance requirements than P3/P4 |
| Export controls | #130 | Federal restrictions on data sharing |
| GASB 96 (financial compliance) | #10 | Audit requirements |
| FERPA + immigration | #9 | Multiple overlapping frameworks |

### Implementation Plan

**Files:** `src/data/gather-tree.ts`, `src/types/decision-tree.ts`, `src/store/session-store.ts`

Add a new optional node after protection level confirmation (before the detail form):

> **"Does any of the following apply to your data?"**
> *Select all that apply, or skip if you're not sure.*

| Option | ID |
|---|---|
| Student records (FERPA) | `ferpa` |
| Health or medical data (HIPAA) | `hipaa` |
| Export-controlled research | `export-control` |
| Financial audit requirements | `financial-compliance` |
| None of these / Not sure | `none` |

- Store as a new field `regulatoryContext: string[]` on `GatherDetails`
- This is informational metadata for the TritonAI team, not a branching decision

---

## Gap 11: Data Source Options Don't Cover All Real Scenarios

**Severity: P3 — affects 8+ submissions**

Current options: Public website, UCSD internal system, Restricted system, Sensitive personal data, I'm not sure.

### Missing Data Source Scenarios

| Scenario | Submissions | Why Current Options Fail |
|----------|-------------|------------------------|
| **User-uploaded/pasted data** | #119, #117 | Data doesn't "live" anywhere until the user provides it |
| **IoT / physical device data** | #169 | Camera on a conveyor belt is not a "website" or "system" |
| **Live internet / real-time web** | #118 | The internet is not a stored data source |
| **Data that doesn't exist yet** (needs scraping/collection) | #167, #14 | The tree assumes data already exists |
| **Institutional knowledge / business rules** (policies, not records) | #128, #92, #144 | "Documents/PDFs" partially covers this, but the concept is different |

### Implementation Plan

**Files:** `src/data/gather-tree.ts`

Add 1 new option to `gather-start` (insert as option 5, before "I'm not sure"):

```
{
  id: 'user-provided',
  label: 'People will type or upload it directly',
  description: 'Users paste text, upload files, or enter information on the spot',
  icon: 'Upload',
  mapsToProtectionLevel: 'P1',
  nextNodeId: 'gather-confirm-p1',
}
```

---

## Gap 12: No Concept of Multi-Phase Projects or Pipelines

**Severity: P3 — affects 8+ submissions**

The tree models a single linear workflow: data in → AI processes → output. But many submissions describe:

| Pattern | Submissions |
|---------|-------------|
| **Sequential pipeline**: Extract → Calculate → Classify | #10, #19, #13 |
| **Multi-phase rollout**: Short-term (manual assist) → Long-term (full automation) | #13, #19, #102 |
| **Multi-project program**: 4 related but distinct initiatives | #103 |
| **Build-then-use**: Build scrapers → Create database → Add AI layer | #167, #14 |

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`, `src/types/decision-tree.ts`

Add to the Describe page:

| Field | Type | Required | Options |
|---|---|---|---|
| **How complex is this project?** | Single-select toggle buttons | No | **"One simple workflow"**, **"Multiple steps or phases"**, **"Not sure yet"** |

- Add `projectComplexity: string` to `ProjectIdea` type
- Informational only — helps TritonAI team scope the engagement

---

## Gap 13: Specific Tool/Model/Platform Preferences Not Captured

**Severity: P3 — affects 10+ submissions**

| Tool/Platform Referenced | Submissions |
|------------------------|-------------|
| TritonGPT | #6, #7, #8, #64, #62, #118, #119, #142, #147 |
| WhisperAI | #48 |
| RoBERTa | #9 |
| Wolfram | #19 |
| RobinAI | #11 |
| AppZen | #107 |
| Oro Labs | #102 |
| Llama 3.2 | #119 |

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`, `src/types/decision-tree.ts`

Add to the Describe page:

| Field | Type | Required | Placeholder |
|---|---|---|---|
| **Any specific tools in mind?** | Text input | No | *"e.g., TritonGPT, ChatGPT, a specific product..."* |

- Add `preferredTool: string` to `ProjectIdea` type (max 100 chars)

---

## Gap 14: Training/Fine-tuning vs. Using Pre-built AI Not Distinguished

**Severity: P3 — affects 6+ submissions**

Several submissions describe "training" AI on custom data (#49, #14, #8, #6, #106), building RAG systems, or fine-tuning models. The tree assumes the user will use AI on their data, not train AI with their data.

### Implementation Plan

No separate implementation needed. This gap is addressed by:
- **Gap 1** — adding "Answer questions from documents" as a task type covers the RAG/Q&A pattern
- **Gap 2** — capturing existing tool status covers the "already trained a model" scenario

---

## Gap 15: Description Field Too Small

**Severity: P3 — affects 3-5 submissions**

The 1000-character description field is sufficient for most submissions, but some (#167 faculty expertise finder, #130 COI Office) have 2000+ character descriptions with critical detail that would be lost.

Some submissions (#76) reference attached documents that the tree can't accept.

### Implementation Plan

**Files:** `src/components/describe/DescribeIdeaForm.tsx`

Change max from 1000 → 2000 characters. Update the character counter.

---

## Submission-by-Submission Quick Reference

This table shows which gaps affect each submission, for easy lookup.

| # | Idea Name | Key Gaps |
|---|-----------|----------|
| 186 | AI Agent for Transaction Approvers | Tasks (retrieve/query, agentic), Output (system action), Multi-system, Real-time |
| 183 | Payment-to-Invoice Matcher | Tasks (match/reconcile), Learning over time |
| 173 | AI Mentor Matching | Tasks (match/pair), Domain (Alumni), Replace existing platform |
| 169 | OCR API Conveyor Belt | Tasks (OCR/extract), Data source (IoT), Domain (Supply Chain), Existing PoC |
| 168 | Nano3 Chatbot | Tasks (Q&A/RAG), Output (embedded widget), Mixed-sensitivity corpus |
| 167 | Faculty Expertise Finder | Tasks (search/retrieve), Data acquisition, Multi-phase, Description too small |
| 157 | Academic Review AI | Still scoping (pre-planning), Compliance concerns, P3/P4 boundary |
| 154 | Fund Manager Review Workflow | Tasks (validate/approve), Output (workflow action), Human-in-the-loop |
| 153 | PO Workflow Solution | Tasks (evaluate rules), Existing PoC, External partner |
| 152 | AI Agent Forms - Logistics | Tasks (agentic execution), Output (system action), Domain (Supply Chain) |
| 151 | AI Request Form - Housing | Tasks (agentic execution), Output (system action), Domain (Housing) |
| 147 | Surplus Image Descriptions | Tasks (generate from images), Batch/API automation |
| 144 | Contract Terms Reviewer | Tasks (compliance review), Output (red-lined doc), Reference corpus |
| 142 | Class Schedule Builder | Tasks (constraint optimization), Extending TritonGPT, Personalization |
| 139 | Transcript Validation | Tasks (validate/verify), Output (automated communications), Domain (Admissions) |
| 132 | Course Requirements Mapping | Tasks (validate/match), Multi-system integration |
| 131 | Submission Completeness Checker | Tasks (validate), Output (real-time validation), Domain (Admissions) |
| 130 | COI Office AI (UCSD PAGE) | Multi-function platform, Tasks (risk assessment), Ongoing monitoring, Regulatory |
| 128 | Guided Buying Assistant | Tasks (guide/navigate), Data is knowledge/rules not records |
| 124 | Design Guidelines Cross-Reference | Tasks (validate/cross-reference), Domain (Facilities), Data size (docs not rows) |
| 119 | Vision Assistant | Tasks (image analysis), Data source (user-uploaded), Capability exploration |
| 118 | Internet Search Assistant | Platform feature, Data source (live internet), Build vs. Plan |
| 117 | Suspicious Email Reviewer | Data source (user-pasted), Data type (email text) |
| 115 | Virtual Agent for CRM | Tasks (Q&A/guidance), Volume/throughput, After-hours SLA |
| 114 | RPA - IPPS (duplicate of 115) | Same as 115 |
| 112 | Faculty BioBibs into Interfolio | Tasks (extract/transform/ETL), Output (populate another system) |
| 110 | TGPT Sandbox for PoC | Infrastructure request, not workflow. Tasks (semantic search) |
| 108 | RPA - Transactions | Tasks (automate/execute), RPA paradigm, Output (system actions) |
| 107 | AppZen Expense Auditing | Out of scope (vendor evaluation). Also: Tasks (OCR + classify + learn), Output (auto-approve) |
| 106 | Ethics & Compliance AI | P4 too blunt, Tasks (doc generation from template), Train on corpus |
| 104 | Oracle Supplier Search | Tasks (semantic search/match), Build a tool |
| 103 | Lab & Procurement Efficiencies | Multi-project program, External funding, Cross-department |
| 102 | Guided Buying/P2P Orchestration | Tasks (route/orchestrate), Build middleware |
| 101 | Expedite Admissions | Tasks (validate), Output (automated decisions), FERPA, Workforce impact |
| 95 | *(not analyzed — outside batch range)* | — |
| 92 | Contractor vs. Employee Form | Tasks (decision support/expert system), Output (smart form/wizard) |
| 76 | TritonGPT for Rady MSBA | Attached doc, Student-facing vs. staff-facing, Pilot framing |
| 65 | Equity Review Assistance | Sensitivity of equity/comp data, Integration with existing module |
| 64 | Grad Support Contract Q&A | Tasks (Q&A/RAG), Augmenting TritonGPT |
| 63 | Auto-Approve Low-Value Reimbursements | Tasks (automate), Output (workflow action), RPA |
| 62 | Add APM/APPM to TritonGPT | Tasks (Q&A/RAG), Augmenting TritonGPT, Data size (docs not rows) |
| 50 | Assessment Builder | Tasks (generate/create content), Output (structured content) |
| 49 | AI Study Aide | Tasks (generate content), Data size (audio/video), Training AI |
| 48 | Accessibility Enhancer | Tasks (transcribe), Output (write-back to system), Iterative improvement |
| 25 | Secure AI for Student Data | Tasks (ad-hoc query), Domain (Health Sciences), FERPA, Security environment |
| 19 | Natural Language to SQL | Tasks (code generation), Multi-phase pipeline, Build a tool |
| 14 | Legal Case Argument Builder | Tasks (generate content/RAG), Data acquisition (scraping) |
| 13 | Real Estate Lease Abstraction | Tasks (extract structured data), Output (system integration), Multi-phase |
| 12 | Risk-based Proposal Review | Tasks (risk scoring vs. classification), Data science vs. AI |
| 11 | RobinAI for Contract Review | Out of scope (vendor evaluation) |
| 10 | GASB 96 Contract Review | Tasks (OCR + classify pipeline), Compliance/regulatory driver |
| 9 | ISPO Assistant (RoBERTa) | Tasks (document scanning), Existing PoC with metrics, Specific model |
| 8 | Fund Manager Coach | Tasks (Q&A/RAG), Already deployed, Training on corpus |
| 7 | JDHelper | Tasks (generate content), Already deployed, Domain (HR) |
| 6 | TritonGPT | Multi-capability platform — fundamentally can't fit single-workflow model |

---

## Files to Modify (complete list)

| # | File | Changes |
|---|---|---|
| 1 | `src/types/decision-tree.ts` | Add 3 OutputFormat values, add `existingStatus`, `currentProcess`, `preferredTool`, `projectGoal`, `projectComplexity` to ProjectIdea, add `regulatoryContext` to GatherDetails |
| 2 | `src/store/session-store.ts` | Bump to v4, migrate new ProjectIdea and GatherDetails fields |
| 3 | `src/data/refine-tree.ts` | Add 3 new task options to `refine-task` node |
| 4 | `src/data/present-tree.ts` | Add 3 new format options, consolidate into single node |
| 5 | `src/data/output-formats.ts` | Add 3 new OutputFormatInfo entries |
| 6 | `src/data/feasibility-matrix.ts` | Add 3 new format rows |
| 7 | `src/data/gather-tree.ts` | Add `user-provided` to gather-start, add `p4-deidentify` to gather-p4-stop |
| 8 | `src/lib/tree-engine.ts` | Add 3 new format mappings |
| 9 | `src/components/describe/DescribeIdeaForm.tsx` | Add 5 new fields (existingStatus, projectGoal, currentProcess, preferredTool, projectComplexity), expand domain dropdown to 14, increase description to 2000 chars |
| 10 | `src/components/gather/GatherDetailForm.tsx` | Update data size labels, update source system label/placeholder |
| 11 | `src/components/refine/RefineDetailForm.tsx` | Add 3 new task types to dropdown |
| 12 | `src/components/summary/StageSummary.tsx` | Render new fields in summary |
| 13 | `src/components/summary/ProjectIdeaSummary.tsx` | Render new ProjectIdea fields |

---

## What Does NOT Change

- Overall flow structure (Landing → Describe → Pipeline → GATHER → REFINE → PRESENT → Summary)
- Decision tree engine logic (same traversal, same highest-level-wins)
- Routing (no new pages or routes)
- Wizard UX (same question cards, option buttons, animations)
- Protection level system (still P1–P4)
- Feasibility check UX (same green/orange/red pattern)

---

## Priority-Ranked Recommendations

| Priority | Gap | Fix | Effort |
|----------|-----|-----|--------|
| **P0** | AI task types too narrow (Gap 1) | Expand from 5 to 8 task types with plain-language labels | Medium — refine-tree.ts + detail form |
| **P0** | No "Existing AI Tool?" question (Gap 2) | Add toggle buttons to Describe page | Low — one new field |
| **P1** | Output formats don't cover actions/integration (Gap 3) | Add 3 output formats + feasibility matrix rows | Low — present-tree.ts + matrix |
| **P1** | Build vs. Plan distinction missing (Gap 4) | Add goal toggle buttons to Describe page (metadata only, no branching) | Low — one new field |
| **P1** | Domain dropdown too limited (Gap 5) | Expand from 7 to 14 options | Low — dropdown change |
| **P1** | Data size is row-based (Gap 6) | Replace with general scale (Small/Medium/Large) | Low — UI change |
| **P2** | Multi-system integration (Gap 7) | Update label and placeholder text | Trivial — text change |
| **P2** | P4 stop too blunt (Gap 8) | Add "I can remove the sensitive parts first" option | Low — one new option in gather-tree.ts |
| **P2** | No current state / pain points capture (Gap 9) | Add "How is this done today?" textarea to Describe page | Low — one new field |
| **P2** | Missing regulatory context (Gap 10) | Add optional multi-select after protection level confirmation | Low — one new node |
| **P3** | Data source gaps (Gap 11) | Add "People will type or upload it directly" option | Low — one new option in gather-tree.ts |
| **P3** | Multi-phase projects (Gap 12) | Add complexity toggle buttons to Describe page | Low — one new field |
| **P3** | Tool/platform preferences (Gap 13) | Add optional text field to Describe page | Trivial |
| **P3** | Description field size (Gap 15) | Increase to 2000 chars | Trivial |
