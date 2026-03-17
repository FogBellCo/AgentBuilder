import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useAISummary } from '@/hooks/use-ai-summary';
import { buildIntakeJson, downloadJson, shareSummary, copyToClipboard } from '@/lib/summary-formatter';
import { protectionLevels } from '@/data/protection-levels';
import type { Stage, IntakePayload } from '@/types/decision-tree';
import { SummaryTabToggle } from './SummaryTabToggle';
import { SummaryLoadingState } from './SummaryLoadingState';
import { EditableSection } from './EditableSection';
import { MyAnswersView } from './MyAnswersView';
import { UnansweredQuestionsPanel } from './UnansweredQuestionsPanel';
import { ManualEditConflict } from './ManualEditConflict';
import { SummaryExportBar } from './SummaryExportBar';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

const sectionConfig: { key: string; title: string; editable: boolean }[] = [
  { key: 'executiveSummary', title: 'Executive Summary', editable: true },
  { key: 'projectOverview', title: 'Project Overview', editable: true },
  { key: 'dataClassification', title: 'Data Classification', editable: true },
  { key: 'aiProcessingPlan', title: 'AI Processing Plan', editable: true },
  { key: 'outputDeliverables', title: 'Output Deliverables', editable: true },
  { key: 'feasibilitySummary', title: 'Feasibility Summary', editable: false },
  { key: 'complianceAndNextSteps', title: 'Compliance & Next Steps', editable: true },
];

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
  } = store;

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');

  // Tab state
  const [activeTab, setActiveTab] = useState<'ai-summary' | 'my-answers'>('ai-summary');

  // Gap analysis questions and reclassification from the store
  const gapQuestions = gapAnalysis.questions;
  const reclassification = gapAnalysis.reclassification ?? null;

  // AI Summary hook
  const {
    status: summaryStatus,
    sections,
    manualEdits,
    errorMessage,
    generateSummary,
    editSection,
    acceptNewForSection,
    getConflictingSections,
  } = useAISummary();

  // Conflict resolution state
  const [conflictKey, setConflictKey] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AbortController ref for summary generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Build intake payload helper — single source of truth
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
    };
    return buildIntakeJson(summaryState);
  }, [store.sessionId, projectIdea, stages, gatherDetails, refineDetails, presentDetails]);

  // Helper to get the SummaryState object for copy/share (avoids duplicating the shape)
  const getSummaryState = useCallback(() => ({
    sessionId: store.sessionId,
    projectIdea,
    gatherResult: stages.GATHER.result,
    gatherDetails,
    refineResult: stages.REFINE.result,
    refineDetails,
    presentResult: stages.PRESENT.result,
    presentDetails,
  }), [store.sessionId, projectIdea, stages, gatherDetails, refineDetails, presentDetails]);

  // Fire a summary generation call with abort support
  const triggerGeneration = useCallback(
    (payload: IntakePayload, answeredQuestions: typeof gapQuestions) => {
      // Abort any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      generateSummary(
        payload,
        answeredQuestions.filter((q) => q.status === 'answered'),
        controller.signal,
      );
    },
    [generateSummary],
  );

  // Auto-generate summary on mount if all stages complete and no summary yet
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

  // Handle answering a snoozed question
  const handleAnswerSnoozed = useCallback(
    (id: string, answer: string, selectedOptions?: string[]) => {
      // Update the store first
      answerGapQuestion(id, answer, selectedOptions);

      // Read latest questions from the store after the update.
      // Zustand's setState is synchronous, so getState() reflects the update immediately.
      const latestQuestions = useSessionStore.getState().gapAnalysis.questions;
      const payload = buildPayload();
      triggerGeneration(payload, latestQuestions);
    },
    [answerGapQuestion, buildPayload, triggerGeneration],
  );

  // Export handlers — all use buildPayload() / getSummaryState()
  const handleDownloadJson = () => {
    const payload = buildPayload();
    downloadJson(payload);
  };

  const handleCopyMarkdown = async () => {
    await copyToClipboard(getSummaryState());
  };

  const handleShareEmail = () => {
    shareSummary(getSummaryState());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { postSubmit } = await import('@/lib/api-client');
      const payload = buildPayload();
      const latestQuestions = useSessionStore.getState().gapAnalysis.questions;
      await postSubmit({
        intakePayload: payload,
        gapAnswers: latestQuestions.filter((q) => q.status === 'answered'),
        aiSummary: sections,
        manualEdits,
      });
    } catch {
      // Submit failed — could show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accept reclassification
  const handleAcceptReclassification = () => {
    if (!reclassification) return;
    store.applyReclassification(reclassification.suggestedLevel);
  };

  const handleDismissReclassification = () => {
    // Clear the reclassification without applying it.
    // applyReclassification already clears it in the store; for dismiss we just
    // need to clear the reclassification field. We can reuse the store setter
    // by setting the gap analysis result without a reclassification.
    // Simplest: apply current level (no-op on protection level, clears flag).
    if (reclassification) {
      store.applyReclassification(reclassification.currentLevel);
    }
  };

  // Snoozed questions for the panel
  const snoozedQuestions = gapQuestions.filter((q) => q.status === 'snoozed');

  // Conflict resolution
  const conflictSection = conflictKey
    ? sectionConfig.find((s) => s.key === conflictKey)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl px-6 py-8"
    >
      {/* Back button */}
      <div className="mb-4 print:hidden">
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
          {allComplete ? 'Your AI Tool Request' : 'Progress So Far'}
        </h1>
        {!allComplete && (
          <p className="text-sm text-gray-500">
            Complete all three stages to see your full summary.
          </p>
        )}
      </div>

      {/* Unanswered Questions Panel */}
      {snoozedQuestions.length > 0 && (
        <div className="mb-6">
          <UnansweredQuestionsPanel
            questions={snoozedQuestions}
            onAnswer={handleAnswerSnoozed}
          />
        </div>
      )}

      {/* Reclassification Banner */}
      {reclassification && (
        <div className="mb-6 rounded-lg border-2 border-orange/30 bg-orange/5 p-5">
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
      {activeTab === 'ai-summary' ? (
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
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm text-red-600 mb-3">
                {errorMessage ?? 'Failed to generate summary. Please try again.'}
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
          )}

          {summaryStatus === 'ready' && sections && (
            <>
              {sectionConfig.map((sec) => {
                const content =
                  sections[sec.key as keyof typeof sections] ?? '';
                return (
                  <EditableSection
                    key={sec.key}
                    sectionKey={sec.key}
                    title={sec.title}
                    content={content}
                    manualEdit={manualEdits[sec.key]}
                    onEdit={editSection}
                    editable={sec.editable}
                  />
                );
              })}
            </>
          )}

          {summaryStatus === 'idle' && !allComplete && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                Complete all three pipeline stages to generate your AI summary.
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

      {/* Export Bar */}
      {allComplete && (
        <SummaryExportBar
          onDownloadJson={handleDownloadJson}
          onCopyMarkdown={handleCopyMarkdown}
          onShareEmail={handleShareEmail}
          onPrint={handlePrint}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Manual Edit Conflict Modal */}
      {conflictKey && conflictSection && sections && (
        <ManualEditConflict
          sectionKey={conflictKey}
          sectionTitle={conflictSection.title}
          currentEdit={manualEdits[conflictKey] ?? ''}
          newGenerated={
            sections[conflictKey as keyof typeof sections] ?? ''
          }
          onKeepEdit={() => {
            // Keep the manual edit, move to next conflict
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
