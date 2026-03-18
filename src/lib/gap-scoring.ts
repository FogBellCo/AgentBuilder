import type {
  GapQuestion,
  GapRuleState,
  ReadinessLabel,
} from '@/types/gap-analysis';
import { gapRules, getFieldValue, detectRegulatoryContradiction } from '@/lib/gap-rules';

// ===========================
// Field Inventory for Scoring
// ===========================

interface FieldDef {
  path: string;
  weight: number;
  required: boolean;
  completeWhen: (val: unknown) => boolean;
  thinWhen: (val: unknown) => boolean;
}

function strLen(val: unknown): number {
  if (typeof val === 'string') return val.trim().length;
  return 0;
}

function arrLen(val: unknown): number {
  if (Array.isArray(val)) return val.length;
  return 0;
}

function isNonEmptyStr(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * All fields from Section 2.1 of the spec, with their weights and completeness criteria.
 */
const fieldInventory: FieldDef[] = [
  // Describe Stage Fields
  {
    path: 'projectIdea.title',
    weight: 8,
    required: true,
    completeWhen: (val) => strLen(val) >= 5,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 5,
  },
  {
    path: 'projectIdea.description',
    weight: 12,
    required: true,
    completeWhen: (val) => strLen(val) >= 50,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 50,
  },
  {
    path: 'projectIdea.domain',
    weight: 4,
    required: false,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'projectIdea.currentProcess',
    weight: 8,
    required: false,
    completeWhen: (val) => strLen(val) >= 20,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 20,
  },

  // Gather Stage Fields
  {
    path: 'stages.GATHER.result.protectionLevel',
    weight: 10,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'stages.GATHER.result.answers.gather-start',
    weight: 8,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'gatherDetails.dataType',
    weight: 5,
    required: false,
    completeWhen: (val) => arrLen(val) >= 1,
    thinWhen: () => false,
  },
  {
    path: 'gatherDetails.sourceSystem',
    weight: 5,
    required: false,
    completeWhen: (val) => strLen(val) >= 3,
    thinWhen: (val) => strLen(val) >= 1 && strLen(val) < 3,
  },
  {
    path: 'gatherDetails.dataSize',
    weight: 3,
    required: false,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'gatherDetails.regulatoryContext',
    weight: 6,
    required: false,
    completeWhen: (val) => arrLen(val) >= 1,
    thinWhen: () => false,
  },
  {
    path: 'gatherDetails.additionalNotes',
    weight: 2,
    required: false,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },

  // Refine Stage Fields
  {
    path: 'stages.REFINE.result.answers.refine-task',
    weight: 8,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'stages.REFINE.result.answers.refine-transform',
    weight: 4,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'stages.REFINE.result.answers.refine-audience',
    weight: 5,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'refineDetails.refinements',
    weight: 7,
    required: false,
    completeWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.some((r: { description?: string }) => strLen(r?.description) >= 10);
    },
    thinWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.length > 0 && val.every((r: { description?: string }) => strLen(r?.description) < 10);
    },
  },
  {
    path: 'refineDetails.additionalContext',
    weight: 3,
    required: false,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },

  // Present Stage Fields
  {
    path: 'stages.PRESENT.result.outputFormat',
    weight: 8,
    required: true,
    completeWhen: (val) => isNonEmptyStr(val),
    thinWhen: () => false,
  },
  {
    path: 'presentDetails.outputs',
    weight: 5,
    required: false,
    completeWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.some((o: { description?: string }) => strLen(o?.description) >= 10);
    },
    thinWhen: (val) => {
      if (!Array.isArray(val)) return false;
      return val.length > 0 && val.every((o: { description?: string }) => strLen(o?.description) < 10);
    },
  },
];

// Total possible weight: 127 (matches spec)
// const TOTAL_WEIGHT = fieldInventory.reduce((sum, f) => sum + f.weight, 0);

/**
 * Calculate the completeness score for the current session state.
 * Returns a number 0-100.
 *
 * Scoring formula from Section 2.2:
 *   totalWeight = sum of all weights
 *   earnedWeight = sum of weights for complete fields
 *   partialWeight = sum of (weight * 0.5) for thin fields
 *   score = ((earnedWeight + partialWeight) / totalWeight) * 100
 */
export function calculateCompletenessScore(state: GapRuleState): number {
  const totalWeight = fieldInventory.reduce((sum, f) => sum + f.weight, 0);
  let earnedWeight = 0;
  let partialWeight = 0;

  for (const field of fieldInventory) {
    const val = getFieldValue(state, field.path);
    if (field.completeWhen(val)) {
      earnedWeight += field.weight;
    } else if (field.thinWhen(val)) {
      partialWeight += field.weight * 0.5;
    }
  }

  const score = ((earnedWeight + partialWeight) / totalWeight) * 100;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Get the readiness label based on the completeness score.
 * Section 2.3 thresholds.
 */
export function getReadinessLabel(score: number): ReadinessLabel {
  if (score >= 80) return 'ready';
  if (score >= 50) return 'almost';
  return 'needs_work';
}

/**
 * Human-readable readiness label text.
 */
export function getReadinessText(label: ReadinessLabel): string {
  switch (label) {
    case 'ready':
      return 'Ready for review';
    case 'almost':
      return 'Almost there';
    case 'needs_work':
      return "Let's fill in some gaps";
  }
}

/**
 * Calculate an adjusted completeness score that accounts for answered gap questions.
 * The base field score only reflects what's in the original form fields.
 * When a user answers a gap question, that information fills the gap even though
 * it doesn't write back to the original field -- so we give credit for it.
 *
 * Formula:
 * - Start with the base field score
 * - For each answered gap question, add back a portion of the missing weight
 * - Critical answered questions contribute more than nice-to-have
 */
export function calculateAdjustedScore(
  baseScore: number,
  questions: GapQuestion[],
): number {
  if (questions.length === 0) return baseScore;

  const totalQuestions = questions.length;
  const answeredCritical = questions.filter((q) => q.status === 'answered' && q.priority === 'critical').length;
  const answeredNice = questions.filter((q) => q.status === 'answered' && q.priority === 'nice_to_have').length;

  // The gap between current score and 100
  const gap = 100 - baseScore;
  if (gap <= 0) return 100;

  // Each answered question recovers a portion of the gap
  // Critical questions recover more (2x weight) than nice-to-have (1x)
  const totalWeight = questions.reduce((sum, q) => sum + (q.priority === 'critical' ? 2 : 1), 0);
  const answeredWeight = answeredCritical * 2 + answeredNice * 1;

  if (totalWeight === 0 || totalQuestions === 0) return baseScore;

  const recoveredGap = gap * (answeredWeight / totalWeight);
  const adjustedScore = Math.round(baseScore + recoveredGap);

  return Math.min(100, Math.max(0, adjustedScore));
}

/**
 * Run all static gap rules and return a list of gap questions for missing/thin fields.
 * This is the client-side "Layer 1" from Section 4.1.
 */
export function detectStaticGaps(state: GapRuleState): GapQuestion[] {
  const gaps: GapQuestion[] = [];
  const seenFields = new Set<string>();

  for (const rule of gapRules) {
    const val = getFieldValue(state, rule.fieldPath);
    const isComplete = rule.completeWhen(val, state);

    if (isComplete) continue;

    const isThin = rule.thinWhen(val, state);

    // For thinOnly rules, only fire when the field is thin (not completely missing)
    if (rule.thinOnly && !isThin) continue;

    // Skip if we already have a gap for this field (avoid duplication between missing and thin rules)
    // Exception: thinOnly rules override missing rules for the same field
    if (seenFields.has(rule.fieldPath)) {
      if (rule.thinOnly) {
        // Replace the existing gap with this thin variant
        const idx = gaps.findIndex((g) => g.relatedField === rule.fieldPath);
        if (idx >= 0) gaps.splice(idx, 1);
      } else {
        continue;
      }
    }
    seenFields.add(rule.fieldPath);

    const priority = typeof rule.priority === 'function'
      ? rule.priority(state)
      : rule.priority;

    const question = typeof rule.followUpQuestion === 'function'
      ? rule.followUpQuestion(state)
      : rule.followUpQuestion;

    gaps.push({
      id: rule.id,
      priority,
      question,
      context: rule.followUpContext,
      inputType: rule.inputType,
      options: rule.options,
      relatedSection: rule.relatedSection,
      relatedField: rule.fieldPath,
      status: 'pending',
    });
  }

  // Check the special cross-field regulatory contradiction rule
  const contradictionRule = detectRegulatoryContradiction(state);
  if (contradictionRule && !seenFields.has('gather-regulatory-contradicts-plevel')) {
    const question = typeof contradictionRule.followUpQuestion === 'function'
      ? contradictionRule.followUpQuestion(state)
      : contradictionRule.followUpQuestion;

    gaps.push({
      id: contradictionRule.id,
      priority: 'critical',
      question,
      relatedSection: contradictionRule.relatedSection,
      relatedField: contradictionRule.fieldPath,
      inputType: contradictionRule.inputType,
      status: 'pending',
    });
  }

  return gaps;
}

/**
 * Merge static and AI-generated gap questions.
 * - AI questions take priority over static questions for the same relatedField
 * - Static questions that the AI did NOT cover are kept as-is
 * - De-duplicated by relatedField
 */
export function mergeGapQuestions(
  staticGaps: GapQuestion[],
  aiGaps: GapQuestion[],
): GapQuestion[] {
  const merged: GapQuestion[] = [];
  const coveredFields = new Set<string>();

  // AI questions take priority
  for (const aiQ of aiGaps) {
    merged.push(aiQ);
    if (aiQ.relatedField) {
      coveredFields.add(aiQ.relatedField);
    }
  }

  // Add static gaps that the AI didn't cover
  for (const staticQ of staticGaps) {
    if (staticQ.relatedField && coveredFields.has(staticQ.relatedField)) {
      continue; // AI already covers this field
    }
    // Also check by id to avoid exact duplicates
    if (merged.some((q) => q.id === staticQ.id)) {
      continue;
    }
    merged.push(staticQ);
    if (staticQ.relatedField) {
      coveredFields.add(staticQ.relatedField);
    }
  }

  return merged;
}

/**
 * Calculate the question-based progress for the gap analysis page.
 * Critical questions count for 2x progress, nice_to_have for 1x.
 */
export function calculateQuestionProgress(questions: GapQuestion[]): {
  percentage: number;
  resolvedCount: number;
  totalCount: number;
} {
  if (questions.length === 0) {
    return { percentage: 100, resolvedCount: 0, totalCount: 0 };
  }

  let totalWeight = 0;
  let resolvedWeight = 0;
  let resolvedCount = 0;

  for (const q of questions) {
    const weight = q.priority === 'critical' ? 2 : 1;
    totalWeight += weight;
    if (q.status === 'answered' || q.status === 'snoozed') {
      resolvedWeight += weight;
      resolvedCount++;
    }
  }

  const percentage = totalWeight > 0
    ? Math.round((resolvedWeight / totalWeight) * 100)
    : 100;

  return {
    percentage,
    resolvedCount,
    totalCount: questions.length,
  };
}
