import { useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/session-store';
import { postGapAnalysis } from '@/lib/api-client';
import { buildIntakeJson } from '@/lib/summary-formatter';
import {
  calculateCompletenessScore,
  calculateAdjustedScore,
  getReadinessLabel,
  detectStaticGaps,
  mergeGapQuestions,
  calculateQuestionProgress,
} from '@/lib/gap-scoring';
import type { GapRuleState } from '@/types/gap-analysis';

const MAX_RETRIES = 2;

/**
 * Build a GapRuleState snapshot from the current session store.
 */
function buildGapRuleState(): GapRuleState {
  const state = useSessionStore.getState();
  return {
    projectIdea: state.projectIdea,
    gatherDetails: state.gatherDetails,
    refineDetails: state.refineDetails,
    presentDetails: state.presentDetails
      ? {
          outputs: state.presentDetails.outputs.map((o) => ({
            format: o.format,
            description: o.description,
            feasibility: o.feasibility,
          })),
        }
      : null,
    stages: {
      GATHER: {
        status: state.stages.GATHER.status,
        result: state.stages.GATHER.result
          ? {
              protectionLevel: state.stages.GATHER.result.protectionLevel,
              answers: state.stages.GATHER.result.answers,
            }
          : undefined,
      },
      REFINE: {
        status: state.stages.REFINE.status,
        result: state.stages.REFINE.result
          ? { answers: state.stages.REFINE.result.answers }
          : undefined,
      },
      PRESENT: {
        status: state.stages.PRESENT.status,
        result: state.stages.PRESENT.result
          ? {
              outputFormat: state.stages.PRESENT.result.outputFormat,
              answers: state.stages.PRESENT.result.answers,
            }
          : undefined,
      },
    },
  };
}

export function useGapAnalysis() {
  const store = useSessionStore();
  const {
    gapAnalysis,
    setGapAnalysisLoading,
    setGapAnalysisResult,
    setGapAnalysisError,
    setGapAnalysisFallback,
    answerGapQuestion,
    snoozeGapQuestion,
    unsnoozeGapQuestion,
    updateCompletenessScore,
    setStaticGaps,
  } = store;

  const retryCountRef = useRef(0);

  // Compute static gaps and completeness score from current state
  const computeStaticAnalysis = useCallback(() => {
    const ruleState = buildGapRuleState();
    const score = calculateCompletenessScore(ruleState);
    const label = getReadinessLabel(score);
    const staticGaps = detectStaticGaps(ruleState);

    updateCompletenessScore(score, label);
    setStaticGaps(staticGaps);

    return { score, label, staticGaps };
  }, [updateCompletenessScore, setStaticGaps]);

  // Run the full gap analysis (API call with static fallback)
  const runAnalysis = useCallback(async () => {
    retryCountRef.current = 0;
    setGapAnalysisLoading();

    // First compute static gaps for immediate display
    const { staticGaps } = computeStaticAnalysis();

    const attemptAnalysis = async (): Promise<void> => {
      try {
        const state = useSessionStore.getState();
        const summaryState = {
          sessionId: state.sessionId,
          projectIdea: state.projectIdea,
          gatherResult: state.stages.GATHER.result,
          gatherDetails: state.gatherDetails,
          refineResult: state.stages.REFINE.result,
          refineDetails: state.refineDetails,
          presentResult: state.stages.PRESENT.result,
          presentDetails: state.presentDetails,
          conversationalAnswers: state.conversationalAnswers,
          stageAnswers: state.stageAnswers,
        };

        const intakePayload = buildIntakeJson(summaryState);

        // Include any previously answered questions for re-analysis context
        const previousAnswers = state.gapAnalysis.questions.filter(
          (q) => q.status === 'answered',
        );

        const response = await postGapAnalysis(
          intakePayload,
          previousAnswers.length > 0 ? previousAnswers : undefined,
        );

        // Merge AI questions with static gaps
        const mergedQuestions = mergeGapQuestions(staticGaps, response.questions);

        // Preserve previously answered/snoozed status for questions that still appear
        const previousQuestions = state.gapAnalysis.questions;
        const finalQuestions = mergedQuestions.map((q) => {
          const prev = previousQuestions.find(
            (p) => p.id === q.id || (p.relatedField && p.relatedField === q.relatedField),
          );
          if (prev?.status === 'answered') {
            return { ...q, status: 'answered' as const, answer: prev.answer, selectedOptions: prev.selectedOptions, answeredAt: prev.answeredAt };
          }
          // Previously snoozed questions that AI still flags => back to pending (Scenario C)
          // Previously snoozed questions that AI doesn't flag => removed (handled by merge)
          return q;
        });

        setGapAnalysisResult(
          finalQuestions,
          response.overallAssessment,
          response.reclassification,
        );
      } catch (err) {
        retryCountRef.current++;

        // Check if retryable
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        const isRetryable =
          message.includes('429') ||
          message.includes('timeout') ||
          message.includes('503') ||
          message.includes('529') ||
          message.includes('rate limit') ||
          message.includes('Failed to fetch') ||
          message.includes('NetworkError');

        if (isRetryable && retryCountRef.current <= MAX_RETRIES) {
          // Retry
          return attemptAnalysis();
        }

        // Check if we should fall back to static-only
        if (retryCountRef.current > MAX_RETRIES || !navigator.onLine) {
          // Static-only fallback
          setGapAnalysisFallback(staticGaps);
          return;
        }

        setGapAnalysisError(
          navigator.onLine
            ? message
            : 'You appear to be offline. Please check your connection and try again.',
        );
      }
    };

    await attemptAnalysis();
  }, [setGapAnalysisLoading, setGapAnalysisResult, setGapAnalysisError, setGapAnalysisFallback, computeStaticAnalysis]);

  // Recalculate completeness score whenever questions change
  useEffect(() => {
    const ruleState = buildGapRuleState();
    const baseScore = calculateCompletenessScore(ruleState);
    // Adjust score upward based on answered gap questions
    const adjustedScore = calculateAdjustedScore(baseScore, gapAnalysis.questions);
    const label = getReadinessLabel(adjustedScore);
    updateCompletenessScore(adjustedScore, label);
  }, [gapAnalysis.questions, updateCompletenessScore]);

  // Computed values
  const pendingQuestions = gapAnalysis.questions.filter((q) => q.status === 'pending');
  const answeredQuestions = gapAnalysis.questions.filter((q) => q.status === 'answered');
  const snoozedQuestions = gapAnalysis.questions.filter((q) => q.status === 'snoozed');
  const allResolved = gapAnalysis.questions.length > 0 && pendingQuestions.length === 0;
  const noGaps = gapAnalysis.status === 'ready' && gapAnalysis.questions.length === 0;

  const questionProgress = calculateQuestionProgress(gapAnalysis.questions);

  // Check if this was a static-only fallback (no AI assessment)
  const isStaticFallback =
    gapAnalysis.status === 'ready' &&
    gapAnalysis.overallAssessment === '' &&
    gapAnalysis.questions.length > 0;

  return {
    status: gapAnalysis.status,
    questions: gapAnalysis.questions,
    overallAssessment: gapAnalysis.overallAssessment,
    reclassification: gapAnalysis.reclassification,
    errorMessage: gapAnalysis.errorMessage,
    completenessScore: gapAnalysis.completenessScore,
    readinessLabel: gapAnalysis.readinessLabel,
    lastAnalyzedAt: gapAnalysis.lastAnalyzedAt,
    runCount: gapAnalysis.runCount,

    // Filtered lists
    pendingQuestions,
    answeredQuestions,
    snoozedQuestions,
    allResolved,
    noGaps,
    isStaticFallback,

    // Progress
    questionProgress,

    // Actions
    runAnalysis,
    answerQuestion: answerGapQuestion,
    snoozeQuestion: snoozeGapQuestion,
    unsnoozeQuestion: unsnoozeGapQuestion,
    computeStaticAnalysis,
  };
}
