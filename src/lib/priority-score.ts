/**
 * Priority scoring algorithm for admin prioritization matrix.
 * Spec 06 section 7a.
 */

import type { ScoreOverrides } from '@/types/admin';

interface SessionState {
  projectIdea?: Record<string, unknown> | null;
  stages?: Record<string, {
    status?: string;
    result?: {
      protectionLevel?: string;
      answers?: Record<string, string>;
    };
  }>;
  gatherDetails?: {
    sourceSystem?: string;
    dataType?: string[];
  } | null;
  refineDetails?: {
    refinements?: unknown[];
  } | null;
  presentDetails?: {
    outputs?: unknown[];
  } | null;
  conversationalAnswers?: {
    workloadFrequency?: string;
    workloadDuration?: string;
    workloadPeople?: string;
    tritonGPT?: string;
    whyNow?: string[];
    consequences?: string;
    currentTools?: string[];
  };
}

// --- Desirability Score (0-100) ---

function customerSizeScore(state: SessionState): number {
  const audience = state.stages?.REFINE?.result?.answers?.['refine-audience'] ?? '';
  if (audience === 'campus-wide' || audience === 'public-external') return 100;
  if (audience === 'cross-department') return 75;
  if (audience === 'my-department') return 50;
  if (audience === 'just-me' || audience === 'my-team') return 20;

  // Fallback from workloadPeople
  const people = state.conversationalAnswers?.workloadPeople;
  if (people === 'large_group') return 100;
  if (people === 'small_team') return 65;
  if (people === '2_3_people') return 40;
  return 50; // neutral default
}

function customerNeedScore(state: SessionState): number {
  const conv = state.conversationalAnswers;
  if (!conv) return 50;

  const freq = conv.workloadFrequency;
  if (freq === 'multiple_daily') return 100;
  if (freq === 'daily') return 75;
  if (freq === 'few_times_week') return 50;
  if (freq === 'few_times_month') return 25;

  return 50; // neutral default
}

function calculateDesirability(state: SessionState): number {
  return Math.round(customerSizeScore(state) * 0.5 + customerNeedScore(state) * 0.5);
}

// --- Viability Score (0-100) ---

function processVolumeScore(state: SessionState): number {
  const freq = state.conversationalAnswers?.workloadFrequency;
  if (freq === 'multiple_daily') return 100;
  if (freq === 'daily') return 75;
  if (freq === 'few_times_week') return 50;
  if (freq === 'few_times_month') return 25;
  return 50;
}

function timePerInstanceScore(state: SessionState): number {
  const dur = state.conversationalAnswers?.workloadDuration;
  if (dur === 'half_day') return 100;
  if (dur === 'couple_hours') return 70;
  if (dur === 'half_hour') return 40;
  if (dur === 'few_minutes') return 15;
  return 50;
}

function scaleScore(state: SessionState): number {
  const people = state.conversationalAnswers?.workloadPeople;
  if (people === 'large_group') return 100;
  if (people === 'small_team') return 65;
  if (people === '2_3_people') return 40;
  if (people === 'just_me') return 20;
  return 50;
}

function calculateViability(state: SessionState): number {
  return Math.round(
    processVolumeScore(state) * 0.4 +
    timePerInstanceScore(state) * 0.3 +
    scaleScore(state) * 0.3
  );
}

// --- Feasibility Score (0-100) ---

function dataAvailabilityScore(state: SessionState): number {
  const tools = state.conversationalAnswers?.currentTools ?? [];
  if (tools.length > 0) {
    const knownSystems = ['canvas', 'servicenow', 'oracle', 'concur', 'box', 'excel'];
    const knownCount = tools.filter(t => knownSystems.includes(t)).length;
    if (knownCount > 0) return 100;
    return 50;
  }
  if (state.gatherDetails?.sourceSystem) return 100;
  return 25;
}

function toolAlignmentScore(state: SessionState): number {
  const triton = state.conversationalAnswers?.tritonGPT;
  if (triton === 'use_it') return 100;
  if (triton === 'heard_of') return 60;
  if (triton === 'no') return 30;
  return 50;
}

function complexityScoreInverse(state: SessionState): number {
  let complexity = 0;

  // Data sources count
  const dataTypes = state.gatherDetails?.dataType?.length ?? 0;
  if (dataTypes > 3) complexity += 2;
  else if (dataTypes > 1) complexity += 1;

  // Protection level
  const pLevel = state.stages?.GATHER?.result?.protectionLevel;
  if (pLevel === 'P4') complexity += 3;
  else if (pLevel === 'P3') complexity += 2;
  else if (pLevel === 'P2') complexity += 1;

  // Processing steps
  const refinements = state.refineDetails?.refinements?.length ?? 0;
  if (refinements > 3) complexity += 2;
  else if (refinements > 1) complexity += 1;

  if (complexity <= 2) return 100; // Low complexity = high feasibility
  if (complexity <= 4) return 60;
  return 30;
}

function calculateFeasibility(state: SessionState): number {
  return Math.round(
    dataAvailabilityScore(state) * 0.4 +
    toolAlignmentScore(state) * 0.3 +
    complexityScoreInverse(state) * 0.3
  );
}

// --- Composite scores ---

export interface PriorityScores {
  desirability: number;
  viability: number;
  feasibility: number;
  impact: number;
  effort: number;
  priority: number;
}

export function calculatePriorityScores(
  sessionState: Record<string, unknown>,
  overrides?: ScoreOverrides | null,
): PriorityScores {
  const state = sessionState as unknown as SessionState;

  const desirability = overrides?.desirability ?? calculateDesirability(state);
  const viability = overrides?.viability ?? calculateViability(state);
  const feasibility = overrides?.feasibility ?? calculateFeasibility(state);

  const impact = Math.round(desirability * 0.5 + viability * 0.5);
  const effort = 100 - feasibility;
  const priority = Math.round(impact * 0.6 + feasibility * 0.4);

  return { desirability, viability, feasibility, impact, effort, priority };
}
