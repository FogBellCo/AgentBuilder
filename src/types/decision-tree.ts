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
  | 'knowledge_base'
  | 'workflow_automation'
  | 'system_integration'
  | 'embedded_widget';

export type Feasibility = 'allowed' | 'allowed_with_conditions' | 'not_allowed';

export interface DecisionNode {
  id: string;
  stage: Stage;
  question: string;
  description?: string;
  inputType: 'single_choice' | 'multi_choice' | 'confirmation' | 'free_text';
  options: DecisionOption[];
  classifiesProtectionLevel?: boolean;
  // Fields for free_text nodes:
  placeholder?: string;
  maxLength?: number;
  skippable?: boolean;
  nextNodeId?: string | null; // For free_text nodes: where to go after text is submitted
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
  currentProcess: string;
}

export interface GatherDetails {
  dataType: string[];
  sourceSystem: string;
  dataSize: string;
  additionalNotes: string;
  regulatoryContext: string[];
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
    selectedDataSources: Array<{ level: string; label: string }>;
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
  conversationalAnswers?: ConversationalAnswers;
  derivedValues?: DerivedIntakeValues;
}

/** Answers to the new conversational questions woven throughout the wizard */
export interface ConversationalAnswers {
  // Describe stage -- team & context
  teamWho: string;                // Q-D1
  whyNow: string[];               // Q-D2 (multi-select IDs)
  consequences: string;           // Q-D3

  // Describe stage -- workload
  workloadFrequency: string;      // Q-W1 (option ID)
  workloadDuration: string;       // Q-W2 (option ID)
  workloadPeople: string;         // Q-W3 (option ID)
  workloadPainPoint: string;      // Q-W4

  // Describe stage -- context
  currentTools: string[];         // Q-C1 (multi-select IDs)
  currentToolsOther: string;      // Q-C1 "Other" free text
  magicWand: string;              // Q-C2

  // Metadata (summary page)
  onBehalf: 'self' | 'other' | ''; // Q-M1 selection
  onBehalfName: string;            // Q-M1 conditional text
  tritonGPT: string;              // Q-M2 (option ID)
}

/** Auto-calculated values derived from conversational answers */
export interface DerivedIntakeValues {
  // Savings
  monthlyHoursTotal: number;
  monthlySavings: number;
  annualSavings: number;
  expectedVolumePerYear: number;
  hoursPerInstance: number;
  savingsPerInstance: number;

  // UCSD format fields
  customerSize: string;     // "One department" | "Multiple departments" | "Multiple VC areas" | "Campus"
  customerNeed: string;     // "Low" | "Medium" | "High"
  processVolume: string;    // "<100 per month" | "100-1000 per month" | ">1000 per month"
  savingsPerCycle: string;  // "<15 min" | "15 min - 1 hour" | ">1 hour"
  savingsPerMonth: string;  // "<1 hour" | "1 - 200 hours" | ">200 hours"
  alignment: string;        // "Add-on to existing TGPT tool" | "New TGPT tool" | "New tool (non-TGPT)"
  dataAvailability: string; // "Readily available" | "Requires new integration" | "Requires new data source"
  complexity: string;       // "Low" | "Medium" | "High"
}
