import type { GapRule, GapRuleState } from '@/types/gap-analysis';

/**
 * Helper to get a nested value from the state via a dot-separated path.
 */
export function getFieldValue(state: GapRuleState, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = state;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function strLen(val: unknown): number {
  if (typeof val === 'string') return val.trim().length;
  return 0;
}

function arrLen(val: unknown): number {
  if (Array.isArray(val)) return val.length;
  return 0;
}

function isNonEmptyStr(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

// Domain dropdown options (from DescribeIdeaForm)
const domainOptions = [
  { id: 'academic-affairs', label: 'Academic Affairs' },
  { id: 'admissions', label: 'Admissions & Enrollment' },
  { id: 'alumni', label: 'Alumni & Advancement' },
  { id: 'facilities', label: 'Facilities & Planning' },
  { id: 'finance', label: 'Finance & Business Services' },
  { id: 'health-sciences', label: 'Health Sciences' },
  { id: 'housing', label: 'Housing & Hospitality' },
  { id: 'hr', label: 'Human Resources' },
  { id: 'it', label: 'Information Technology' },
  { id: 'legal', label: 'Legal & Compliance' },
  { id: 'research', label: 'Research & Innovation' },
  { id: 'student-affairs', label: 'Student Affairs & Services' },
  { id: 'supply-chain', label: 'Supply Chain & Logistics' },
  { id: 'other', label: 'Other' },
];

/**
 * All static gap detection rules from the spec (Section 3.2).
 * These run client-side, instantly, with no API call.
 */
export const gapRules: GapRule[] = [
  // ===========================
  // Project Description Rules
  // ===========================
  {
    id: 'describe-title-short',
    fieldPath: 'projectIdea.title',
    ucsdSection: 'Process Overview: Purpose',
    priority: 'critical',
    completeWhen: (val) => strLen(val) >= 5,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 5,
    followUpQuestion:
      'Your request name is pretty short. Could you give it a more descriptive title so our team knows what it\'s about at a glance?',
    relatedSection: 'project_overview',
    inputType: 'free_text',
  },
  {
    id: 'describe-description-missing',
    fieldPath: 'projectIdea.description',
    ucsdSection: 'Process Overview: Description',
    priority: 'critical',
    completeWhen: (val) => strLen(val) >= 50,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 50,
    followUpQuestion:
      'Can you tell us a bit more about what you\'re trying to build? A couple of sentences about what the AI would actually do would be really helpful.',
    followUpContext: 'The more detail you give here, the faster our team can get started.',
    relatedSection: 'project_overview',
    inputType: 'free_text',
  },
  {
    id: 'describe-description-thin',
    fieldPath: 'projectIdea.description',
    ucsdSection: 'Process Overview: Description',
    priority: 'nice_to_have',
    thinOnly: true,
    completeWhen: (val) => strLen(val) >= 100,
    thinWhen: (val) => strLen(val) >= 50 && strLen(val) < 100,
    followUpQuestion:
      'You gave us a good start on describing what you need. Could you add a bit more detail? For example, what specific problem does this solve, or what does a typical day look like without this tool?',
    relatedSection: 'project_overview',
    inputType: 'free_text',
  },
  {
    id: 'describe-current-process-missing',
    fieldPath: 'projectIdea.currentProcess',
    ucsdSection: 'Context / Challenge',
    priority: 'critical',
    completeWhen: (val) => strLen(val) >= 20,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 20,
    followUpQuestion:
      'How is this work done today? Even a quick description helps -- like "we manually copy data from one spreadsheet to another" or "someone reads through 50 emails and summarizes them."',
    followUpContext: 'Understanding the current process helps us figure out where AI can save the most time.',
    relatedSection: 'project_overview',
    inputType: 'free_text',
  },
  {
    id: 'describe-domain-missing',
    fieldPath: 'projectIdea.domain',
    ucsdSection: 'Metadata: VC Area',
    priority: 'nice_to_have',
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false, // it's a selection, no thin state
    followUpQuestion: 'Which part of campus are you in?',
    relatedSection: 'project_overview',
    inputType: 'single_choice',
    options: domainOptions,
  },
  // ===========================
  // Data Classification Rules
  // ===========================
  {
    id: 'gather-data-type-missing',
    fieldPath: 'gatherDetails.dataType',
    ucsdSection: 'Feasibility: Data Availability',
    priority: 'critical',
    completeWhen: (val) => arrLen(val) >= 1,
    thinWhen: () => false,
    followUpQuestion:
      'What kind of files or data are we talking about? Spreadsheets, PDFs, database records, something else?',
    relatedSection: 'data_classification',
    inputType: 'multi_choice',
    options: [
      { id: 'spreadsheet', label: 'Spreadsheets / CSV files' },
      { id: 'database', label: 'Database / SQL' },
      { id: 'documents', label: 'Documents / PDFs' },
      { id: 'api', label: 'API / Web service' },
      { id: 'images', label: 'Images / Media' },
      { id: 'other', label: 'Something else' },
    ],
  },
  {
    id: 'gather-source-system-missing',
    fieldPath: 'gatherDetails.sourceSystem',
    ucsdSection: 'Context',
    priority: 'critical',
    completeWhen: (val) => strLen(val) >= 3,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 3,
    followUpQuestion:
      'Which systems or tools hold this data? For example, Canvas, ServiceNow, Oracle, a shared drive -- anything you can name helps.',
    followUpContext: 'Knowing the specific system helps us figure out how to connect to it.',
    relatedSection: 'data_classification',
    inputType: 'free_text',
  },
  {
    id: 'gather-data-size-missing',
    fieldPath: 'gatherDetails.dataSize',
    ucsdSection: 'Viability: Process Volume',
    priority: 'nice_to_have',
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
    followUpQuestion: 'Roughly how much data are we talking about?',
    relatedSection: 'data_classification',
    inputType: 'single_choice',
    options: [
      { id: 'small', label: 'A handful of files or a small spreadsheet' },
      { id: 'medium', label: 'Dozens of files or a department-sized dataset' },
      { id: 'large', label: 'Thousands of files or campus-wide data' },
      { id: 'unknown', label: 'Not sure' },
    ],
  },
  {
    id: 'gather-regulatory-missing',
    fieldPath: 'gatherDetails.regulatoryContext',
    ucsdSection: 'Compliance',
    // Priority depends on protection level
    priority: (state: GapRuleState) => {
      const pLevel = state.stages?.GATHER?.result?.protectionLevel ?? 'P1';
      return pLevel === 'P1' ? 'nice_to_have' : 'critical';
    },
    completeWhen: (val) => arrLen(val) >= 1,
    thinWhen: () => false,
    followUpQuestion:
      'Does any of this data involve student records, health information, financial data, or export-controlled research?',
    followUpContext: 'This helps us make sure we handle everything properly.',
    relatedSection: 'compliance',
    inputType: 'multi_choice',
    options: [
      { id: 'ferpa', label: 'Student records (FERPA)' },
      { id: 'hipaa', label: 'Health or medical data (HIPAA)' },
      { id: 'export-control', label: 'Export-controlled research' },
      { id: 'financial-compliance', label: 'Financial audit requirements' },
      { id: 'none', label: 'None of these' },
    ],
  },

  // ===========================
  // AI Processing Rules
  // ===========================
  {
    id: 'refine-no-refinements',
    fieldPath: 'refineDetails.refinements',
    ucsdSection: 'Process Overview: AI Solution',
    priority: 'critical',
    completeWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.length >= 1 && val.some((r: { taskType?: string }) => isNonEmptyStr(r?.taskType));
    },
    thinWhen: (val) => {
      if (!Array.isArray(val)) return true;
      return val.length === 0 || val.every((r: { taskType?: string }) => !isNonEmptyStr(r?.taskType));
    },
    followUpQuestion:
      'What specifically would you like AI to do with the data? For example: summarize it, find patterns, sort things into categories, answer questions about it?',
    relatedSection: 'ai_processing',
    inputType: 'free_text',
  },
  {
    id: 'refine-task-description-missing',
    fieldPath: 'refineDetails.refinements',
    ucsdSection: 'Process Overview: Key Points',
    priority: 'critical',
    completeWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.some((r: { description?: string }) => strLen(r?.description) >= 10);
    },
    thinWhen: (val) => {
      if (!Array.isArray(val)) return false;
      // Has refinements but descriptions are all too short
      return val.length > 0 && val.every((r: { description?: string }) => strLen(r?.description) < 10);
    },
    followUpQuestion: (state: GapRuleState) => {
      // Reference what the user chose as their AI task
      const taskAnswer = state.stages?.REFINE?.result?.answers?.['refine-task'] ?? '';
      const taskLabel = taskAnswer || 'process';
      return `You said you want AI to ${taskLabel} your data. Can you give us a quick example of what that looks like? Like, "I want it to read through course evaluations and pull out the top 3 themes."`;
    },
    followUpContext: 'A concrete example helps our team build exactly what you need.',
    relatedSection: 'ai_processing',
    inputType: 'free_text',
  },
  {
    id: 'refine-audience-broad-no-detail',
    fieldPath: 'projectIdea.description',
    ucsdSection: 'Desirability',
    priority: 'nice_to_have',
    completeWhen: (val, state) => {
      const audience = state.stages?.REFINE?.result?.answers?.['refine-audience'] ?? '';
      const isBroadAudience = audience === 'campus-wide' || audience === 'public-external';
      if (!isBroadAudience) return true; // Rule doesn't apply
      return strLen(val) >= 100;
    },
    thinWhen: (val, state) => {
      const audience = state.stages?.REFINE?.result?.answers?.['refine-audience'] ?? '';
      const isBroadAudience = audience === 'campus-wide' || audience === 'public-external';
      if (!isBroadAudience) return false;
      return strLen(val) < 100;
    },
    followUpQuestion: (state: GapRuleState) => {
      const audience = state.stages?.REFINE?.result?.answers?.['refine-audience'] ?? '';
      const audienceLabel = audience === 'public-external'
        ? 'people outside UCSD'
        : 'a wide audience';
      return `You mentioned this would be used by ${audienceLabel}. Can you tell us a bit more about who specifically would use it and what they'd do with the results?`;
    },
    relatedSection: 'ai_processing',
    inputType: 'free_text',
  },

  // ===========================
  // Output & Delivery Rules
  // ===========================
  {
    id: 'present-output-description-missing',
    fieldPath: 'presentDetails.outputs',
    ucsdSection: 'Process Overview: Description',
    priority: 'nice_to_have',
    completeWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.some((o: { description?: string }) => strLen(o?.description) >= 10);
    },
    thinWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.length > 0 && val.every((o: { description?: string }) => strLen(o?.description) < 10);
    },
    followUpQuestion: (state: GapRuleState) => {
      const outputFormat = state.stages?.PRESENT?.result?.outputFormat ?? '';
      const formatLabel = outputFormat || 'your chosen output format';
      return `You chose ${formatLabel} as your output format. Can you describe what you'd want it to look like or do? For example, "A chat where my team can ask questions about our policies" or "A dashboard showing monthly trends."`;
    },
    relatedSection: 'output_deliverables',
    inputType: 'free_text',
  },
  {
    id: 'present-conditional-no-plan',
    fieldPath: 'presentDetails.outputs',
    ucsdSection: 'Feasibility',
    priority: 'critical',
    completeWhen: (val, state) => {
      if (!Array.isArray(val)) return true; // No outputs, different rule handles that
      const hasConditional = val.some(
        (o: { feasibility?: { feasibility?: string } }) =>
          o?.feasibility?.feasibility === 'allowed_with_conditions',
      );
      if (!hasConditional) return true; // No conditional outputs
      // Has conditional AND has additional context
      return strLen(state.refineDetails?.additionalContext) > 0;
    },
    thinWhen: () => false,
    followUpQuestion: (state: GapRuleState) => {
      const outputs = state.presentDetails?.outputs ?? [];
      const conditional = outputs.find(
        (o) => o.feasibility?.feasibility === 'allowed_with_conditions',
      );
      const condition = conditional?.feasibility?.conditions ?? 'some conditions for your data type';
      return `The output format you chose has some conditions: ${condition}. Is that something your team can handle, or would you like to explore a different format?`;
    },
    relatedSection: 'output_deliverables',
    inputType: 'single_choice',
    options: [
      { id: 'can-handle', label: 'Yes, we can work with that' },
      { id: 'need-help', label: 'We might need help with that' },
      { id: 'different-format', label: 'Let me pick a different format' },
    ],
  },
];

/**
 * A special cross-field rule for regulatory/protection level contradictions.
 * This rule doesn't fit the standard single-field pattern, so it's evaluated separately.
 */
export function detectRegulatoryContradiction(state: GapRuleState): GapRule | null {
  const regulatoryContext = state.gatherDetails?.regulatoryContext ?? [];
  const protectionLevel = state.stages?.GATHER?.result?.protectionLevel ?? 'P1';

  if (protectionLevel !== 'P1') return null;

  const hasFerpa = regulatoryContext.includes('ferpa');
  const hasHipaa = regulatoryContext.includes('hipaa');

  if (!hasFerpa && !hasHipaa) return null;

  const dataTypeLabel = hasFerpa && hasHipaa
    ? 'student records and health data'
    : hasFerpa
      ? 'student records'
      : 'health data';

  return {
    id: 'gather-regulatory-contradicts-plevel',
    fieldPath: 'gatherDetails.regulatoryContext',
    ucsdSection: 'Compliance',
    priority: 'critical',
    completeWhen: () => false, // This is always a gap until resolved
    thinWhen: () => false,
    followUpQuestion: `You mentioned this involves ${dataTypeLabel}, but earlier you classified the data as public. Could you help us understand -- is the data you'd actually feed to AI already de-identified, or does it still contain personal information?`,
    relatedSection: 'compliance',
    inputType: 'free_text',
  };
}
