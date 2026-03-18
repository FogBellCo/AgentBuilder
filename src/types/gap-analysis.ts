import type { ProtectionLevel } from './decision-tree';

export type GapQuestionPriority = 'critical' | 'nice_to_have';
export type GapQuestionInputType = 'free_text' | 'single_choice' | 'multi_choice';
export type GapQuestionStatus = 'pending' | 'answered' | 'snoozed';
export type ReadinessLabel = 'ready' | 'almost' | 'needs_work';

export type GapRelatedSection =
  | 'project_overview'
  | 'data_classification'
  | 'ai_processing'
  | 'output_deliverables'
  | 'compliance';

export interface GapQuestionOption {
  id: string;
  label: string;
}

export interface GapQuestion {
  id: string;
  priority: GapQuestionPriority;
  question: string;
  context?: string;
  inputType: GapQuestionInputType;
  options?: GapQuestionOption[];
  relatedSection: GapRelatedSection;
  relatedField?: string;
  status: GapQuestionStatus;
  answer?: string;           // free-text answer
  selectedOptions?: string[]; // selected option IDs for choice questions
  snoozedAt?: string;        // ISO timestamp when snoozed
  answeredAt?: string;       // ISO timestamp when answered
}

export interface Reclassification {
  currentLevel: ProtectionLevel;
  suggestedLevel: ProtectionLevel;
  reason: string;
}

export interface GapAnalysisState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  questions: GapQuestion[];
  overallAssessment: string;
  reclassification?: Reclassification;
  errorMessage?: string;
  runCount: number; // how many times gap analysis has been run this session
  completenessScore: number;           // 0-100, calculated from field presence + AI assessment
  readinessLabel: ReadinessLabel;
  lastAnalyzedAt: string | null;       // ISO timestamp of last analysis
  staticGaps: GapQuestion[];           // client-side static gap questions (before AI)
}

export interface AISummaryState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sections: {
    executiveSummary: string;
    projectOverview: string;
    dataClassification: string;
    aiProcessingPlan: string;
    outputDeliverables: string;
    feasibilitySummary: string;
    complianceAndNextSteps: string;
  } | null;
  manualEdits: Record<string, string>; // sectionKey -> edited content
  errorMessage?: string;
}

/**
 * A gap rule definition for static client-side gap detection.
 * Each rule checks a single field and produces a follow-up question if the field is missing or thin.
 */
export interface GapRule {
  id: string;
  fieldPath: string;
  ucsdSection: string; // internal mapping, never shown to user
  priority: GapQuestionPriority | ((state: GapRuleState) => GapQuestionPriority);
  completeWhen: (value: unknown, state: GapRuleState) => boolean;
  thinWhen: (value: unknown, state: GapRuleState) => boolean;
  /** Set to true when the rule should only fire when the field is thin (partial credit), not completely missing */
  thinOnly?: boolean;
  followUpQuestion: string | ((state: GapRuleState) => string);
  followUpContext?: string;
  relatedSection: GapRelatedSection;
  inputType: GapQuestionInputType;
  options?: GapQuestionOption[];
}

/**
 * Snapshot of store fields needed by gap rules to evaluate conditions.
 */
export interface GapRuleState {
  projectIdea: {
    title: string;
    description: string;
    domain: string;
    currentProcess: string;
  } | null;
  gatherDetails: {
    dataType: string[];
    sourceSystem: string;
    dataSize: string;
    additionalNotes: string;
    regulatoryContext: string[];
  } | null;
  refineDetails: {
    refinements: Array<{ id: string; taskType: string; description: string; dataPrep: string }>;
    additionalContext: string;
  } | null;
  presentDetails: {
    outputs: Array<{
      format: string;
      description: string;
      feasibility: { feasibility: string; conditions?: string };
    }>;
  } | null;
  stages: {
    GATHER: { status: string; result?: { protectionLevel: string; answers: Record<string, string> } };
    REFINE: { status: string; result?: { answers: Record<string, string> } };
    PRESENT: { status: string; result?: { outputFormat?: string; answers: Record<string, string> } };
  };
}
