import { z } from 'zod';

// --- Gap Analysis Response Schema ---

export const GapQuestionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const GapQuestionSchema = z.object({
  id: z.string().describe('Unique question identifier, e.g. gap-q-1'),
  priority: z.enum(['critical', 'nice_to_have']),
  question: z.string().describe('The follow-up question to ask the user'),
  context: z
    .string()
    .optional()
    .describe(
      'Why this question was generated — what gap or contradiction was detected'
    ),
  inputType: z.enum(['free_text', 'single_choice', 'multi_choice']),
  options: z
    .array(GapQuestionOptionSchema)
    .optional()
    .describe(
      'Only present when inputType is single_choice or multi_choice'
    ),
  relatedSection: z
    .enum([
      'project_overview',
      'data_classification',
      'ai_processing',
      'output_deliverables',
      'compliance',
    ])
    .describe('Which summary section this question relates to'),
  relatedField: z
    .string()
    .optional()
    .describe(
      'The specific IntakePayload field this question aims to fill, e.g. "projectIdea.currentProcess"'
    ),
});

export const ReclassificationSchema = z.object({
  currentLevel: z.enum(['P1', 'P2', 'P3', 'P4']),
  suggestedLevel: z.enum(['P1', 'P2', 'P3', 'P4']),
  reason: z.string(),
});

export const GapAnalysisResponseSchema = z.object({
  questions: z.array(GapQuestionSchema).max(20),
  overallAssessment: z
    .string()
    .describe(
      '1-2 sentence overall assessment of submission completeness'
    ),
  reclassification: ReclassificationSchema.optional(),
});

// --- Summary Response Schema ---

export const SummarySectionSchema = z.object({
  executiveSummary: z.string(),
  projectOverview: z.string(),
  dataClassification: z.string(),
  aiProcessingPlan: z.string(),
  outputDeliverables: z.string(),
  feasibilitySummary: z
    .string()
    .describe('Markdown table of format x protection level'),
  complianceAndNextSteps: z.string(),
});

export const SummaryResponseSchema = z.object({
  sections: SummarySectionSchema,
  reclassification: ReclassificationSchema.optional(),
});

// --- Inferred TypeScript Types ---

export type GapQuestionOption = z.infer<typeof GapQuestionOptionSchema>;
export type GapQuestion = z.infer<typeof GapQuestionSchema>;
export type Reclassification = z.infer<typeof ReclassificationSchema>;
export type GapAnalysisResponse = z.infer<typeof GapAnalysisResponseSchema>;
export type SummarySection = z.infer<typeof SummarySectionSchema>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
