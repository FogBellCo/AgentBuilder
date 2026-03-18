/**
 * Deterministic field calculations for the OSI-facing UCSD intake format.
 *
 * These fields are NEVER AI-generated — they are derived from user answers
 * using precise mappings from the spec.
 */

import type {
  ConversationalAnswers,
  ProjectIdea,
  GatherDetails,
  PresentDetails,
  RefineDetails,
  StageResult,
} from '@/types/decision-tree';
import type { OSISummary } from '@/types/summaries';
import {
  FREQUENCY_MAP,
  DURATION_MAP,
  PEOPLE_MAP,
  AI_SAVINGS_PERCENTAGE,
} from '@/lib/intake-calculations';

// --- Desirability ---

function deriveCustomerSizeForOSI(
  conversationalAnswers: ConversationalAnswers,
  refineResult?: StageResult,
): string {
  // Try Spec 01 answers first (via cross-dept or similar)
  // For now, use fallback from refine audience
  const audience = refineResult?.answers?.['refine-audience'] ?? '';

  if (audience === 'just-me' || audience === 'my-team') return 'One department';
  if (audience === 'campus-wide') return 'Campus-wide';
  if (audience === 'public-external') return 'Campus-wide';

  // Check conversational answers workloadPeople as heuristic
  if (conversationalAnswers.workloadPeople === 'large_group') return 'Multiple departments';

  return 'One department';
}

function deriveCustomerNeedForOSI(
  conversationalAnswers: ConversationalAnswers,
  _projectIdea: ProjectIdea | null,
): 'Low' | 'Medium' | 'High' {
  // Try Spec 01 whyNow answers first
  const { whyNow, consequences, workloadFrequency } = conversationalAnswers;

  if (whyNow.length > 0 || consequences.trim().length > 0) {
    let score = 0;
    if (whyNow.includes('volume_up')) score += 2;
    if (whyNow.includes('losing_staff')) score += 3;
    if (whyNow.includes('new_policy')) score += 3;
    if (whyNow.includes('leadership')) score += 2;
    if (whyNow.includes('improve')) score += 1;
    if (consequences.trim().length > 20) score += 2;
    if (workloadFrequency === 'multiple_daily') score += 2;
    if (workloadFrequency === 'daily') score += 1;
    if (score >= 6) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  }

  // Fallback: no conversational answers available
  return 'Medium';
}

// --- Viability ---

function deriveViabilityFields(
  conversationalAnswers: ConversationalAnswers,
  _projectIdea: ProjectIdea | null,
): OSISummary['viability'] {
  const { workloadFrequency, workloadDuration, workloadPeople } = conversationalAnswers;

  const freq = FREQUENCY_MAP[workloadFrequency];
  const dur = DURATION_MAP[workloadDuration];
  const people = PEOPLE_MAP[workloadPeople];

  if (freq && dur && people) {
    const monthlyInstances = Math.round(freq * people);
    const monthlyHours = freq * dur * people;
    const monthlySavings = Math.round(monthlyHours * AI_SAVINGS_PERCENTAGE);

    const processVolume = `~${monthlyInstances} per month`;
    const savingsPerCycle = dur >= 1 ? `${dur} hours` : `${Math.round(dur * 60)} minutes`;

    let savingsPerMonth = `~${monthlySavings} hours/month`;
    if (monthlySavings >= 160) {
      const fte = Math.round((monthlySavings / 160) * 10) / 10;
      savingsPerMonth += ` (~${fte} FTE)`;
    }

    return {
      processVolume,
      potentialSavingsPerCycle: savingsPerCycle,
      potentialSavingsPerMonth: savingsPerMonth,
    };
  }

  // Fallback: no workload data available
  return {
    processVolume: 'TBD — follow up needed',
    potentialSavingsPerCycle: 'TBD — follow up needed',
    potentialSavingsPerMonth: 'TBD — follow up needed',
  };
}

// --- Feasibility ---

function deriveAlignmentForOSI(
  conversationalAnswers: ConversationalAnswers,
  _projectIdea: ProjectIdea | null,
): string {
  const { tritonGPT } = conversationalAnswers;

  if (tritonGPT === 'use_it') return 'Already using TritonGPT';
  if (tritonGPT === 'heard_of') return 'Aware of TritonGPT — not yet using';
  if (tritonGPT === 'no') return 'Not aware of existing solutions';

  return '';
}

function deriveDataAvailabilityForOSI(
  conversationalAnswers: ConversationalAnswers,
  gatherDetails: GatherDetails | null,
): string {
  // Check if Spec 01 data-related questions have been answered
  const { currentTools } = conversationalAnswers;

  if (currentTools.length > 0) {
    const knownSystems = ['canvas', 'servicenow', 'oracle', 'concur', 'box', 'excel'];
    const knownCount = currentTools.filter(t => knownSystems.includes(t)).length;
    if (knownCount > 0) return 'Readily available';
    if (currentTools.includes('custom-app') || currentTools.includes('other-system')) return 'Requires new integration';
  }

  // Fallback from gatherDetails sourceSystem presence
  if (gatherDetails?.sourceSystem && gatherDetails.sourceSystem.trim().length > 0) {
    return 'Readily available';
  }

  return 'Requires new data source';
}

export function calculateComplexity(
  stages: Record<string, { status: string; result?: StageResult }>,
  gatherDetails: GatherDetails | null,
  refineDetails: RefineDetails | null,
  presentDetails: PresentDetails | null,
): 'Low' | 'Medium' | 'High' {
  let score = 0;

  // Number of data sources
  const sourceCount = stages.GATHER?.result?.answers?.['gather-start']
    ?.split(',').filter(Boolean).length ?? 0;
  if (sourceCount === 1) score += 0;
  else if (sourceCount <= 3) score += 1;
  else score += 2;

  // Protection level
  const pLevel = stages.GATHER?.result?.protectionLevel ?? 'P1';
  if (pLevel === 'P1') score += 0;
  else if (pLevel === 'P2') score += 1;
  else if (pLevel === 'P3') score += 2;
  else score += 3;

  // Number of processing steps
  const refinementCount = refineDetails?.refinements.length ?? 0;
  if (refinementCount <= 1) score += 0;
  else if (refinementCount <= 3) score += 1;
  else score += 2;

  // Number of output formats
  const outputCount = presentDetails?.outputs.length ?? 0;
  if (outputCount <= 1) score += 0;
  else if (outputCount <= 2) score += 1;
  else score += 2;

  // Has conditional feasibility?
  const hasConditional = presentDetails?.outputs.some(
    o => o.feasibility.feasibility === 'allowed_with_conditions'
  ) ?? false;
  if (hasConditional) score += 1;

  // Regulatory context
  const regContext = gatherDetails?.regulatoryContext ?? [];
  const hasReg = regContext.length > 0 && !(regContext.length === 1 && regContext[0] === 'none');
  if (hasReg) score += 1;

  if (score <= 2) return 'Low';
  if (score <= 5) return 'Medium';
  return 'High';
}

// --- Metadata ---

function deriveMetadata(
  conversationalAnswers: ConversationalAnswers,
): OSISummary['metadata'] {
  const { onBehalf, onBehalfName } = conversationalAnswers;

  return {
    vcArea: 'Not provided',
    submittedBy: 'Not provided',
    onBehalfOf: onBehalf === 'other' && onBehalfName
      ? onBehalfName
      : onBehalf === 'self'
        ? 'Self'
        : 'Not provided',
  };
}

// --- Savings ---

function deriveSavingsFields(
  conversationalAnswers: ConversationalAnswers,
): Omit<OSISummary['savings'], 'impactBullets'> {
  const { workloadFrequency, workloadDuration, workloadPeople } = conversationalAnswers;

  const freq = FREQUENCY_MAP[workloadFrequency];
  const dur = DURATION_MAP[workloadDuration];
  const people = PEOPLE_MAP[workloadPeople];

  if (freq && dur && people) {
    const monthlyInstances = Math.round(freq * people);
    const monthlyHours = freq * dur * people;
    const monthlySavings = Math.round(monthlyHours * AI_SAVINGS_PERCENTAGE);

    return {
      expectedVolume: `${monthlyInstances} per month`,
      timePerInstance: dur >= 1 ? `${dur} hours` : `${Math.round(dur * 60)} minutes`,
      savingsPercentage: '~80%',
      timeSavings: `~${monthlySavings} hours/month`,
    };
  }

  return {
    expectedVolume: 'TBD — follow up needed',
    timePerInstance: 'TBD — follow up needed',
    savingsPercentage: '~80%',
    timeSavings: 'TBD — follow up needed',
  };
}

// --- Master builder for deterministic calculated fields ---

export interface OSICalculatedFields {
  desirability: OSISummary['desirability'];
  viability: OSISummary['viability'];
  feasibility: OSISummary['feasibility'];
  metadata: OSISummary['metadata'];
  savings: Omit<OSISummary['savings'], 'impactBullets'>;
}

export function computeOSICalculatedFields(
  conversationalAnswers: ConversationalAnswers,
  projectIdea: ProjectIdea | null,
  gatherDetails: GatherDetails | null,
  refineDetails: RefineDetails | null,
  presentDetails: PresentDetails | null,
  stages: Record<string, { status: string; result?: StageResult }>,
): OSICalculatedFields {
  return {
    desirability: {
      customerSize: deriveCustomerSizeForOSI(conversationalAnswers, stages.REFINE?.result as StageResult | undefined),
      customerNeed: deriveCustomerNeedForOSI(conversationalAnswers, projectIdea),
    },
    viability: deriveViabilityFields(conversationalAnswers, projectIdea),
    feasibility: {
      alignmentWithExisting: deriveAlignmentForOSI(conversationalAnswers, projectIdea),
      dataAvailability: deriveDataAvailabilityForOSI(conversationalAnswers, gatherDetails),
      complexity: calculateComplexity(stages, gatherDetails, refineDetails, presentDetails),
    },
    metadata: deriveMetadata(conversationalAnswers),
    savings: deriveSavingsFields(conversationalAnswers),
  };
}

// --- OSI-Facing Markdown Export ---

export function buildOSIMarkdown(osi: OSISummary): string {
  const lines: string[] = [];

  lines.push('# UCSD AI Intake — OSI Summary');
  lines.push('');
  lines.push(`> Generated ${new Date().toISOString()}`);
  lines.push('');

  // Process Overview
  lines.push('## Process Overview');
  lines.push('');
  lines.push(`**Purpose:** ${osi.processOverview.purpose}`);
  lines.push('');
  lines.push(`**Description:** ${osi.processOverview.description}`);
  lines.push('');
  lines.push('**Key Points:**');
  for (const pt of osi.processOverview.keyPoints) {
    lines.push(`- ${pt}`);
  }
  lines.push('');

  // AI Solution Considerations
  lines.push('## AI Solution Considerations');
  lines.push('');
  lines.push('**Potential Impact:**');
  for (const pt of osi.processOverview.potentialImpact) {
    lines.push(`- ${pt}`);
  }
  lines.push('');
  lines.push('**Questions & Considerations:**');
  for (const pt of osi.processOverview.questionsAndConsiderations) {
    lines.push(`- ${pt}`);
  }
  lines.push('');

  // Scoring Columns
  lines.push('## Scoring');
  lines.push('');
  lines.push('| Category | Field | Value |');
  lines.push('|---|---|---|');
  lines.push(`| Desirability | Customer Size | ${osi.desirability.customerSize} |`);
  lines.push(`| Desirability | Customer Need | ${osi.desirability.customerNeed} |`);
  lines.push(`| Viability | Process Volume | ${osi.viability.processVolume} |`);
  lines.push(`| Viability | Savings per Cycle | ${osi.viability.potentialSavingsPerCycle} |`);
  lines.push(`| Viability | Savings per Month | ${osi.viability.potentialSavingsPerMonth} |`);
  lines.push(`| Feasibility | Alignment | ${osi.feasibility.alignmentWithExisting} |`);
  lines.push(`| Feasibility | Data Availability | ${osi.feasibility.dataAvailability} |`);
  lines.push(`| Feasibility | Complexity | ${osi.feasibility.complexity} |`);
  lines.push('');

  // Metadata
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- **VC Area:** ${osi.metadata.vcArea}`);
  lines.push(`- **Submitted by:** ${osi.metadata.submittedBy}`);
  lines.push(`- **On behalf of:** ${osi.metadata.onBehalfOf}`);
  lines.push('');

  // Narrative sections
  lines.push('## Context');
  lines.push('');
  lines.push(osi.context);
  lines.push('');

  lines.push('## Challenge');
  lines.push('');
  lines.push(osi.challenge);
  lines.push('');

  lines.push('## Request');
  lines.push('');
  lines.push(osi.request);
  lines.push('');

  // Savings
  lines.push('## Savings');
  lines.push('');
  lines.push(`- **Expected Volume:** ${osi.savings.expectedVolume}`);
  lines.push(`- **Time spent per instance:** ${osi.savings.timePerInstance}`);
  lines.push(`- **Potential time savings per instance:** ${osi.savings.savingsPercentage}`);
  lines.push(`- **Time savings:** ${osi.savings.timeSavings}`);
  lines.push('');
  if (osi.savings.impactBullets.length > 0) {
    lines.push('**Impact:**');
    for (const b of osi.savings.impactBullets) {
      lines.push(`- ${b}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
