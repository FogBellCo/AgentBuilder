/**
 * Static lookup map of node IDs → "Why we ask this" hint text.
 * Used by QuestionCard to show collapsible contextual hints.
 */
export const questionHints: Record<string, string> = {
  'gather-start':
    'Where your data lives determines what tools and approvals you\'ll need. We want to point you in the right direction from the start.',
  'gather-help-classify':
    'Different access levels have different rules for AI tools. We want to make sure we guide you correctly.',
  'refine-task':
    'Different AI tasks work better with different types of data. This helps us recommend the right approach.',
  'refine-transform':
    'Some data needs cleaning or filtering before AI can work with it safely. This helps us plan the right pipeline.',
  'refine-audience':
    'A wider audience may require extra safeguards for your data. This helps us check what\'s feasible.',
  'present-format':
    'Different output formats have different feasibility depending on your data\'s access level.',
  'gather-daily-tools':
    'Knowing your current systems helps us plan how the AI tool will fit into your workflow and what integrations may be needed.',
  'gather-data-frequency':
    'This helps us understand how your data flows and whether AI should run continuously or on a schedule.',
  'gather-data-expert':
    'Having a go-to person who understands the data makes integration smoother and helps us plan for knowledge transfer.',
  'refine-walkthrough':
    'Understanding your current process step-by-step helps us identify where AI can add the most value.',
  'refine-result-audience':
    'Knowing who uses the output helps us ensure the AI solution serves the right people in the right way.',
  'refine-approval':
    'If outputs need review before sharing, we need to build that into the workflow design.',
  'present-urgency':
    'This helps us decide whether the AI should work in real-time, on a schedule, or on demand.',
  'present-cross-dept':
    'If other departments could use this too, it might change how we build and deploy the solution.',
};
