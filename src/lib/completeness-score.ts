/**
 * Client-side completeness scoring for admin dashboard.
 * Matches spec 06 section 4e weights.
 */

interface SessionState {
  projectIdea?: {
    title?: string;
    description?: string;
    domain?: string;
    currentProcess?: string;
  } | null;
  stages?: Record<string, { status?: string }>;
  gatherDetails?: {
    dataType?: string[];
    sourceSystem?: string;
  } | null;
  refineDetails?: {
    refinements?: unknown[];
  } | null;
  presentDetails?: {
    outputs?: unknown[];
  } | null;
  gapAnalysis?: {
    status?: string;
  };
}

export function calculateCompletenessFromSession(sessionState: Record<string, unknown>): number {
  const state = sessionState as unknown as SessionState;
  let score = 0;

  const pi = state.projectIdea;
  if (pi) {
    if (pi.title) score += 5;
    if (pi.description) score += 10;
    if (pi.domain) score += 5;
    if (pi.currentProcess) score += 5;
  }

  // GATHER stage complete: 15%
  if (state.stages?.GATHER?.status === 'complete') score += 15;

  // gatherDetails filled: 10%
  const gd = state.gatherDetails;
  if (gd && (gd.dataType?.length || gd.sourceSystem)) score += 10;

  // REFINE stage complete: 15%
  if (state.stages?.REFINE?.status === 'complete') score += 15;

  // refineDetails filled: 5%
  if (state.refineDetails?.refinements?.length) score += 5;

  // PRESENT stage complete: 10%
  if (state.stages?.PRESENT?.status === 'complete') score += 10;

  // presentDetails filled: 5%
  if (state.presentDetails?.outputs?.length) score += 5;

  // Gap analysis completed: 5%
  if (state.gapAnalysis?.status === 'ready') score += 5;

  return Math.min(100, score);
}
