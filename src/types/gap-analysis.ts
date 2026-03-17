import type { ProtectionLevel } from './decision-tree';

export type GapQuestionPriority = 'critical' | 'nice_to_have';
export type GapQuestionInputType = 'free_text' | 'single_choice' | 'multi_choice';
export type GapQuestionStatus = 'pending' | 'answered' | 'snoozed';

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
