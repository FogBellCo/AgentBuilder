# E2E Test Report — AgentBuilder

**Date:** 2026-03-18
**Tested by:** Playwright (manual walkthrough)
**Servers:** Frontend (localhost:5173) + Backend (localhost:3001)

---

## Test Results Summary

| Area | Status | Issues Found |
|------|--------|-------------|
| Landing Page | PASS | 0 critical, 1 minor |
| Describe Form | PASS | 0 critical, 1 minor |
| Pipeline Page | PASS | 0 issues |
| Wizard Overlay (Typeform UX) | PASS | 1 bug |
| Gather Stage | PASS | 0 issues |
| New Spec 01 Questions | PASS | 0 issues |
| Gather Detail Form | PASS | 0 issues (copy fixes verified) |
| Stage Completion Celebration | PASS | 0 issues |
| Sidebar Navigation | PASS | 0 issues (copy fixes verified) |
| Copy / Jargon Cleanup | PASS | 0 remaining jargon |
| Refine Stage | PASS | 0 issues (copy fixes verified) |
| Refine Detail Form | PASS | 0 issues (copy fixes verified) |
| Present Stage | PASS | 0 issues (copy fixes verified) |
| Compatibility Check | PASS | 0 issues (was "Feasibility Check") |
| Gap Analysis Page | PASS | 1 minor issue |

---

## Detailed Results

### 1. Landing Page — PASS

**What works:**
- Heading "Request an AI Tool" renders correctly
- Subtext "Need AI to help with something at UCSD?" — copy fix confirmed working
- 4-step preview shows: Describe ("Tell us what you need"), Your Data, Your Task, Your Output
- "Get Started" button works, navigates to /describe
- Privacy disclaimer present
- Email prompt section renders
- Footer with "UC San Diego · AI Tool Request" renders

**Minor issue:**
- 2 console errors: `Failed to load resource: 401 (Unauthorized)` on `/api/auth/me` — expected behavior when not logged in, but the errors are noisy. **Recommendation:** Catch 401s silently in the auth hook instead of letting them hit the console.

---

### 2. Describe Form — PASS

**What works:**
- Heading "Describe Your Idea" renders
- All form fields render with correct labels and placeholders
- "Project Title" placeholder: "e.g., Course evaluation summaries, Travel reimbursement sorting" — updated placeholder confirmed
- "What do you want to build?" label present
- Domain dropdown with all 14 options + "Other"
- "Who on your team does this work today?" — new spec 01 question renders
- "Why is now the right time to explore this?" — multi-select chips work
- "If this doesn't get built, what happens?" renders
- Hint text uses "your request" (not "your project") — copy fix confirmed
- Workload section renders with all 3 selectors (frequency, duration, people)
- **Savings callout works!** — After selecting Daily + A couple hours + A small team, it shows: "It sounds like your team spends about **308 hours/month** on this. AI could help get a lot of that time back."
- Context section renders with tool multi-select and magic wand question
- "Next: Tell Us About Your Data" button is disabled until required fields filled, then enables

**Minor issue:**
- The savings calculation of 308 hours/month for "Daily × A couple hours × A small team (4-10)" seems high. Daily (22 days) × 2 hours × 7 people = 308. The math is correct, but the midpoint of "4-10" using 7 might overestimate. **Recommendation:** Consider using the lower bound (4) for a more conservative estimate, or show the range.

---

### 3. Pipeline Page — PASS

**What works:**
- Heading "Your AI Tool Request" renders
- Shows "Request: Course Evaluation Summaries" — copy fix confirmed ("Request:" not "Project:")
- 3 stage cards (Your Data, Your Task, Your Output) render with "Not started" status
- Stage cards are clickable
- Sidebar shows "Your Request" (not "Your Idea") — copy fix confirmed

---

### 4. Wizard Overlay (Typeform UX) — PASS with 1 BUG

**What works:**
- Full-viewport overlay renders correctly — covers sidebar/breadcrumbs
- Progress pill shows section name, question count, and time estimate ("YOUR DATA · 1 of 3 · ~1 min")
- Progress pill dynamically updates as new questions are added to the flow
- "Almost done!" shows when ≤1 question remaining
- Large typography for question text (heading level)
- Option cards render with icons and descriptions
- Keyboard shortcut badges visible ("1", "2", "3"...)
- "Why do we ask this?" button present on all questions
- "Press 1-9 to select · Backspace to go back" hint shows at bottom
- Back button present
- Multi-select shows checkboxes with checkmark animation on selection
- Single-select shows radio-style options
- Smooth transitions between questions (slide animation)

**BUG — Continue button has persistent pulse animation that blocks Playwright clicks:**
- The multi-select "Continue" button uses a CSS pulse animation
- Playwright interprets this as "element is not stable" and times out on `.click()`
- Workaround: `element.click()` via JS evaluate works
- **Impact:** Blocks automated testing. Does not affect real users.
- **Recommendation:** Either remove the pulse animation on the Continue button, or use `will-change: transform` with `animation-fill-mode: forwards` to settle the animation. Alternatively, add `data-testid` and use `force: true` in Playwright config.

---

### 5. Gather Stage — PASS

**What works:**
- First question: "Where does the data you want to work with live?" with 6 options
- Multi-select works correctly (checkboxes, Continue button appears)
- P2 confirmation: "Your data is Internal (P2) — accessible with UCSD SSO login" renders correctly
- "That sounds right — continue" / "Actually, let me reconsider" options work
- New spec 01 questions all render and work:
  - "What systems or tools does your team use day-to-day?" (9 checkbox options)
  - "How often does new data come in?" (5 radio options)
  - "Is there anyone on your team who really knows this data well?" (4 radio options)
- All hint text present and correct
- Stage completes successfully after last question

---

### 6. Stage Completion Celebration — PASS

**What works:**
- "Your Data section complete!" heading with checkmark animation
- "Nice work. Moving on..." subtext
- Auto-advances to detail form after ~1.2 seconds

---

### 7. Gather Detail Form — PASS (Copy Fixes Verified)

**What works:**
- "Tell us more about your data" heading
- Protection level badge "P2 — INTERNAL" renders
- All copy fixes confirmed:
  - "What format is your data in?" (was "Data Type")
  - "Database" (was "Database / SQL")
  - "Live data feed or connected system" (was "API / Web Service")
  - "Where does the data live?" (was "Source System(s)")
- Data size options render correctly
- Regulatory context options render (FERPA, HIPAA, etc.)

---

### 8. Sidebar Navigation — PASS (Copy Fixes Verified)

**What works:**
- "Your Request" (was "Your Idea") — confirmed
- "More about your data" (was "Data details") — confirmed
- Question breadcrumbs in sidebar show truncated question text
- Green checkmarks on completed questions
- Blue highlight on current item
- Disabled state on locked stages (Your Task, Your Output)

---

### 9. Copy / Jargon Audit — PASS

**Confirmed fixed across all tested pages:**
| Term | Before | After | Status |
|------|--------|-------|--------|
| Landing step desc | "Tell us about your idea" | "Tell us what you need" | FIXED |
| Landing heading | "Got an idea for using AI" | "Need AI to help with something" | FIXED |
| Sidebar nav | "Your Idea" | "Your Request" | FIXED |
| Sidebar sub-items | "Data details" | "More about your data" | FIXED |
| Pipeline label | "Project:" | "Request:" | FIXED |
| Detail form labels | "Data Type", "Source System" | "What format...", "Where does..." | FIXED |
| Detail form options | "Database / SQL", "API / Web Service" | "Database", "Live data feed..." | FIXED |
| Hint text | "your project" | "your request" | FIXED |

**No instances of banned jargon found** (feasibility, refinement, data classification, regulatory context) in any user-facing UI tested.

---

### 10. Refine Stage — PASS (All Copy Fixes Verified)

**What works:**
- All 7 wizard questions render and work correctly:
  - "What do you want AI to do with your data?" (8 task options)
  - "How should the data be prepared before AI processes it?" (4 options)
  - "Who will see the AI output?" (4 audience options)
  - Confirmation: "Great — let's add a few more details about what you need." (was "refinement plan") — copy fix confirmed
  - "Walk me through a typical example..." (free text with Skip button — works)
  - "Who uses the result of this work?" (5 multi-select options)
  - "Does anyone need to review or approve the result before it goes out?" (3 options)
- Stage completion celebration: "Your Task section complete!"
- Sidebar shows "More about your tasks" (was "Refinement details") — copy fix confirmed

**Refine Detail Form:**
- Heading: "Tell Us More About Your AI Tasks" (was "Detail Your Refinements") — confirmed
- "AI Task 1" (was "Refinement 1") — confirmed
- "Add Another AI Task" button (was "Add Another Refinement") — confirmed
- "Add details for each thing you want AI to do. You can add more than one." — confirmed
- Task dropdown pre-populated from wizard selection (Summarize)
- Data prep chips work (Use as-is selected by default)

---

### 11. Present Stage — PASS (All Copy Fixes Verified)

**What works:**
- Output picker shows all 12 format cards with icons and descriptions
- Multi-select with "Continue with N format(s)" button
- Compatibility Check page (was "Feasibility Check"):
  - Heading: "Compatibility Check" — confirmed
  - Subtext: "Checking your selected formats against P2 (Internal) data level." (was "data classification level") — confirmed
  - Visual Dashboard shows "Conditional" with requirement: "Dashboard must be hosted behind UCSD SSO"
- New spec 01 questions after compatibility:
  - "How quickly do people need to see results?" (4 options) — works
  - "Would other departments benefit from this too, or just yours?" with updated copy: "it might change how we set it up" (was "how we build and deploy it") — confirmed

---

### 12. Gap Analysis Page — PASS with 1 minor issue

**What works:**
- Heading: "Reviewing Your Submission" (not "Gap Analysis") — confirmed
- Loading state: "Analyzing your submission..." with spinner
- "This is taking a bit longer than usual. Hang tight..." shows after ~10s — works
- AI-generated follow-up questions are contextually excellent:
  - 17 Critical questions covering FERPA specifics, data format, source systems, success metrics, cadence clarification
  - 7 Nice-to-Have questions about dashboard filters, platform preference, content handling
- Protection level reclassification banner: P2 → P3 with detailed FERPA reasoning
  - "Accept Reclassification" / "Keep Current Level" buttons present
- Completeness bar shows 75% with "Almost there" badge
- Each question has "Submit Answer" and "Snooze" buttons
- Mix of free-text and multiple-choice follow-up questions
- "Generate Summary" button present (disabled until all questions answered/snoozed)

**Minor issue:**
- The AI generated 24 total follow-up questions — that's a LOT for a non-technical user. Many are quite detailed (FERPA identifiers, OCR vs text extraction, retention policies). While thorough, this volume could overwhelm users. **Recommendation:** Cap AI-generated questions at 8-10 max, or show Critical questions first with Nice-to-Have collapsed by default. Consider making the snooze-all option more prominent so users aren't intimidated.

---

## Not Tested

- **Summary page** — could not reach (need to answer/snooze all gap questions first)
- **Export functionality** — download, share, submit buttons
- **Admin dashboard** — login, queue, analytics, prioritization, settings

---

## Recommendations

### Critical (fix before deploy)
1. **Continue button pulse animation** — blocks automated testing. Remove the infinite pulse or make it settle after one cycle.

### Should Fix
2. **401 console errors on landing** — catch unauthenticated `/api/auth/me` calls silently instead of letting them log as errors.
3. **Savings estimate conservatism** — consider using the lower bound of "small team" (4 instead of 7) or showing a range like "120-300 hours/month" so it doesn't feel inflated.

### Should Fix
4. **Too many gap analysis questions** — AI generated 24 follow-up questions (17 critical + 7 nice-to-have). Non-technical users will be overwhelmed. Cap at 8-10 or make Nice-to-Have collapsed by default with a prominent "snooze all" option.

### Nice to Have
5. **Progress pill question count** — the count dynamically jumps (e.g., "1 of 3" becomes "3 of 3" then "4 of 4" then "5 of 5") as new nodes are added by the tree engine. This is technically correct but could feel jarring. Consider showing a fixed total or using a progress bar instead of a counter.
6. **Add `data-testid` attributes** — on key interactive elements for more robust automated testing.
