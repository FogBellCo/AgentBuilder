import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, WifiOff, AlertTriangle, SkipForward } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useGapAnalysis } from '@/hooks/use-gap-analysis';
import { GapLoadingState } from './GapLoadingState';
import { GapQuestionList } from './GapQuestionList';
import { ReclassificationBanner } from './ReclassificationBanner';
import { CompletenessBar } from './CompletenessBar';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

function getCompletenessDescription(score: number, pendingCount: number): string {
  if (score >= 80 && pendingCount === 0) {
    return 'Your submission is thorough and ready for summary generation.';
  }
  if (score >= 80) {
    return 'Your submission looks great. Answer or snooze the remaining questions to proceed.';
  }
  if (score >= 50) {
    return 'Almost there -- a few questions will complete your submission.';
  }
  return 'Answering these questions will help our team understand your request better.';
}

export function GapAnalysisPage() {
  const navigate = useNavigate();
  const { stages, applyReclassification } = useSessionStore();
  const {
    status,
    questions,
    overallAssessment,
    reclassification,
    errorMessage,
    completenessScore,
    readinessLabel,
    runCount,
    pendingQuestions,
    snoozedQuestions,
    allResolved,
    noGaps,
    isStaticFallback,
    runAnalysis,
    answerQuestion,
    snoozeQuestion,
    unsnoozeQuestion,
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

  const handleAcceptReclassification = () => {
    if (reclassification) {
      applyReclassification(reclassification.suggestedLevel);
    }
  };

  const handleDismissReclassification = () => {
    if (reclassification) {
      applyReclassification(reclassification.currentLevel);
    }
  };

  const canProceed = allResolved || noGaps;
  const hasSnoozed = snoozedQuestions.length > 0;
  const hasPending = pendingQuestions.length > 0;
  const criticalPendingCount = pendingQuestions.filter((q) => q.priority === 'critical').length;

  const handleSkipToSummary = useCallback(() => {
    // Snooze all pending questions so they appear in the summary's UnansweredQuestionsPanel
    for (const q of pendingQuestions) {
      snoozeQuestion(q.id);
    }
    navigate('/summary');
  }, [pendingQuestions, snoozeQuestion, navigate]);

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
        {status === 'ready' && questions.length > 0 && overallAssessment && (
          <p className="text-sm text-gray-500">
            {overallAssessment}
          </p>
        )}
      </div>

      {/* Loading state */}
      {status === 'loading' && <GapLoadingState />}

      {/* Error state */}
      {status === 'error' && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
          {!navigator.onLine ? (
            <>
              <WifiOff className="mx-auto h-6 w-6 text-red-400 mb-2" />
              <p className="text-sm font-medium text-red-800 mb-1">
                You appear to be offline
              </p>
              <p className="text-xs text-red-600 mb-4">
                Please check your connection and try again.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-red-800 mb-1">
                Something went wrong
              </p>
              <p className="text-xs text-red-600 mb-4">
                {errorMessage ?? 'Failed to analyze your submission. Please try again.'}
              </p>
            </>
          )}
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
          {/* Completeness bar */}
          <CompletenessBar
            score={completenessScore}
            readinessLabel={readinessLabel}
            description={getCompletenessDescription(completenessScore, pendingQuestions.length)}
          />

          {/* Static-only fallback notice */}
          {isStaticFallback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  We couldn't reach our AI reviewer
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Here are some questions that could strengthen your submission. You can try the full analysis again later.
                </p>
              </div>
            </motion.div>
          )}

          {/* Reclassification banner */}
          {reclassification && (
            <ReclassificationBanner
              reclassification={reclassification}
              onAccept={handleAcceptReclassification}
              onDismiss={handleDismissReclassification}
            />
          )}

          {/* Question list with snoozed section */}
          <GapQuestionList
            questions={questions}
            onAnswer={answerQuestion}
            onSnooze={snoozeQuestion}
            onUnsnooze={unsnoozeQuestion}
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
              {hasSnoozed && (
                <p className="text-xs text-gray-400 mt-2">
                  You have {snoozedQuestions.length} snoozed question{snoozedQuestions.length === 1 ? '' : 's'}. Answering them could improve your submission.
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* No gaps state */}
      {noGaps && (
        <div className="space-y-6">
          <CompletenessBar
            score={completenessScore}
            readinessLabel={readinessLabel}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center"
          >
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-3" />
            <p className="text-sm font-bold text-navy mb-1">
              Looks great -- no additional questions!
            </p>
            <p className="text-xs text-gray-500">
              {overallAssessment || 'Your submission is thorough and ready for summary generation.'}
            </p>
          </motion.div>
        </div>
      )}

      {/* Generate Summary / Re-check buttons */}
      {status === 'ready' && (
        <div className="mt-8 space-y-3 text-center">
          {/* Re-check button (only after first run with answered questions) */}
          {runCount > 0 && questions.some((q) => q.status === 'answered') && (
            <button
              onClick={runAnalysis}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue transition-colors uppercase tracking-wider"
            >
              <RefreshCw className="h-3 w-3" />
              Re-check submission
            </button>
          )}

          {canProceed && (
            <div>
              <motion.button
                onClick={() => navigate('/summary')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue px-8 py-3 text-sm font-medium text-white hover:bg-navy transition-colors uppercase tracking-wider"
                animate={
                  allResolved || noGaps
                    ? {
                        boxShadow: [
                          '0 0 0 0 rgba(0, 106, 184, 0)',
                          '0 0 0 8px rgba(0, 106, 184, 0.15)',
                          '0 0 0 0 rgba(0, 106, 184, 0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: 1 }}
              >
                Generate Summary
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Sticky skip bar — visible when there are unanswered questions */}
      {status === 'ready' && hasPending && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-gray-600 leading-snug">
                {criticalPendingCount > 0 ? (
                  <>
                    <span className="font-semibold text-amber-700">
                      {criticalPendingCount} critical question{criticalPendingCount !== 1 ? 's' : ''} remaining.
                    </span>{' '}
                    The more you answer, the better your summary will be.
                  </>
                ) : (
                  <>
                    Answering remaining questions will improve your summary, but you can skip for now.
                  </>
                )}
              </p>
            </div>
            <button
              onClick={handleSkipToSummary}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider hover:border-blue hover:text-blue transition-colors shrink-0"
            >
              <SkipForward className="h-3 w-3" />
              Skip to Summary
            </button>
          </div>
        </div>
      )}

      {/* Spacer for sticky bar */}
      {status === 'ready' && hasPending && <div className="h-16" />}
    </motion.div>
  );
}
