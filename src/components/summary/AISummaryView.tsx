import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useUserSummary } from '@/hooks/use-user-summary';
import { buildIntakeJson, shareSummary } from '@/lib/summary-formatter';
import { postSubmit } from '@/lib/api-client';
import { protectionLevels } from '@/data/protection-levels';
import type { Stage, IntakePayload, ProtectionLevel } from '@/types/decision-tree';
import { SummaryTabToggle } from './SummaryTabToggle';
import type { SummaryTab } from './SummaryTabToggle';
import { SummaryLoadingState } from './SummaryLoadingState';
import { UserFriendlySummary } from './UserFriendlySummary';
import { DidWeGetThisRight } from './DidWeGetThisRight';
import { MyAnswersView } from './MyAnswersView';
import { UnansweredQuestionsPanel } from './UnansweredQuestionsPanel';
import { ManualEditConflict } from './ManualEditConflict';
import { UserExportBar } from './UserExportBar';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

// Map user summary section keys to their display titles for conflict modal
const userSectionTitles: Record<string, string> = {
  user_yourProject: 'Your Project',
  user_theData: 'The Data',
  user_whatAIWouldHandle: 'What AI Would Handle',
  user_howYoudSeeResults: "How You'd See Results",
};

export function AISummaryView() {
  const store = useSessionStore();
  const navigate = useNavigate();
  const {
    stages,
    projectIdea,
    gatherDetails,
    refineDetails,
    presentDetails,
    gapAnalysis,
    answerGapQuestion,
    userSummaryPromptDismissed,
    dismissUserSummaryPrompt,
    conversationalAnswers,
    stageAnswers,
  } = store;

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');

  // Tab state — default to "Your Summary"
  const [activeTab, setActiveTab] = useState<SummaryTab>('your-summary');

  // Gap analysis questions and reclassification
  const gapQuestions = gapAnalysis.questions;
  const reclassification = gapAnalysis.reclassification ?? null;

  // User summary hook (Spec 02)
  const {
    status: summaryStatus,
    sections,
    manualEdits,
    errorMessage,
    timeSavings,
    whatsNext,
    fallback,
    generateUserSummary,
    editSection,
    acceptNewForSection,
    getConflictingSections,
  } = useUserSummary();

  // Conflict resolution state
  const [conflictKey, setConflictKey] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AbortController ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Build intake payload
  const buildPayload = useCallback((): IntakePayload => {
    const summaryState = {
      sessionId: store.sessionId,
      projectIdea,
      gatherResult: stages.GATHER.result,
      gatherDetails,
      refineResult: stages.REFINE.result,
      refineDetails,
      presentResult: stages.PRESENT.result,
      presentDetails,
      conversationalAnswers,
      stageAnswers,
    };
    return buildIntakeJson(summaryState);
  }, [store.sessionId, projectIdea, stages, gatherDetails, refineDetails, presentDetails, conversationalAnswers, stageAnswers]);

  // Summary state helper for share/copy
  const getSummaryState = useCallback(() => ({
    sessionId: store.sessionId,
    projectIdea,
    gatherResult: stages.GATHER.result,
    gatherDetails,
    refineResult: stages.REFINE.result,
    refineDetails,
    presentResult: stages.PRESENT.result,
    presentDetails,
    conversationalAnswers,
    stageAnswers,
  }), [store.sessionId, projectIdea, stages, gatherDetails, refineDetails, presentDetails, conversationalAnswers, stageAnswers]);

  // Fire user summary generation
  const triggerGeneration = useCallback(
    (payload: IntakePayload, answeredQuestions: typeof gapQuestions) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      generateUserSummary(
        payload,
        answeredQuestions.filter((q) => q.status === 'answered'),
        controller.signal,
      );
    },
    [generateUserSummary],
  );

  // Auto-generate on mount if all stages complete and no summary yet
  useEffect(() => {
    if (allComplete && summaryStatus === 'idle') {
      const payload = buildPayload();
      const answered = gapQuestions.filter((q) => q.status === 'answered');
      triggerGeneration(payload, answered);
    }
  }, [allComplete, summaryStatus, buildPayload, gapQuestions, triggerGeneration]);

  // Check for conflicts after regeneration
  useEffect(() => {
    if (summaryStatus === 'ready') {
      const conflicts = getConflictingSections();
      if (conflicts.length > 0) {
        setConflictKey(conflicts[0]);
      }
    }
  }, [summaryStatus, getConflictingSections]);

  // Handle answering a snoozed question — triggers regeneration
  const handleAnswerSnoozed = useCallback(
    (id: string, answer: string, selectedOptions?: string[]) => {
      answerGapQuestion(id, answer, selectedOptions);
      const latestQuestions = useSessionStore.getState().gapAnalysis.questions;
      const payload = buildPayload();
      triggerGeneration(payload, latestQuestions);
    },
    [answerGapQuestion, buildPayload, triggerGeneration],
  );

  // Export handlers
  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShare = () => {
    shareSummary(getSummaryState());
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const latestQuestions = useSessionStore.getState().gapAnalysis.questions;
      await postSubmit({
        intakePayload: payload,
        gapAnswers: latestQuestions.filter((q) => q.status === 'answered'),
        userSummary: sections,
        manualEdits,
      });
    } catch {
      // Submit failed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reclassification handlers
  const handleAcceptReclassification = () => {
    if (!reclassification) return;
    store.applyReclassification(reclassification.suggestedLevel);
  };

  const handleDismissReclassification = () => {
    if (reclassification) {
      store.applyReclassification(reclassification.currentLevel);
    }
  };

  // Snoozed questions
  const snoozedQuestions = gapQuestions.filter((q) => q.status === 'snoozed');

  // Protection level for display
  const protectionLevel: ProtectionLevel = stages.GATHER.result?.protectionLevel ?? 'P1';

  // Conflict info
  const conflictTitle = conflictKey ? userSectionTitles[conflictKey] ?? conflictKey : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl px-6 py-8"
    >
      {/* Back button */}
      <div className="mb-4 print:hidden" data-no-print>
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
          {allComplete ? "Here's What You Told Us" : 'Progress So Far'}
        </h1>
        {allComplete ? (
          <p className="text-sm text-gray-500">
            A quick recap of your AI request
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Complete all three stages to see your full summary.
          </p>
        )}
      </div>

      {/* "Did we get this right?" banner */}
      {allComplete && !userSummaryPromptDismissed && summaryStatus === 'ready' && (
        <DidWeGetThisRight onDismiss={dismissUserSummaryPrompt} />
      )}

      {/* Reclassification Banner */}
      {reclassification && (
        <div data-reclassification-banner className="mb-6 rounded-lg border-2 border-orange/30 bg-orange/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-navy mb-1">
                Protection Level Change Suggested
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                Based on your answer, this project may need to be reclassified from{' '}
                <span className="font-medium">
                  {reclassification.currentLevel} (
                  {protectionLevels[reclassification.currentLevel]?.label})
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {reclassification.suggestedLevel} (
                  {protectionLevels[reclassification.suggestedLevel]?.label})
                </span>
                .
              </p>
              <p className="text-xs text-gray-500 mb-3">{reclassification.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptReclassification}
                  className="rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-blue transition-colors"
                >
                  <Shield className="inline h-3 w-3 mr-1" />
                  Accept Reclassification
                </button>
                <button
                  onClick={handleDismissReclassification}
                  className="rounded-lg border-2 border-gray-200 px-4 py-2 text-xs font-medium text-navy uppercase tracking-wider hover:border-blue transition-colors"
                >
                  Keep Current Level
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Toggle */}
      <SummaryTabToggle activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'your-summary' ? (
        <div className="space-y-4">
          {summaryStatus === 'loading' && (
            <SummaryLoadingState
              message={
                sections
                  ? 'Updating your summary...'
                  : 'Generating your summary...'
              }
            />
          )}

          {summaryStatus === 'error' && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-orange/20 bg-orange/5 p-5 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  {errorMessage ?? 'We couldn\'t generate your summary right now. Here\'s what we have from your answers.'}
                </p>
                <button
                  onClick={() => {
                    const payload = buildPayload();
                    const latestQuestions = useSessionStore.getState().gapAnalysis.questions;
                    triggerGeneration(payload, latestQuestions);
                  }}
                  className="rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-blue transition-colors"
                >
                  Try Again
                </button>
              </div>
              {/* Show fallback bullet-point view */}
              <UserFriendlySummary
                sections={null}
                manualEdits={manualEdits}
                onEdit={editSection}
                timeSavings={timeSavings}
                whatsNext={whatsNext}
                fallback={fallback}
                _protectionLevel={protectionLevel}
              />
            </div>
          )}

          {(summaryStatus === 'ready' || (summaryStatus === 'loading' && sections)) && (
            <UserFriendlySummary
              sections={sections}
              manualEdits={manualEdits}
              onEdit={editSection}
              timeSavings={timeSavings}
              whatsNext={whatsNext}
              fallback={fallback}
              _protectionLevel={protectionLevel}
            />
          )}

          {summaryStatus === 'idle' && !allComplete && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                Complete all three pipeline stages to generate your summary.
              </p>
            </div>
          )}
        </div>
      ) : (
        <MyAnswersView
          projectIdea={projectIdea}
          stages={stages}
          gatherDetails={gatherDetails}
          refineDetails={refineDetails}
          presentDetails={presentDetails}
          gapQuestions={gapQuestions}
        />
      )}

      {/* Unanswered Questions — below summary content */}
      {snoozedQuestions.length > 0 && (
        <div className="mt-8">
          <UnansweredQuestionsPanel
            questions={snoozedQuestions}
            onAnswer={handleAnswerSnoozed}
          />
        </div>
      )}

      {/* Export Bar */}
      {allComplete && (
        <UserExportBar
          onDownloadPdf={handleDownloadPdf}
          onShare={handleShare}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Manual Edit Conflict Modal */}
      {conflictKey && sections && (
        <ManualEditConflict
          sectionKey={conflictKey}
          sectionTitle={conflictTitle}
          currentEdit={manualEdits[conflictKey] ?? ''}
          newGenerated={
            (() => {
              const key = conflictKey.replace('user_', '');
              return sections[key as keyof typeof sections] ?? '';
            })()
          }
          onKeepEdit={() => {
            const conflicts = getConflictingSections();
            const nextIdx = conflicts.indexOf(conflictKey) + 1;
            setConflictKey(nextIdx < conflicts.length ? conflicts[nextIdx] : null);
          }}
          onAcceptNew={() => {
            acceptNewForSection(conflictKey);
            const conflicts = getConflictingSections();
            const nextIdx = conflicts.indexOf(conflictKey) + 1;
            setConflictKey(nextIdx < conflicts.length ? conflicts[nextIdx] : null);
          }}
        />
      )}
    </motion.div>
  );
}
