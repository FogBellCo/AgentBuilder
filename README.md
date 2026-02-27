# UCSD AgentBuilder — AI Workflow Guide

A guided decision tree tool that helps non-technical UCSD business users navigate the **GATHER > REFINE > PRESENT** workflow for AI-enabled data processing, while respecting UC data classification levels (P1–P4).

## Architecture

**Zoom-in approach** for progressive disclosure:

- **Level 0** — Landing page with one-sentence explanation and "Get Started"
- **Level 1** — Pipeline view: three interactive stage nodes (React Flow)
- **Level 2** — Guided wizard: one question at a time per stage
- **Level 3** — Guidance pages: actionable instructions per protection level

## The Three Stages

| Stage | Purpose | Key Questions |
|-------|---------|---------------|
| **Gather** | Classify data source and protection level | Where does your data live? What access does it require? |
| **Refine** | Define AI task, data prep, and audience | What should AI do? How to prepare data? Who sees the output? |
| **Present** | Choose output format and check feasibility | Chat? Dashboard? Report? Is it compatible with your data level? |

## Data Classification (UC Policy)

| Level | Label | Access |
|-------|-------|--------|
| P1 | Public | Freely allowed |
| P2 | Internal | Requires UCSD SSO |
| P3 | Confidential | Requires API key / special authorization |
| P4 | Restricted | AI use not permitted |

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (UCSD brand colors, Swiss/International typography)
- React Flow (@xyflow/react) for pipeline visualization
- Zustand for state management
- Framer Motion for transitions
- Roboto (UCSD web alternate for Brix Sans)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
