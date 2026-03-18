# Spec 04: Typeform-Style UX Overhaul

> **Status:** Draft
> **Feature:** Section 3 from FEATURES-BRAINSTORM.md
> **Priority:** High (Phase 2)
> **Dependencies:** None (purely presentational; no tree-engine or store schema changes)

---

## 1. Overview

Transform the existing wizard experience from a traditional stacked-card form into a Typeform-like conversational interface. Each question occupies the full viewport, transitions are smooth and directional, and the entire interaction feels like a guided conversation rather than a bureaucratic form.

**Core principle:** The tree-engine (`src/lib/tree-engine.ts`), decision tree data files (`src/data/*-tree.ts`), the `useDecisionTree` hook, and the Zustand session store remain untouched. This spec is strictly a presentation-layer overhaul that wraps the same data model in a more engaging shell.

### What changes

| Layer | Current | After |
|---|---|---|
| Layout | `max-w-2xl` card inside a scrollable page with header/breadcrumbs/progress/sidebar/footer all visible | Full-viewport centered question with minimal chrome; sidebar, breadcrumbs, and progress bar hidden during wizard |
| Transitions | Fade-in with `y: 20` (0.4s) | Directional vertical slide: down when advancing, up when going back (0.35s, `easeOut`) |
| Progress | Three-segment bar in a sticky header (stage-level only) | Inline floating progress pill showing section + question index + time estimate |
| Question typography | `text-2xl font-bold` | `text-3xl md:text-4xl font-bold` with increased line height |
| Option buttons | Small bordered cards stacked tightly with icon + label + description | Larger touch-friendly cards with keyboard shortcut badges, stronger hover/selected states |
| Keyboard nav | None | Number keys select, Enter confirms, Backspace goes back |
| Micro-animations | Basic fade/slide on mount | Selection pulse, progress bar spring, section completion checkmark |

### What does NOT change

- Decision tree data structures and node definitions
- `useDecisionTree` hook logic (selectOption, selectMultipleOptions, goBack)
- Session store schema and persistence
- Routing structure (`/stage/:stageId`)
- The Describe page, Pipeline page, Summary page, Gap Analysis page, or any page outside the wizard
- ClassificationResult component (gets minor styling updates but keeps its layout)
- GatherDetailForm and RefineDetailForm (post-wizard detail forms)
- OutputPicker / FeasibilityCheck / MultiFeasibilityCheck (Present stage has its own UI)

---

## 2. Layout & Transitions

### 2.1 Full-Viewport Question Layout

When the user is inside a wizard stage (GATHER or REFINE), the question occupies the entire viewport below the header. The sidebar, breadcrumbs bar, and stage-level progress bar are hidden.

**Implementation approach:** Rather than conditionally hiding layout components from App.tsx (which would require prop-drilling or context), the wizard pages will use a CSS-based approach. The WizardMode component will render a full-viewport overlay that visually covers the sidebar and sub-header areas, while the DOM structure remains unchanged.

```
+----------------------------------------------------------+
| Header (navy bar, always visible)                        |
+----------------------------------------------------------+
|                                                          |
|                                                          |
|              [Progress pill — top center]                 |
|                                                          |
|                                                          |
|                Question text                             |
|                (centered vertically)                     |
|                                                          |
|                Description / hint                        |
|                                                          |
|                [ Option A ]                              |
|                [ Option B ]                              |
|                [ Option C ]                              |
|                                                          |
|                                                          |
|         [Back]                          [keyboard hint]  |
|                                                          |
+----------------------------------------------------------+
```

**CSS structure for the full-viewport overlay:**

The WizardMode component wraps its content in a div that:

```tsx
<div className="fixed inset-0 top-[57px] z-30 bg-white overflow-y-auto">
  {/* 57px = header height (py-4 + content = 56px border-b = 1px) */}
  <div className="flex min-h-full items-center justify-center px-6 py-12">
    <div className="w-full max-w-2xl">
      {/* progress pill, question, options */}
    </div>
  </div>
</div>
```

The `top-[57px]` value accounts for the Header component's height (16px top padding + ~24px content + 16px bottom padding + 1px border = 57px). The `z-30` ensures it sits above the sidebar (`z-index` is not currently set on the sidebar) and below any future modals.

**Why a fixed overlay instead of conditional rendering?** The sidebar, breadcrumbs, and progress bar are rendered in App.tsx outside the route. Conditionally hiding them would require either:
- A global context/store flag (adds coupling)
- Moving them inside each route (large refactor)

The overlay approach is simpler: the layout components still render in the DOM (preserving their state), but they are visually hidden behind the white overlay. When the user leaves the wizard (navigates to Pipeline, Summary, etc.), the overlay unmounts and the full layout reappears.

### 2.2 Vertical Content Centering

The question + options block is vertically centered in the available space using flexbox. If the content exceeds the viewport height (many options, long descriptions), it scrolls naturally within the overlay's `overflow-y-auto`.

On mobile, vertical centering shifts to `items-start` with `pt-8` to avoid the question being hidden behind the progress pill and to leave room for the fixed bottom navigation bar.

### 2.3 Transition Animations

Direction-aware transitions convey spatial navigation: advancing moves content upward (new content slides in from below), and going back moves content downward (previous content slides in from above).

**Framer Motion variants:**

```tsx
// In a new file: src/components/wizard/wizard-variants.ts

export type TransitionDirection = 'forward' | 'backward';

export const questionVariants = {
  enter: (direction: TransitionDirection) => ({
    opacity: 0,
    y: direction === 'forward' ? 60 : -60,
  }),
  center: {
    opacity: 1,
    y: 0,
  },
  exit: (direction: TransitionDirection) => ({
    opacity: 0,
    y: direction === 'forward' ? -60 : 60,
  }),
};

export const questionTransition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier: smooth ease-out
};
```

**How direction is tracked:** Add a `direction` ref to the WizardMode component. When `selectOption` is called, set direction to `'forward'`. When `goBack` is called, set direction to `'backward'`. Pass `direction` as the `custom` prop to `AnimatePresence`.

```tsx
// Inside WizardMode
const directionRef = useRef<TransitionDirection>('forward');

const handleSelect = (optionId: string) => {
  directionRef.current = 'forward';
  selectOption(optionId);
};

const handleBack = () => {
  directionRef.current = 'backward';
  goBack();
};

// In JSX:
<AnimatePresence mode="wait" custom={directionRef.current}>
  <motion.div
    key={currentNode.id}
    custom={directionRef.current}
    variants={questionVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={questionTransition}
  >
    <QuestionCard ... />
  </motion.div>
</AnimatePresence>
```

**Why `mode="wait"`?** This ensures the exiting question fully leaves before the entering question appears, preventing overlap. The total transition time is 0.35s exit + 0.35s enter = 0.7s, which is fast enough to feel responsive but slow enough to convey directionality.

### 2.4 Desktop vs Mobile Layout Differences

| Aspect | Desktop (>= 768px) | Mobile (< 768px) |
|---|---|---|
| Max content width | `max-w-2xl` (672px) | Full width minus `px-5` (40px total padding) |
| Vertical alignment | Centered (`items-center`) | Top-aligned with `pt-8` |
| Option button height | `min-h-[64px]` | `min-h-[56px]` |
| Back button | Top-left of content area | Fixed bottom-left, above safe area |
| Keyboard hints | Visible on option buttons | Hidden (no hardware keyboard) |
| Progress pill | Fixed top-center of overlay | Fixed top-center, slightly smaller text |

---

## 3. Progress Indicator Redesign

### 3.1 Current State

The current `ProgressBar` component (`src/components/layout/ProgressBar.tsx`) shows three colored segments (one per stage) with labels "Your Data", "Your Task", "Your Output" and a "2 of 3 stages" counter. It sits in a sticky bar between the breadcrumbs and the main content.

### 3.2 New Design: Floating Progress Pill

Replace the stage-level progress bar with a question-level progress pill that floats at the top center of the wizard overlay. The existing ProgressBar component remains unchanged for non-wizard pages; the pill is a new component rendered only inside WizardMode.

**Component:** `src/components/wizard/WizardProgressPill.tsx`

**Visual design:**

```
  ┌─────────────────────────────────────────┐
  │  Your Data  ●●●●○○○   3 of 7  · ~4 min │
  └─────────────────────────────────────────┘
```

- Background: `bg-white/90 backdrop-blur-sm` with `shadow-sm` and `rounded-full`
- Position: centered horizontally, `top-4` inside the overlay (`fixed` within the overlay, or `sticky top-4`)
- Section label: `text-xs font-semibold uppercase tracking-wider text-navy`
- Dot indicators: small circles (6px), filled = `bg-blue`, unfilled = `bg-gray-200`
- Question counter: `text-xs text-gray-500`
- Time estimate: `text-xs text-gray-400`, separated by a middle dot

**Section names mapped from stages:**

| Stage | Section label |
|---|---|
| GATHER | "Your Data" |
| REFINE | "Your Task" |
| PRESENT | "Your Output" |

### 3.3 Question Index Calculation

The progress pill needs to know "question X of Y" for the current stage. The tree-engine does not currently expose total node count or current depth, and it cannot easily do so because trees are branching (not linear). The approach:

**For the denominator (total questions):** Count the number of unique history entries for this stage plus 1 (the current question) as "answered so far", and estimate remaining questions based on the longest possible path. Since the trees are small and paths are short, a simpler heuristic works:

```tsx
function getQuestionProgress(stage: Stage, history: Array<{ stage: Stage; nodeId: string }>, currentNodeId: string | null) {
  // Count distinct nodes visited in this stage
  const stageHistory = history.filter(h => h.stage === stage);
  const visited = new Set(stageHistory.map(h => h.nodeId));
  const currentIndex = visited.size + 1; // current question is the next one

  // Estimated totals per stage (based on longest path through each tree)
  const estimatedTotals: Record<Stage, number> = {
    GATHER: 3,  // start -> help-classify -> confirm (worst case)
    REFINE: 5,  // task -> transform -> audience -> warning -> confirm
    PRESENT: 2, // format -> confirm
  };

  const total = Math.max(estimatedTotals[stage], currentIndex);
  return { currentIndex, total };
}
```

This is intentionally approximate. The pill shows "3 of ~5" or "3 of 5" depending on whether we use the tilde. Given the conversational tone, showing "3 of 5" (without tilde) is fine even if slightly inaccurate -- users won't count.

### 3.4 Estimated Time Remaining

**Formula:** `remainingQuestions * averageSecondsPerQuestion / 60`, rounded to nearest minute.

- `averageSecondsPerQuestion`: 15 seconds for single-choice, 25 seconds for multi-choice, 20 seconds for confirmation. Use a blended average of 18 seconds.
- Show "~1 min" as the minimum; never show "0 min" or "< 1 min".
- Show "~X min" format.
- When only 1 question remains, show "Almost done!" instead of a time.

### 3.5 Dot Progress Animation

When advancing to the next question, the newly filled dot animates with a scale spring:

```tsx
<motion.div
  className={cn(
    'h-1.5 w-1.5 rounded-full',
    isFilled ? 'bg-blue' : 'bg-gray-200',
  )}
  animate={isFilled ? { scale: [1, 1.5, 1] } : {}}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>
```

### 3.6 Hiding the Stage Progress Bar

The existing `ProgressBar` component renders on all pages. During wizard mode, it is visually hidden behind the full-viewport overlay (see Section 2.1). No code changes to ProgressBar itself are needed.

---

## 4. Question Card Redesign

### 4.1 Current State

The current `QuestionCard` component renders:
- `h2` with `text-2xl font-bold text-navy`
- Optional description as `text-sm text-gray-500` or a blue callout box
- Options stacked in a `flex flex-col gap-3`

### 4.2 New Typography

| Element | Current | New |
|---|---|---|
| Question text | `text-2xl font-bold text-navy` (1.5rem/24px) | `text-3xl md:text-4xl font-bold text-navy leading-snug` (1.875rem mobile / 2.25rem desktop) |
| Description | `text-sm text-gray-500` (0.875rem/14px) | `text-base text-gray-500 leading-relaxed` (1rem/16px) |
| Spacing below question | `mb-8` | `mb-4` (description provides visual break) |
| Spacing below description | Inline with question block | `mb-10` |

### 4.3 "Why We Ask This" Hint

Add a collapsible hint below the description. Not all questions need one; it is driven by a new optional `hint` field on `DecisionNode` (added to the tree data, not to the TypeScript type initially -- see Section 12 for phasing).

**Initial implementation (without schema change):** Use a static lookup map in the QuestionCard component:

```tsx
// src/components/wizard/question-hints.ts
export const questionHints: Record<string, string> = {
  'gather-start': 'Where your data lives determines what security measures are needed. This helps us match you with the right tools and approvals.',
  'gather-help-classify': 'Different access levels have different rules for AI tools. We want to make sure we guide you correctly.',
  'refine-task': 'Knowing what you want AI to do helps us recommend the right approach and check if it is feasible with your data classification.',
  'refine-transform': 'Some data needs cleaning or filtering before AI can work with it safely. This helps us plan the right pipeline.',
  'refine-audience': 'Who sees the output affects what the AI can produce. Wider audiences may require additional safeguards.',
  'present-format': 'Different output formats have different feasibility depending on your data classification level.',
};
```

**UI behavior:**

- Appears below the description as a clickable text link: "Why do we ask this?" with a small `HelpCircle` icon
- On click, expands to reveal the hint text in a subtle box (`bg-gray-50 rounded-lg p-4 text-sm text-gray-600`)
- Uses Framer Motion `AnimatePresence` with height animation (`initial={{ height: 0, opacity: 0 }}` -> `animate={{ height: 'auto', opacity: 1 }}`)
- Stays open until the user navigates away (no close button needed; it collapses on question transition)

```
  Why do we ask this?  (?)          <-- collapsed

  ┌──────────────────────────────┐
  │ Where your data lives        │  <-- expanded
  │ determines what security     │
  │ measures are needed...       │
  └──────────────────────────────┘
```

### 4.4 Example Text Styling

For questions with `description` fields that contain example text (currently marked by italic markdown or phrases like "For example"), render the example portion with distinct styling:

- Prefix: `text-xs uppercase tracking-wider text-gray-400 font-medium mb-1` reading "Example"
- Example text: `text-sm text-gray-500 italic`
- Container: `mt-2 pl-4 border-l-2 border-gray-200`

**Detection heuristic:** If the description contains "For example" or "e.g.,", split at that phrase and render the example portion separately. This is a progressive enhancement; if no example marker is found, render the description as-is.

### 4.5 Question Type Rendering

The current `DecisionNode.inputType` supports three types. Each renders differently:

#### Single Select (`single_choice`)

- Options render as large clickable cards (see Section 5 for OptionButton redesign)
- Clicking an option immediately advances (no confirmation step)
- Selected state is not shown (instant advance)

#### Multi Select (`multi_choice`)

- Options render as checkable cards with a checkbox indicator on the right
- The "I'm not sure" option (id: `dont-know`) renders at the bottom, visually separated with a `mt-4 pt-4 border-t border-gray-100` divider
- A floating "Continue" button appears at the bottom when at least one option is selected
- The Continue button pulses gently (`animate={{ scale: [1, 1.02, 1] }}` with `repeat: Infinity, duration: 2`) to draw attention

#### Confirmation (`confirmation`)

- Renders with centered text (already has `text-center` when `isResult`)
- Options render as standard buttons rather than cards (smaller, inline layout)
- Primary action (first option) uses `bg-blue text-white` styling
- Secondary actions use `border-2 border-gray-200` outline styling

---

## 5. Option Button Redesign

### 5.1 Current State

The current `OptionButton` is a bordered card (`border-2 border-gray-200 p-5`) with:
- Optional icon in a 40x40 rounded box
- Label as `text-sm font-medium`
- Optional description as `text-xs text-gray-500`
- Stagger animation on mount (0.08s delay per item)

### 5.2 New Design

**Size and spacing:**

| Property | Current | New |
|---|---|---|
| Padding | `p-5` (20px) | `px-6 py-5` (24px horizontal, 20px vertical) |
| Min height | None | `min-h-[64px]` desktop, `min-h-[56px]` mobile |
| Gap between options | `gap-3` (12px) | `gap-3` (12px, unchanged) |
| Border radius | `rounded-lg` (8px) | `rounded-xl` (12px) |
| Border width | `border-2` | `border-2` (unchanged) |

**States:**

| State | Current | New |
|---|---|---|
| Default | `border-gray-200 bg-white` | `border-gray-200 bg-white` (unchanged) |
| Hover | `hover:border-blue hover:shadow-md` | `hover:border-blue/60 hover:bg-blue/[0.02] hover:shadow-sm` (subtler) |
| Focus-visible | None | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2` |
| Selected (multi) | `border-blue bg-blue/5` | `border-blue bg-blue/5 shadow-sm` (add shadow) |
| Active (click) | None | `active:scale-[0.98]` via Tailwind, 100ms transition |

**Keyboard shortcut badges:**

Each option displays a keyboard shortcut badge on the right side. Badges are only shown on desktop (hidden on screens < 768px via `hidden md:flex`).

```
┌───────────────────────────────────────────────────┐
│  [icon]  Label text                          [1]  │
│          Description text                         │
└───────────────────────────────────────────────────┘
```

Badge styling:
- Container: `flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-xs font-mono font-semibold text-gray-500`
- On hover of parent: `group-hover:bg-blue/10 group-hover:text-blue`
- Numbers start at 1 (matching keyboard shortcuts, see Section 6)

**Icon box updates:**

| Property | Current | New |
|---|---|---|
| Size | `h-10 w-10` (40px) | `h-11 w-11` (44px) |
| Border radius | `rounded-lg` | `rounded-xl` |
| Default bg | `bg-sand text-navy` | `bg-gray-100 text-gray-600` |
| Hover bg | `bg-blue text-white` | `bg-blue/10 text-blue` |
| Selected bg | `bg-blue text-white` | `bg-blue text-white` (unchanged) |

### 5.3 Selection Confirmation Animation

When a single-select option is clicked, instead of immediately transitioning, add a brief "selected" flash:

1. The clicked option gets `border-blue bg-blue/5` styling instantly
2. A checkmark icon fades in on the right (replacing the keyboard badge) over 150ms
3. After a 400ms total delay, the question transitions to the next one

This 400ms "dwell time" serves two purposes:
- Confirms to the user which option they picked
- Provides enough time for the exit animation to feel intentional rather than jarring

**Implementation:**

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);

const handleSelect = (optionId: string) => {
  if (isMulti) {
    onToggle(optionId);
    return;
  }
  setSelectedId(optionId);
  setTimeout(() => {
    onSelectOption(optionId);
    setSelectedId(null);
  }, 400);
};
```

The OptionButton receives `isSelected={selectedId === option.id}` for single-select mode as well, enabling the visual feedback.

### 5.4 Mount Stagger Animation

Keep the existing stagger pattern but refine timing:

| Property | Current | New |
|---|---|---|
| Initial state | `opacity: 0, x: -10` | `opacity: 0, y: 12` (vertical to match page direction) |
| Duration | `0.3s` | `0.25s` |
| Delay per item | `0.08s * index` | `0.05s * index` (faster stagger) |
| Max total stagger | Unlimited | Cap at `0.05 * 5 = 0.25s` (options beyond index 5 all appear at 0.25s) |
| Easing | Default | `[0.25, 0.1, 0.25, 1]` (match page transition easing) |

---

## 6. Keyboard Navigation

### 6.1 Key Bindings

| Key | Action | Context |
|---|---|---|
| `1` through `9` | Select option at that index | Any question with options |
| `Enter` / `Return` | Confirm current selection and advance | Multi-select (when selections made) or confirmation screens |
| `Backspace` | Go back to previous question | Any question except the first in a stage |
| `Escape` | Go back to previous question (alias for Backspace) | Same as Backspace |
| `Tab` | Move focus between options | Standard browser focus behavior |
| `Space` | Toggle currently focused option | Standard button activation |

### 6.2 Implementation

Add a `useWizardKeyboard` hook:

```tsx
// src/hooks/use-wizard-keyboard.ts

import { useEffect } from 'react';

interface UseWizardKeyboardOptions {
  optionCount: number;
  onSelectOption: (index: number) => void;
  onConfirm: (() => void) | null;
  onBack: (() => void) | null;
  enabled: boolean;
}

export function useWizardKeyboard({
  optionCount,
  onSelectOption,
  onConfirm,
  onBack,
  enabled,
}: UseWizardKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= Math.min(optionCount, 9)) {
        e.preventDefault();
        onSelectOption(num - 1); // convert to 0-based index
        return;
      }

      if (e.key === 'Enter' && onConfirm) {
        e.preventDefault();
        onConfirm();
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Escape') && onBack) {
        e.preventDefault();
        onBack();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [optionCount, onSelectOption, onConfirm, onBack, enabled]);
}
```

The hook is called in `QuestionCard`. For single-choice questions, `onSelectOption` triggers the option by index. For multi-choice, it toggles the option. `onConfirm` is only non-null for multi-select (triggers the "Continue" action) and confirmations.

### 6.3 Preventing Double-Fires

During the 400ms selection dwell time (Section 5.3), keyboard input must be suppressed. The `enabled` flag is set to `false` during the dwell period:

```tsx
const [isTransitioning, setIsTransitioning] = useState(false);

useWizardKeyboard({
  // ...
  enabled: !isTransitioning,
});

const handleSelect = (optionId: string) => {
  setIsTransitioning(true);
  setSelectedId(optionId);
  setTimeout(() => {
    onSelectOption(optionId);
    setSelectedId(null);
    setIsTransitioning(false);
  }, 400);
};
```

---

## 7. Micro-Animations

### 7.1 Selection Confirmation

When a user selects a single-choice option:

1. **Border color change** (instant): `border-gray-200` -> `border-blue`
2. **Background tint** (instant): `bg-white` -> `bg-blue/5`
3. **Checkmark appear** (150ms fade + scale): A `Check` icon from lucide-react appears at the right side of the option, replacing the keyboard badge
4. **Other options dim** (200ms): Non-selected options get `opacity-40` and `pointer-events-none`
5. **Page transition** begins after 400ms total

Framer Motion for the checkmark:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
>
  <Check className="h-5 w-5 text-blue" />
</motion.div>
```

### 7.2 Section Completion Celebration

When a stage is completed (the last option in the tree leads to `nextNodeId: null` and `completeStage` is called), show a brief celebration before transitioning to the next screen:

1. The final question fades out (standard exit animation)
2. A centered completion message appears:
   - Large checkmark icon in a circle with a spring scale animation: `initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}`
   - Text: "Your Data section complete!" (or "Your Task section complete!")
   - Font: `text-xl font-bold text-navy`
   - Subtitle: `text-sm text-gray-500` reading "Nice work. Moving on..."
3. After 1200ms, auto-navigate to the next step (detail form, next stage, or pipeline)

This celebration screen is a new component: `src/components/wizard/StageCompletionCelebration.tsx`.

**Keep it subtle.** No confetti, no bouncing emojis. Just a clean checkmark with a satisfying spring animation and brief congratulatory text.

### 7.3 Progress Pill Updates

When the progress dots update (a new dot fills in), animate with:

```tsx
<motion.div
  layout
  className="h-1.5 w-1.5 rounded-full bg-blue"
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
/>
```

The `layout` prop ensures smooth repositioning if the pill width changes.

### 7.4 Auto-Advance Timing Summary

| Event | Delay before next action |
|---|---|
| Single-select option clicked | 400ms dwell, then transition |
| Multi-select "Continue" clicked | 0ms (immediate transition) |
| Confirmation option clicked | 200ms dwell, then transition |
| Stage completion celebration | 1200ms display, then navigate |

---

## 8. Conversational Tone Guidelines

### 8.1 Voice and Tone Rules

All question text in the wizard should follow these principles:

1. **Speak like a helpful colleague, not a form.** "Where does your data live?" not "Please specify the data source location."
2. **Use "you" and "your".** "What do you want AI to do with your data?" not "Select the desired AI processing task."
3. **Keep questions under 15 words.** If a question needs more context, put it in the description.
4. **Avoid jargon.** Never use: "protection level", "data classification", "feasibility matrix", "output format specification". Instead use: "access level", "how sensitive the data is", "what works with your data", "how you want to see results".
5. **Use contractions.** "We'll" not "We will". "You're" not "You are". "It's" not "It is".
6. **End with a period or question mark, never an exclamation point** (except in the completion celebration).
7. **Descriptions should start with a lowercase letter** when they continue the thought of the question.

### 8.2 Example Rewrites

The current question text is already fairly conversational. Below are refinements for the questions that could be improved:

| Current | Revised | Notes |
|---|---|---|
| "Where does the data you want to work with live?" | "Where does your data live?" | Shorter, more direct |
| "Select all that apply -- your data might live in more than one place." | "Pick all that apply. Your data might live in more than one place." | Replace em-dash, add period |
| "Let's narrow it down. Do you need to log in to access this data?" | "Do you need to log in to get to this data?" | Shorter; "narrow it down" is meta-commentary |
| "How should the data be prepared before AI processes it?" | "Does your data need any prep work first?" | More casual, shorter |
| "The intended audience affects what the AI can produce and how it should be delivered." | "This helps us figure out the right delivery method." | Avoids "produce" and "delivered" (too formal) |

**Note:** These rewrites are applied by updating the tree data files (`gather-tree.ts`, `refine-tree.ts`, `present-tree.ts`). They are not dynamically transformed; the source of truth for question text remains the tree data.

### 8.3 "Why We Ask" Copy Guidelines

Each hint should:
- Be 1-2 sentences maximum
- Start with a concrete reason, not "This helps us..."
- Mention what the answer affects downstream (without jargon)
- Use the same warm tone as the questions

**Examples:**

| Question | Hint |
|---|---|
| "Where does your data live?" | "Where your data lives determines what tools and approvals you'll need. We want to point you in the right direction from the start." |
| "What do you want AI to do with your data?" | "Different AI tasks work better with different types of data. This helps us recommend the right approach." |
| "Who will see the AI output?" | "A wider audience may require extra safeguards for your data. This helps us check what is feasible." |

---

## 9. Responsive Design

### 9.1 Breakpoints

Use Tailwind's default breakpoints:

| Breakpoint | Width | Behavior |
|---|---|---|
| Default (mobile) | < 768px | Single column, bottom-anchored navigation, no keyboard badges |
| `md` | >= 768px | Centered content, keyboard badges visible, hover states active |
| `lg` | >= 1024px | No additional changes (max-w-2xl already caps content width) |

### 9.2 Mobile-Specific Layout

On mobile (< 768px):

**Content area:**
- Remove vertical centering; use top-aligned with `pt-8 pb-32` (bottom padding accommodates fixed footer)
- Question text: `text-2xl` (smaller than desktop `text-3xl`)
- Options: slightly smaller padding `px-4 py-4` (instead of `px-6 py-5`)

**Fixed bottom navigation bar:**
- Height: `h-16` (64px) plus safe area inset for notched phones
- Background: `bg-white border-t border-gray-200`
- Contains: Back button (left), keyboard hint text (hidden on mobile), Continue button (right, for multi-select/confirmation)
- Position: `fixed bottom-0 left-0 right-0 z-40`
- Safe area: `pb-[env(safe-area-inset-bottom)]`

```
┌───────────────────────────────────────────┐
│ [< Back]                     [Continue >] │
│                safe-area                   │
└───────────────────────────────────────────┘
```

The Back button only appears when `canGoBack` is true. The Continue button only appears for multi-select and confirmation questions.

**Scroll behavior:**
- When a new question appears, `scrollTo({ top: 0, behavior: 'smooth' })` on the overlay container
- Options are always fully visible without horizontal scrolling

### 9.3 Touch vs Mouse Interactions

| Interaction | Mouse (desktop) | Touch (mobile) |
|---|---|---|
| Hover feedback | `hover:border-blue/60` | No hover (`:hover` unreliable on touch) |
| Selection | Click | Tap |
| Keyboard shortcuts | Number keys, Enter, Backspace | Not applicable |
| Active state | `active:scale-[0.98]` (subtle) | `active:scale-[0.97]` (slightly more pronounced for tactile feedback) |
| Back navigation | Backspace key or Back button | Back button or swipe right (stretch goal) |

**Touch target sizes:** All interactive elements must have a minimum touch target of 44x44px (per WCAG 2.5.5). The option buttons already exceed this with `min-h-[56px]` and full width. The Back button in the bottom bar should be at least `h-11 w-20` (44x80px).

---

## 10. Accessibility

### 10.1 ARIA Roles and Labels

**Wizard overlay:**
```tsx
<div
  role="region"
  aria-label={`${stageLabel} wizard - Question ${currentIndex} of ${total}`}
  aria-live="polite"
>
```

**Question text:**
```tsx
<h2 id="wizard-question" className="...">
  {node.question}
</h2>
```

**Options group:**
```tsx
<div
  role="radiogroup"            // single_choice
  // or role="group"           // multi_choice
  aria-labelledby="wizard-question"
  aria-describedby="wizard-description"
>
```

**Individual option buttons:**
```tsx
<button
  role="radio"                    // single_choice
  // or role="checkbox"           // multi_choice
  aria-checked={isSelected}       // multi_choice only
  aria-label={`Option ${index + 1}: ${option.label}`}
  aria-describedby={option.description ? `option-desc-${option.id}` : undefined}
>
```

**Progress pill:**
```tsx
<div
  role="status"
  aria-label={`${stageLabel}: question ${currentIndex} of ${total}, approximately ${timeEstimate} remaining`}
>
```

### 10.2 Screen Reader Behavior

When transitioning between questions:
1. The `aria-live="polite"` region announces the new question text
2. Focus moves to the first option button after the transition animation completes (use `setTimeout` matching animation duration + 50ms buffer)
3. Screen readers announce: "Question 3 of 5: What do you want AI to do with your data? Option 1: Summarize or extract key points. Option 2: Analyze trends and patterns." (via the radiogroup/group semantics)

### 10.3 Focus Management

**On question transition:**
1. After the enter animation completes (350ms), focus the first option button
2. Use `useRef` on the first option and call `.focus()` in a `useEffect` triggered by `currentNode.id` change
3. Add a small delay (`setTimeout(focus, 400)`) to avoid focus racing with animation

**Tab order within a question:**
1. Options (natural DOM order, 1 through N)
2. "Why we ask this" toggle (if present)
3. Continue button (if multi-select/confirmation)
4. Back button

**Back button focus:** When going back, focus the first option button of the previous question (not the previously selected option, because the user may want to change their answer).

### 10.4 Reduced Motion Support

Respect the user's `prefers-reduced-motion` system setting:

```tsx
// src/components/wizard/wizard-variants.ts

export const questionVariantsReduced = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const questionTransitionReduced = {
  duration: 0.15,
};
```

In the WizardMode component:
```tsx
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();
const variants = prefersReducedMotion ? questionVariantsReduced : questionVariants;
const transition = prefersReducedMotion ? questionTransitionReduced : questionTransition;
```

When reduced motion is active:
- Question transitions use simple opacity fade (no y-axis movement)
- Selection confirmation has no scale animation (instant color change)
- Progress dot fill is instant (no spring)
- Stage completion celebration shows for the same duration but without the spring scale
- Option stagger animation is disabled (all appear at once)

---

## 11. Technical Implementation

### 11.1 Files to Modify

| File | Changes |
|---|---|
| `src/components/wizard/WizardMode.tsx` | Major rewrite: full-viewport overlay, AnimatePresence with direction, progress pill integration, keyboard hook, transition state management |
| `src/components/wizard/QuestionCard.tsx` | Typography updates, "Why we ask" hint, selection dwell state, keyboard shortcut integration, responsive adjustments |
| `src/components/wizard/OptionButton.tsx` | Size/spacing updates, keyboard badge, selection animation states, focus-visible ring, active:scale |
| `src/data/gather-tree.ts` | Question text rewrites (see Section 8.2) |
| `src/data/refine-tree.ts` | Question text rewrites |
| `src/data/present-tree.ts` | Question text rewrites (minimal changes needed) |

### 11.2 New Files to Create

| File | Purpose |
|---|---|
| `src/components/wizard/wizard-variants.ts` | Framer Motion variant definitions, transition configs, reduced motion variants |
| `src/components/wizard/WizardProgressPill.tsx` | Floating progress indicator with dots, section label, time estimate |
| `src/components/wizard/StageCompletionCelebration.tsx` | Brief celebration screen shown between stage completion and next navigation |
| `src/components/wizard/WizardBottomBar.tsx` | Mobile-only fixed bottom navigation bar with Back/Continue |
| `src/components/wizard/question-hints.ts` | Static map of node IDs to "Why we ask" hint text |
| `src/hooks/use-wizard-keyboard.ts` | Keyboard event handler hook for number keys, Enter, Backspace, Escape |

### 11.3 Component Tree (After Changes)

```
Stage.tsx
  └── WizardMode (stage)
        ├── [Full-viewport overlay div]
        │     ├── WizardProgressPill (stage, history, currentNodeId)
        │     ├── AnimatePresence mode="wait"
        │     │     └── motion.div (key=currentNode.id)
        │     │           └── QuestionCard (node, onSelect, ...)
        │     │                 ├── h2 (question text)
        │     │                 ├── p (description)
        │     │                 ├── WhyWeAskHint (nodeId)
        │     │                 └── OptionButton[] (options)
        │     │                       ├── Icon box
        │     │                       ├── Label + Description
        │     │                       └── KeyboardBadge | Checkbox | Checkmark
        │     ├── Back button (desktop)
        │     └── Keyboard hint text (desktop)
        ├── WizardBottomBar (mobile: canGoBack, onBack, onContinue)
        └── StageCompletionCelebration (when stage just completed)
```

### 11.4 Framer Motion Configuration

**Dependency:** `framer-motion@^12.34.3` (already installed).

Key Framer Motion features used:

| Feature | Where | Purpose |
|---|---|---|
| `AnimatePresence mode="wait"` | WizardMode | Sequence exit/enter for question transitions |
| `custom` prop | Question motion.div | Pass direction ('forward'/'backward') to variants |
| `layout` | Progress dots | Smooth repositioning when dots count changes |
| `useReducedMotion()` | WizardMode | Detect and respect system motion preference |
| `motion.div` with variants | QuestionCard, OptionButton | Declarative animation definitions |

### 11.5 CSS / Tailwind Changes

**No new Tailwind plugins or config changes needed.** All styling uses existing Tailwind v4 utilities.

New utility classes used (all built-in):

| Class | Purpose |
|---|---|
| `fixed inset-0 top-[57px]` | Full-viewport overlay positioning |
| `backdrop-blur-sm` | Progress pill glass effect |
| `rounded-xl` | Larger border radius for option cards |
| `focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2` | Keyboard focus indicator |
| `active:scale-[0.98]` | Click/tap feedback |
| `pb-[env(safe-area-inset-bottom)]` | iPhone notch safe area |
| `font-mono` | Keyboard shortcut badge |

**Custom CSS additions to `src/index.css`:**

```css
/* Wizard overlay scroll reset */
.wizard-overlay {
  scrollbar-gutter: stable;
}

/* Prevent body scroll when wizard overlay is active */
body:has(.wizard-overlay) {
  overflow: hidden;
}
```

The `body:has()` rule prevents the background page from scrolling while the overlay is open. This has broad browser support (Chrome 105+, Safari 15.4+, Firefox 121+).

### 11.6 Integration with Tree Engine

**No changes to `src/lib/tree-engine.ts`.** The tree engine provides:
- `getStartNode(stage)` -- returns the first node
- `getNodeById(stage, nodeId)` -- returns a specific node
- `classifyProtectionLevel(answers, stage)` -- determines P-level
- `getTreeForStage(stage)` -- returns all nodes (used for progress calculation)

The `useDecisionTree` hook provides:
- `currentNode` -- the node to render
- `selectOption(optionId)` -- advance to next node
- `selectMultipleOptions(optionIds)` -- multi-select advance
- `goBack()` -- return to previous node
- `canGoBack` -- boolean

All of these interfaces remain unchanged. The UX overhaul wraps these in enhanced presentation without modifying the underlying logic.

### 11.7 State Flow Diagram

```
User clicks option
  → QuestionCard sets selectedId (visual feedback)
  → 400ms timeout
  → WizardMode.handleSelect() called
    → directionRef = 'forward'
    → selectOption(optionId) via useDecisionTree
      → recordAnswer() in store
      → pushHistory() in store
      → setCurrentNode(nextNodeId) or completeStage()
  → AnimatePresence detects key change (currentNode.id)
    → Exit animation (350ms)
    → Enter animation (350ms)
  → Focus moves to first option of new question (400ms after enter starts)

User presses Backspace
  → useWizardKeyboard fires onBack
  → WizardMode.handleBack() called
    → directionRef = 'backward'
    → goBack() via useDecisionTree
      → popHistory() in store
      → setCurrentNode(previousNodeId)
  → AnimatePresence detects key change
    → Exit animation (upward, 350ms)
    → Enter animation (downward, 350ms)
```

---

## 12. Dependencies

### External Dependencies
- None. No new npm packages required. All features use existing dependencies (Framer Motion, Tailwind CSS, Lucide React).

### Internal Dependencies (Other Specs)
- **No blockers.** This spec can be implemented independently.
- **Spec 01 (Conversational Data Collection)** may add new questions to the trees. The typeform UX will render them automatically since it reads from the same tree data.
- **Spec 08 (New Questions in Stages)** adds nodes to the trees. Same as above -- new nodes render automatically.
- If a future spec adds new `inputType` values (e.g., `free_text`, `slider`), the QuestionCard component will need new rendering branches (see Section 12.1).

### 12.1 Future Input Type Support

The current `DecisionNode.inputType` only supports `single_choice`, `multi_choice`, and `confirmation`. The brainstorm mentions free text inputs and other types. When those are added:

| Input Type | Rendering Plan |
|---|---|
| `free_text` | Large textarea (`rows={4}`) with placeholder example text, Enter to submit (Shift+Enter for newline), character count indicator |
| `number` | Numeric input with +/- buttons, optional slider, min/max constraints |
| `dropdown` | Native `<select>` on mobile, custom dropdown on desktop |

These are NOT part of this spec. They will be added when the tree data requires them. The QuestionCard component should be structured with a `switch(node.inputType)` to make adding new types straightforward.

---

## 13. Acceptance Criteria

### Core UX
- [ ] Each wizard question (GATHER and REFINE stages) occupies the full viewport below the header
- [ ] The sidebar, breadcrumbs, and stage progress bar are visually hidden during wizard mode
- [ ] Questions transition with directional vertical slide animation (down = forward, up = backward)
- [ ] The transition feels smooth at 60fps on a 2020-era laptop and recent smartphones
- [ ] Going back via the Back button or Backspace key reverses the transition direction

### Progress Pill
- [ ] A floating pill at the top center shows: section name, dot indicators, question count, time estimate
- [ ] Dots fill in with a spring animation as the user progresses
- [ ] Time estimate decreases as the user answers questions
- [ ] Progress pill is visible but unobtrusive (does not compete with question text)

### Option Buttons
- [ ] Options have keyboard shortcut badges (1, 2, 3...) visible on desktop, hidden on mobile
- [ ] Options have a clear focus-visible ring for keyboard navigation
- [ ] Selecting a single-choice option shows a 400ms confirmation state before advancing
- [ ] Non-selected options dim when one is selected (single-choice)
- [ ] Multi-select options show checkboxes and support toggling

### Keyboard Navigation
- [ ] Number keys (1-9) select the corresponding option
- [ ] Enter confirms the multi-select or confirmation choice
- [ ] Backspace and Escape go back to the previous question
- [ ] Keyboard input is disabled during the 400ms selection dwell
- [ ] No keyboard shortcuts fire when the user is typing in a text input

### Micro-Animations
- [ ] Selected option shows border color change + checkmark appear
- [ ] Stage completion shows a brief celebration screen (checkmark + congratulatory text)
- [ ] Celebration screen auto-dismisses after ~1200ms

### Conversational Tone
- [ ] All question text follows the tone guidelines (friendly, short, no jargon)
- [ ] "Why we ask this" hints are available on key questions and expand on click
- [ ] Hint text collapses when navigating to the next question

### Responsive Design
- [ ] On mobile (< 768px), the layout is top-aligned with adequate bottom padding
- [ ] A fixed bottom bar shows Back and Continue buttons on mobile
- [ ] All touch targets are at least 44x44px
- [ ] The wizard is usable in portrait orientation on a 375px-wide screen

### Accessibility
- [ ] Correct ARIA roles: `radiogroup` for single-select, `group` for multi-select
- [ ] `aria-live="polite"` region announces question changes to screen readers
- [ ] Focus moves to the first option after each question transition
- [ ] `prefers-reduced-motion` is respected: animations reduce to simple opacity fades
- [ ] All interactive elements are reachable via Tab key

### Integration
- [ ] No changes to `tree-engine.ts`, `use-decision-tree.ts`, or `session-store.ts`
- [ ] Decision tree data files only change for question text rewrites (no structural changes)
- [ ] The PRESENT stage (OutputPicker flow) is NOT affected by this overhaul
- [ ] The Describe page, Pipeline page, Summary page, Gap Analysis page are NOT affected
- [ ] Existing localStorage session data continues to work (no migration needed)

---

## 14. Implementation Order

Suggested implementation sequence (each step is independently deployable):

1. **Overlay + transitions** (WizardMode rewrite, wizard-variants.ts) -- the foundation
2. **QuestionCard typography + OptionButton redesign** -- visual refresh
3. **Progress pill** (WizardProgressPill.tsx) -- progress visibility
4. **Keyboard navigation** (use-wizard-keyboard.ts) -- power user support
5. **Selection animations + dwell time** -- polish
6. **Mobile bottom bar** (WizardBottomBar.tsx) -- mobile UX
7. **"Why we ask" hints** (question-hints.ts, QuestionCard update) -- context
8. **Stage completion celebration** (StageCompletionCelebration.tsx) -- delight
9. **Accessibility audit** -- ARIA, focus management, reduced motion
10. **Question text rewrites** -- conversational tone refinement
