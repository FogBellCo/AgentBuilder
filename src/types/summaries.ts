import type { IntakePayload } from './decision-tree';
import type { GapQuestion } from './gap-analysis';

// --- User-Facing Summary ---

export interface UserSummarySections {
  yourProject: string;
  theData: string;
  whatAIWouldHandle: string;
  howYoudSeeResults: string;
}

export interface UserSummaryState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sections: UserSummarySections | null;
  manualEdits: Record<string, string>;
  errorMessage?: string;
}

// --- Workload Details (for savings calculation) ---

export interface WorkloadDetails {
  taskFrequency: string;   // 'few_times_month' | 'few_times_week' | 'daily' | 'multiple_daily'
  timePerInstance: string;  // 'few_minutes' | 'half_hour' | 'couple_hours' | 'half_day'
  peopleInvolved: string;  // 'just_me' | '2_3_people' | 'small_team' | 'large_group'
}

// --- OSI-Facing Summary (UCSD Intake Format) ---

export interface OSISummary {
  // Process Overview (all AI-generated)
  processOverview: {
    purpose: string;
    description: string;
    keyPoints: string[];          // 3-5 bullets
    potentialImpact: string[];    // 3-5 bullets
    questionsAndConsiderations: string[]; // 3-5 bullets
  };

  // Three-column scoring
  desirability: {
    customerSize: string;
    customerNeed: 'Low' | 'Medium' | 'High';
  };

  viability: {
    processVolume: string;
    potentialSavingsPerCycle: string;
    potentialSavingsPerMonth: string;
  };

  feasibility: {
    alignmentWithExisting: string;
    dataAvailability: string;
    complexity: 'Low' | 'Medium' | 'High';
  };

  // Metadata
  metadata: {
    vcArea: string;
    submittedBy: string;
    onBehalfOf: string;
  };

  // Narrative sections (all AI-generated)
  context: string;
  challenge: string;
  request: string;

  // Savings
  savings: {
    expectedVolume: string;
    timePerInstance: string;
    savingsPercentage: string;
    timeSavings: string;
    impactBullets: string[];
  };
}

// --- Full Export JSON ---

export interface FullExportJSON {
  version: '2.0.0';
  exportedAt: string;
  sessionId: string;

  // Raw intake data
  intake: IntakePayload;

  // User-facing summary (AI-generated sections)
  userSummary: {
    yourProject: string;
    theData: string;
    whatAIWouldHandle: string;
    howYoudSeeResults: string;
    timeSavings: string | null;
    whatsNext: string;
  };

  // OSI-facing summary (UCSD format)
  osiSummary: OSISummary | null;

  // Gap analysis results
  gapAnalysis: {
    questions: GapQuestion[];
    overallAssessment: string;
  };

  // Manual edits the user made
  manualEdits: Record<string, string>;
}
