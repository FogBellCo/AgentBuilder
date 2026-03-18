import type {
  ConversationalAnswers,
  DerivedIntakeValues,
  ProjectIdea,
  GatherDetails,
  PresentDetails,
} from '@/types/decision-tree';

// --- Constants ---

export const FREQUENCY_MAP: Record<string, number> = {
  few_monthly: 4,
  few_weekly: 12,
  daily: 22,
  multiple_daily: 60,
};

export const DURATION_MAP: Record<string, number> = {
  few_minutes: 0.1,
  half_hour: 0.5,
  couple_hours: 2,
  half_day: 4,
};

export const PEOPLE_MAP: Record<string, number> = {
  just_me: 1,
  two_three: 2,
  small_team: 4,
  large_group: 10,
};

export const AI_SAVINGS_PERCENTAGE = 0.80;

// --- Savings Calculation (Section 4.1) ---

export function calculateSavings(
  frequency: string,
  duration: string,
  people: string,
) {
  const monthlyOccurrences = FREQUENCY_MAP[frequency] ?? 0;
  const hoursPerOccurrence = DURATION_MAP[duration] ?? 0;
  const peopleMultiplier = PEOPLE_MAP[people] ?? 1;

  const monthlyHoursTotal = monthlyOccurrences * hoursPerOccurrence * peopleMultiplier;
  const monthlySavings = Math.round(monthlyHoursTotal * AI_SAVINGS_PERCENTAGE);
  const annualSavings = monthlySavings * 12;

  return {
    monthlyHoursTotal: Math.round(monthlyHoursTotal),
    monthlySavings,
    annualSavings,
    expectedVolumePerYear: monthlyOccurrences * 12,
    hoursPerInstance: hoursPerOccurrence,
    savingsPerInstance: Math.round(hoursPerOccurrence * AI_SAVINGS_PERCENTAGE * 10) / 10,
  };
}

// --- Customer Size Derivation (Section 4.2) ---

export function deriveCustomerSize(
  crossDept: string,
  resultAudience: string[],
  _people: string,
): string {
  if (crossDept === 'whole_campus') return 'Campus';
  if (crossDept === 'many_teams') return 'Multiple VC areas';
  if (crossDept === 'few_others') return 'Multiple departments';

  if (resultAudience.includes('students') || resultAudience.includes('external'))
    return 'Multiple VC areas';
  if (resultAudience.includes('other_depts') || resultAudience.includes('leadership'))
    return 'Multiple departments';

  return 'One department';
}

// --- Customer Need Derivation (Section 4.3) ---

export function deriveCustomerNeed(
  whyNow: string[],
  consequences: string,
  frequency: string,
): 'Low' | 'Medium' | 'High' {
  let score = 0;

  if (whyNow.includes('volume_up')) score += 2;
  if (whyNow.includes('losing_staff')) score += 3;
  if (whyNow.includes('new_policy')) score += 3;
  if (whyNow.includes('leadership')) score += 2;
  if (whyNow.includes('improve')) score += 1;

  if (consequences.trim().length > 20) score += 2;

  if (frequency === 'multiple_daily') score += 2;
  if (frequency === 'daily') score += 1;

  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

// --- Alignment Derivation (Section 4.4) ---

export function deriveAlignment(
  tritonGPT: string,
): string {
  if (tritonGPT === 'use_it') return 'New TGPT tool';
  if (tritonGPT === 'heard_of') return 'New TGPT tool';

  return 'New TGPT tool';
}

// --- Data Availability Derivation (Section 4.5) ---

export function deriveDataAvailability(
  dailyTools: string[],
  dataFrequency: string,
  dataExpert: string,
  sourceSystem: string,
): string {
  let accessScore = 0;

  const knownSystems = ['canvas', 'servicenow', 'oracle', 'concur', 'box', 'excel'];
  const knownCount = dailyTools.filter((t) => knownSystems.includes(t)).length;
  if (knownCount > 0) accessScore += 2;

  if (sourceSystem.trim().length > 0) accessScore += 1;

  if (dataExpert === 'yes_me' || dataExpert === 'yes_someone') accessScore += 1;

  if (dataFrequency !== 'not_sure') accessScore += 1;

  if (dailyTools.includes('custom-app') || dailyTools.includes('other-system'))
    accessScore -= 1;

  if (accessScore >= 3) return 'Readily available';
  if (accessScore >= 1) return 'Requires new integration';
  return 'Requires new data source';
}

// --- Complexity Derivation (Section 4.6) ---

export function deriveComplexity(
  protectionLevel: string,
  dailyTools: string[],
  dataPrep: string,
  approval: string,
  urgency: string,
  outputFormatCount: number,
): 'Low' | 'Medium' | 'High' {
  let score = 0;

  if (protectionLevel === 'P3') score += 3;
  if (protectionLevel === 'P2') score += 1;

  if (dailyTools.length >= 4) score += 3;
  else if (dailyTools.length >= 2) score += 1;

  if (dataPrep === 'combine') score += 2;
  if (dataPrep === 'deidentify') score += 2;

  if (approval === 'always') score += 1;

  if (urgency === 'realtime') score += 2;

  if (outputFormatCount >= 3) score += 2;
  else if (outputFormatCount >= 2) score += 1;

  if (score >= 7) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

// --- Process Volume Derivation (Section 4.7) ---

export function deriveProcessVolume(frequency: string, people: string): string {
  const monthly = (FREQUENCY_MAP[frequency] ?? 0) * (PEOPLE_MAP[people] ?? 1);
  if (monthly > 1000) return '>1000 per month';
  if (monthly >= 100) return '100-1000 per month';
  return '<100 per month';
}

// --- Savings Per Cycle Derivation (Section 4.8) ---

export function deriveSavingsPerCycle(duration: string): string {
  const hours = DURATION_MAP[duration] ?? 0;
  const savingsHours = hours * AI_SAVINGS_PERCENTAGE;
  if (savingsHours < 0.25) return '<15 min';
  if (savingsHours <= 1) return '15 min - 1 hour';
  return '>1 hour';
}

// --- Savings Per Month Derivation (Section 9) ---

export function deriveSavingsPerMonth(
  frequency: string,
  duration: string,
  people: string,
): string {
  const monthlyOccurrences = FREQUENCY_MAP[frequency] ?? 0;
  const hoursPerOccurrence = DURATION_MAP[duration] ?? 0;
  const peopleMultiplier = PEOPLE_MAP[people] ?? 1;
  const monthlySavingsHours =
    monthlyOccurrences * hoursPerOccurrence * peopleMultiplier * AI_SAVINGS_PERCENTAGE;

  if (monthlySavingsHours < 1) return '<1 hour';
  if (monthlySavingsHours <= 200) return '1 - 200 hours';
  return '>200 hours';
}

// --- Master computation function ---

export function computeAllDerivedValues(
  conversationalAnswers: ConversationalAnswers,
  stageAnswers: Record<string, Record<string, string>>,
  _projectIdea: ProjectIdea | null,
  gatherDetails: GatherDetails | null,
  presentDetails: PresentDetails | null,
  protectionLevel: string,
): DerivedIntakeValues {
  const {
    whyNow,
    consequences,
    workloadFrequency,
    workloadDuration,
    workloadPeople,
    tritonGPT,
  } = conversationalAnswers;

  // Get stage answers for derived calculations
  const gatherAnswers = stageAnswers.GATHER ?? {};
  const refineAnswers = stageAnswers.REFINE ?? {};
  const presentAnswers = stageAnswers.PRESENT ?? {};

  // Daily tools from gather stage answer (multi-select stored as comma-separated)
  const dailyToolsRaw = gatherAnswers['gather-daily-tools'] ?? '';
  const dailyTools = dailyToolsRaw ? dailyToolsRaw.split(',') : [];

  // Data frequency and expert from gather stage answers
  const dataFrequency = gatherAnswers['gather-data-frequency'] ?? '';
  const dataExpert = gatherAnswers['gather-data-expert'] ?? '';

  // Cross-dept and result audience from present/refine stage answers
  const crossDept = presentAnswers['present-cross-dept'] ?? '';
  const resultAudienceRaw = refineAnswers['refine-result-audience'] ?? '';
  const resultAudience = resultAudienceRaw ? resultAudienceRaw.split(',') : [];

  // Approval from refine stage
  const approval = refineAnswers['refine-approval'] ?? '';

  // Urgency from present stage
  const urgency = presentAnswers['present-urgency'] ?? '';

  // Data prep from refine stage
  const dataPrep = refineAnswers['refine-transform'] ?? '';

  // Output format count
  const outputFormatCount = presentDetails?.outputs?.length ?? 0;

  // Savings
  const savings = calculateSavings(workloadFrequency, workloadDuration, workloadPeople);

  return {
    // Savings
    ...savings,

    // Derived UCSD fields
    customerSize: deriveCustomerSize(crossDept, resultAudience, workloadPeople),
    customerNeed: deriveCustomerNeed(whyNow, consequences, workloadFrequency),
    processVolume: deriveProcessVolume(workloadFrequency, workloadPeople),
    savingsPerCycle: deriveSavingsPerCycle(workloadDuration),
    savingsPerMonth: deriveSavingsPerMonth(workloadFrequency, workloadDuration, workloadPeople),
    alignment: deriveAlignment(
      tritonGPT,
    ),
    dataAvailability: deriveDataAvailability(
      dailyTools,
      dataFrequency,
      dataExpert,
      gatherDetails?.sourceSystem ?? '',
    ),
    complexity: deriveComplexity(
      protectionLevel,
      dailyTools,
      dataPrep,
      approval,
      urgency,
      outputFormatCount,
    ),
  };
}
