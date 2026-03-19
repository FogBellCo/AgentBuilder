/**
 * Calculate completeness percentage from session state.
 * Server-side calculation — keeps completeness_pct in sync.
 */

interface SessionSnapshot {
  projectIdea?: {
    title?: string;
    description?: string;
    domain?: string;
    currentProcess?: string;
  } | null;
  stages?: Record<string, {
    status?: string;
    result?: {
      protectionLevel?: string;
    };
  }>;
  gatherDetails?: {
    dataType?: string[];
    sourceSystem?: string;
    dataSize?: string;
    regulatoryContext?: string[];
  } | null;
  refineDetails?: {
    refinements?: string[];
  } | null;
  presentDetails?: {
    outputs?: string[];
  } | null;
  gapAnalysis?: {
    status?: string;
    questions?: Array<{
      priority?: string;
      status?: string;
    }>;
  };
}

export function calculateCompleteness(sessionState: Record<string, unknown>): number {
  const state = sessionState as unknown as SessionSnapshot;
  let score = 0;

  // projectIdea: 20 points
  const pi = state.projectIdea;
  if (pi) {
    if (pi.title) score += 5;
    if (pi.description) score += 5;
    if (pi.domain) score += 4;
    if (pi.currentProcess) score += 3;
  }

  // gatherStage: 20 points
  const gather = state.stages?.GATHER;
  if (gather?.status === 'complete') score += 10;
  const gd = state.gatherDetails;
  if (gd) {
    if (gd.dataType && gd.dataType.length > 0) score += 4;
    if (gd.sourceSystem) score += 3;
    if (gd.dataSize) score += 3;
  }

  // refineStage: 20 points
  const refine = state.stages?.REFINE;
  if (refine?.status === 'complete') score += 10;
  const rd = state.refineDetails;
  if (rd?.refinements && rd.refinements.length > 0) score += 10;

  // presentStage: 15 points
  const present = state.stages?.PRESENT;
  if (present?.status === 'complete') score += 10;
  const pd = state.presentDetails;
  if (pd?.outputs && pd.outputs.length > 0) score += 5;

  // gapAnalysis: 15 points
  const ga = state.gapAnalysis;
  if (ga?.status === 'ready' && ga.questions && ga.questions.length > 0) {
    const critical = ga.questions.filter((q) => q.priority === 'critical');
    const answeredCritical = critical.filter((q) => q.status === 'answered');
    if (critical.length > 0) {
      score += Math.round(15 * (answeredCritical.length / critical.length));
    } else {
      score += 15;
    }
  }

  // detailFields: 10 points
  if (gd?.regulatoryContext && gd.regulatoryContext.length > 0) score += 2;

  return Math.min(100, score);
}

/**
 * Extract structured metadata from session state.
 */
export function extractMetadata(sessionState: Record<string, unknown>): {
  title: string;
  description: string;
  domain: string;
  protectionLevel: string | null;
  outputFormats: string[];
} {
  const state = sessionState as unknown as SessionSnapshot;
  const pi = state.projectIdea;

  const protectionLevel = state.stages?.GATHER?.result?.protectionLevel ?? null;
  const validLevels = ['P1', 'P2', 'P3', 'P4'];
  const pl = protectionLevel && validLevels.includes(protectionLevel) ? protectionLevel : null;

  const outputs = state.presentDetails?.outputs ?? [];

  return {
    title: pi?.title || '',
    description: pi?.description || '',
    domain: pi?.domain || '',
    protectionLevel: pl,
    outputFormats: outputs,
  };
}
