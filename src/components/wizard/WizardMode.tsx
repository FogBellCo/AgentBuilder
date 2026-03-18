import { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useDecisionTree } from '@/hooks/use-decision-tree';
import { useSessionStore } from '@/store/session-store';
import { QuestionCard } from './QuestionCard';
import { WizardProgressPill } from './WizardProgressPill';
import { WizardBottomBar } from './WizardBottomBar';
import {
  questionVariants,
  questionVariantsReduced,
  questionTransition,
  questionTransitionReduced,
  type TransitionDirection,
} from './wizard-variants';
import type { Stage } from '@/types/decision-tree';

const sectionLabels: Record<Stage, string> = {
  GATHER: 'Your Data',
  REFINE: 'Your Task',
  PRESENT: 'Your Output',
};

interface WizardModeProps {
  stage: Stage;
}

export function WizardMode({ stage }: WizardModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    currentNode,
    selectOption,
    selectMultipleOptions,
    goBack,
    canGoBack,
  } = useDecisionTree(stage);

  const history = useSessionStore((s) => s.history);

  const directionRef = useRef<TransitionDirection>('forward');
  const overlayRef = useRef<HTMLDivElement>(null);

  const variants = prefersReducedMotion ? questionVariantsReduced : questionVariants;
  const transition = prefersReducedMotion ? questionTransitionReduced : questionTransition;

  // Scroll to top on question change
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentNode?.id]);

  const handleSelect = useCallback(
    (optionId: string) => {
      directionRef.current = 'forward';
      selectOption(optionId);
    },
    [selectOption],
  );

  const handleMultiSelect = useCallback(
    (optionIds: string[]) => {
      directionRef.current = 'forward';
      selectMultipleOptions(optionIds);
    },
    [selectMultipleOptions],
  );

  const handleBack = useCallback(() => {
    directionRef.current = 'backward';
    goBack();
  }, [goBack]);

  if (!currentNode) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Full-viewport overlay */}
      <div
        ref={overlayRef}
        className="wizard-overlay fixed inset-0 top-[57px] z-30 bg-white overflow-y-auto"
        role="region"
        aria-label={`${sectionLabels[stage]} wizard - Question`}
        aria-live="polite"
      >
        {/* Progress pill - sticky top center */}
        <div className="sticky top-4 z-10 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <WizardProgressPill
              stage={stage}
              history={history}
              currentNodeId={currentNode.id}
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex min-h-[calc(100vh-57px)] items-start pt-8 pb-32 md:items-center md:pt-0 md:pb-12 justify-center px-5 md:px-6">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={directionRef.current}>
              <motion.div
                key={currentNode.id}
                custom={directionRef.current}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <QuestionCard
                  node={currentNode}
                  onSelectOption={handleSelect}
                  onSelectMultiple={handleMultiSelect}
                  onBack={canGoBack ? handleBack : null}
                />
              </motion.div>
            </AnimatePresence>

            {/* Desktop back button */}
            {canGoBack && (
              <div className="mt-8 hidden md:block">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
              </div>
            )}

            {/* Desktop keyboard hint */}
            <div className="mt-4 hidden md:block text-center">
              <p className="text-[11px] text-gray-300">
                Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-400">1</kbd>-<kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-400">9</kbd> to select
                {canGoBack && (
                  <>
                    {' '}&middot; <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-400">Backspace</kbd> to go back
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar (back button only) */}
      <WizardBottomBar
        canGoBack={canGoBack}
        onBack={handleBack}
      />
    </>
  );
}
