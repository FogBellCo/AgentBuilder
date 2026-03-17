import { useCallback } from 'react';
import { useSessionStore } from '@/store/session-store';
import { postGapAnalysis } from '@/lib/api-client';
import { buildIntakeJson } from '@/lib/summary-formatter';

export function useGapAnalysis() {
  const store = useSessionStore();
  const {
    gapAnalysis,
    setGapAnalysisLoading,
    setGapAnalysisResult,
    setGapAnalysisError,
    answerGapQuestion,
    snoozeGapQuestion,
  } = store;

  const runAnalysis = useCallback(async () => {
    setGapAnalysisLoading();

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

      setGapAnalysisResult(
        response.questions,
        response.overallAssessment,
        response.reclassification,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setGapAnalysisError(message);
    }
  }, [setGapAnalysisLoading, setGapAnalysisResult, setGapAnalysisError]);

  return {
    status: gapAnalysis.status,
    questions: gapAnalysis.questions,
    overallAssessment: gapAnalysis.overallAssessment,
    reclassification: gapAnalysis.reclassification,
    errorMessage: gapAnalysis.errorMessage,
    runAnalysis,
    answerQuestion: answerGapQuestion,
    snoozeQuestion: snoozeGapQuestion,
  };
}
