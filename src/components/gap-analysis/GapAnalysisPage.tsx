import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useGapAnalysis } from '@/hooks/use-gap-analysis';
import { GapLoadingState } from './GapLoadingState';
import { GapQuestionList } from './GapQuestionList';
import { ReclassificationBanner } from './ReclassificationBanner';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

export function GapAnalysisPage() {
  const navigate = useNavigate();
  const { stages, applyReclassification } = useSessionStore();
  const {
    status,
    questions,
    overallAssessment,
    reclassification,
    errorMessage,
    runAnalysis,
    answerQuestion,
    snoozeQuestion,
  } = useGapAnalysis();

  const allStagesComplete = stageOrder.every(
    (s) => stages[s].status === 'complete',
  );

  // Redirect if stages aren't all complete
  useEffect(() => {
    if (!allStagesComplete) {
      navigate('/pipeline', { replace: true });
    }
  }, [allStagesComplete, navigate]);

  // Auto-run analysis on mount if idle (first time visiting)
  useEffect(() => {
    if (allStagesComplete && status === 'idle') {
      runAnalysis();
    }
  }, [allStagesComplete, status, runAnalysis]);

  const pendingCount = questions.filter((q) => q.status === 'pending').length;
  const allResolved = questions.length > 0 && pendingCount === 0;
  const noGaps = status === 'ready' && questions.length === 0;

  const handleAcceptReclassification = () => {
    if (reclassification) {
      applyReclassification(reclassification.suggestedLevel);
    }
  };

  const handleDismissReclassification = () => {
    // Dismiss by applying current level (clears the reclassification from store)
    if (reclassification) {
      applyReclassification(reclassification.currentLevel);
    }
  };

  const resolvedCount = useMemo(
    () => questions.filter((q) => q.status !== 'pending').length,
    [questions],
  );

  if (!allStagesComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl px-6 py-8"
    >
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/pipeline')}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-navy mb-2">
          Reviewing Your Submission
        </h1>
        {status === 'loading' && (
          <p className="text-sm text-gray-500">
            We're checking for any gaps in your responses.
          </p>
        )}
        {status === 'ready' && questions.length > 0 && (
          <p className="text-sm text-gray-500">
            {overallAssessment || 'Please review the questions below to strengthen your submission.'}
          </p>
        )}
      </div>

      {/* Loading state */}
      {status === 'loading' && <GapLoadingState />}

      {/* Error state */}
      {status === 'error' && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800 mb-1">
            Something went wrong
          </p>
          <p className="text-xs text-red-600 mb-4">
            {errorMessage ?? 'Failed to analyze your submission. Please try again.'}
          </p>
          <button
            onClick={runAnalysis}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </button>
        </div>
      )}

      {/* Ready state with questions */}
      {status === 'ready' && questions.length > 0 && (
        <div className="space-y-6">
          {/* Reclassification banner */}
          {reclassification && (
            <ReclassificationBanner
              reclassification={reclassification}
              onAccept={handleAcceptReclassification}
              onDismiss={handleDismissReclassification}
            />
          )}

          {/* Progress indicator */}
          {resolvedCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue" />
              <span>
                {resolvedCount} of {questions.length} questions resolved
              </span>
            </div>
          )}

          {/* Question list */}
          <GapQuestionList
            questions={questions}
            onAnswer={answerQuestion}
            onSnooze={snoozeQuestion}
          />

          {/* All resolved message */}
          {allResolved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border-2 border-blue/20 bg-blue/5 p-5 text-center"
            >
              <CheckCircle2 className="mx-auto h-6 w-6 text-blue mb-2" />
              <p className="text-sm font-medium text-navy">
                All questions resolved!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You're ready to generate your summary.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* No gaps state */}
      {noGaps && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border-2 border-blue/20 bg-blue/5 p-8 text-center"
        >
          <CheckCircle2 className="mx-auto h-8 w-8 text-blue mb-3" />
          <p className="text-sm font-bold text-navy mb-1">
            Looks great — no additional questions!
          </p>
          <p className="text-xs text-gray-500">
            {overallAssessment || 'Your submission is thorough and ready for summary generation.'}
          </p>
        </motion.div>
      )}

      {/* Generate Summary button */}
      {status === 'ready' && (allResolved || noGaps) && (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/summary')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue px-8 py-3 text-sm font-medium text-white hover:bg-navy transition-colors uppercase tracking-wider"
          >
            Generate Summary
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pending questions — show Generate Summary as secondary */}
      {status === 'ready' && !allResolved && !noGaps && pendingCount > 0 && (
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2">
            Answer or snooze all questions to proceed
          </p>
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-8 py-3 text-sm font-medium text-gray-400 cursor-not-allowed uppercase tracking-wider"
          >
            Generate Summary
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
