# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UCSD AgentBuilder — a guided decision-tree tool helping non-technical UCSD business users plan AI workflows through a **GATHER > REFINE > PRESENT** pipeline, while respecting UC data classification levels (P1–P4).

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint (TS, React Hooks, React Refresh)
npm run preview   # Preview production build locally
```

No test framework is configured. There are no test files.

## Architecture

### Tech Stack
React 19, TypeScript, Vite 7, Tailwind CSS v4 (UCSD brand colors), Zustand, React Flow (@xyflow/react), Framer Motion, React Router v7 (HashRouter).

### Path Alias
`@` maps to `./src` (configured in both vite.config.ts and tsconfig.app.json).

### TypeScript Strictness
Strict mode with `noUnusedLocals` and `noUnusedParameters` enabled — unused variables/params will fail the build. Use `_` prefix for intentionally unused parameters.

### Deployment
GitHub Pages with base path `/AgentBuilder/`. Uses HashRouter (not BrowserRouter) because GitHub Pages doesn't support SPA fallback routing. CI builds run on pushes to `main`, `master`, and `claude/**` branches, but only deploys to Pages from main/master.

### Routing & User Flow
Progressive disclosure through 6 pages:

1. **`/`** Landing — one-sentence intro, "Get Started"
2. **`/describe`** — project idea intake form (title, description, domain, timeline)
3. **`/pipeline`** — React Flow visualization of three stage nodes with status
4. **`/stage/:stageId`** — wizard for GATHER, REFINE, or PRESENT (one question at a time)
5. **`/guidance/:guidanceId`** — protection-level-specific guidance pages (p1–p4)
6. **`/summary`** — complete workflow summary with JSON export

### Decision Tree Engine (`src/lib/tree-engine.ts`)
Core logic driving the stage wizards. Each stage (GATHER/REFINE/PRESENT) has its own tree defined in `src/data/`. Trees are arrays of `DecisionNode` objects with options that link to the next node via `nextNodeId`. Nodes with `classifiesProtectionLevel: true` contribute to the highest-wins protection level classification. The `useDecisionTree` hook (`src/hooks/use-decision-tree.ts`) wraps the engine for component use.

### Data Classification
UC policy protection levels P1 (Public) → P4 (Restricted). P4 prohibits AI use. The Gather stage determines the data's protection level, which propagates to constrain the Present stage via the feasibility matrix (`src/data/feasibility-matrix.ts`) — a mapping of output formats × 4 protection levels → allowed/conditional/not_allowed.

### State Management (`src/store/session-store.ts`)
Single Zustand store (`useSessionStore`) with `persist` middleware (localStorage key: `ucsd-agentbuilder-session`). Tracks session ID, stage statuses, current node, navigation history, stage answers, and per-stage detail objects (projectIdea, gatherDetails, refineDetails, presentDetails). Store has versioned migration (currently v3) — bump the version and add a migration function when changing the store schema.

### Key Patterns
- **Components** live in `src/components/` organized by feature area (landing, describe, gather, refine, present, summary, guidance, layout, pipeline, wizard)
- **Wizard components** (`src/components/wizard/`) are shared across all three stages — QuestionCard, OptionButton, WizardMode, ClassificationResult
- **Decision tree data** files (`gather-tree.ts`, `refine-tree.ts`, `present-tree.ts`) define the wizard question flows — edit these to change questions/options
- **Detail forms** (`GatherDetailForm`, `RefineDetailForm`) collect additional structured data after the wizard completes for each stage
- **Guidance content** lives in `src/data/guidance/` as markdown strings per protection level
- **Framer Motion** page transitions use `AnimatePresence` with consistent enter/exit animations
- **`clsx` + `tailwind-merge`** via `cn()` utility in `src/lib/utils.ts` for conditional class merging
- **Summary export** (`src/lib/summary-formatter.ts`) builds an `IntakePayload` JSON object combining all stage data for download

## System Overview Document

A comprehensive `SYSTEM-OVERVIEW.md` exists at the project root. It documents every feature, data flow, component, API endpoint, type, and architectural decision in the system. **Whenever you make changes that affect the system's behavior, features, types, routes, API endpoints, store shape, decision trees, or component structure, you must update `SYSTEM-OVERVIEW.md` to reflect those changes.** Keep the document accurate and in sync with the codebase.
