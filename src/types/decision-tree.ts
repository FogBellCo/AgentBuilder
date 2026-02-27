export type ProtectionLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type Stage = 'GATHER' | 'REFINE' | 'PRESENT';

export type StageStatus = 'not_started' | 'in_progress' | 'complete';

export type OutputFormat =
  | 'chat'
  | 'dashboard'
  | 'static_report'
  | 'interactive_app'
  | 'email_digest'
  | 'slide_deck'
  | 'api_feed'
  | 'smart_alerts'
  | 'knowledge_base';

export type Feasibility = 'allowed' | 'allowed_with_conditions' | 'not_allowed';

export interface DecisionNode {
  id: string;
  stage: Stage;
  question: string;
  description?: string;
  inputType: 'single_choice' | 'multi_choice' | 'confirmation';
  options: DecisionOption[];
  classifiesProtectionLevel?: boolean;
}

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  mapsToProtectionLevel?: ProtectionLevel;
  nextNodeId: string | null;
}

export interface StageResult {
  stage: Stage;
  protectionLevel: ProtectionLevel;
  answers: Record<string, string>;
  outputFormat?: OutputFormat;
}

export interface UserSession {
  id: string;
  stages: Record<Stage, { status: StageStatus; result?: StageResult }>;
  currentStage?: Stage;
  currentNodeId?: string;
  history: Array<{ stage: Stage; nodeId: string }>;
}

export interface ProtectionLevelInfo {
  level: ProtectionLevel;
  label: string;
  tagline: string;
  description: string;
  requirement: string;
  examples: string[];
  color: string;
}

export interface OutputFormatInfo {
  format: OutputFormat;
  label: string;
  description: string;
  icon: string;
  technicalOnly?: boolean;
}

export interface FeasibilityResult {
  feasibility: Feasibility;
  conditions?: string;
  alternativeSuggestion?: OutputFormat;
}

export interface StageInfo {
  stage: Stage;
  label: string;
  tagline: string;
  description: string;
  icon: string;
}

// --- Enhanced intake types ---

export interface ProjectIdea {
  title: string;
  description: string;
  domain: string;
  timeline: string;
}

export interface GatherDetails {
  dataType: string[];
  sourceSystem: string;
  dataSize: string;
  additionalNotes: string;
}

export interface Refinement {
  id: string;
  taskType: string;
  description: string;
  dataPrep: string;
}

export interface RefineDetails {
  refinements: Refinement[];
  additionalContext: string;
}

export interface OutputSelection {
  format: OutputFormat;
  description: string;
  feasibility: FeasibilityResult;
}

export interface PresentDetails {
  outputs: OutputSelection[];
}

export interface IntakePayload {
  version: string;
  generatedAt: string;
  sessionId: string;
  projectIdea: ProjectIdea;
  gather: {
    protectionLevel: ProtectionLevel;
    protectionLevelLabel: string;
    details: GatherDetails;
  };
  refine: {
    refinements: Refinement[];
    audience: string;
    additionalContext: string;
  };
  present: {
    outputs: Array<{
      format: OutputFormat;
      formatLabel: string;
      description: string;
      feasibility: Feasibility;
      conditions?: string;
    }>;
  };
  nextSteps: string[];
}
