import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/decision-tree';

const sectionLabels: Record<Stage, string> = {
  GATHER: 'Your Data',
  REFINE: 'Your Task',
  PRESENT: 'Your Output',
};

// Estimated longest path per stage
const estimatedTotals: Record<Stage, number> = {
  GATHER: 3,
  REFINE: 5,
  PRESENT: 2,
};

const AVG_SECONDS_PER_QUESTION = 18;

interface WizardProgressPillProps {
  stage: Stage;
  history: Array<{ stage: Stage; nodeId: string }>;
  currentNodeId: string | null;
}

function getQuestionProgress(
  stage: Stage,
  history: Array<{ stage: Stage; nodeId: string }>,
) {
  const stageHistory = history.filter((h) => h.stage === stage);
  const visited = new Set(stageHistory.map((h) => h.nodeId));
  const currentIndex = visited.size + 1;
  const total = Math.max(estimatedTotals[stage], currentIndex);
  return { currentIndex, total };
}

function getTimeEstimate(remaining: number): string {
  if (remaining <= 1) return 'Almost done!';
  const minutes = Math.max(1, Math.round((remaining * AVG_SECONDS_PER_QUESTION) / 60));
  return `~${minutes} min`;
}

export function WizardProgressPill({ stage, history }: WizardProgressPillProps) {
  const prefersReducedMotion = useReducedMotion();
  const { currentIndex, total } = getQuestionProgress(stage, history);
  const remaining = total - currentIndex;
  const timeEstimate = getTimeEstimate(remaining);
  const label = sectionLabels[stage];

  return (
    <div
      role="status"
      aria-label={`${label}: question ${currentIndex} of ${total}, approximately ${timeEstimate} remaining`}
      className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-navy">
        {label}
      </span>

      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < currentIndex;
          return (
            <motion.div
              key={i}
              layout={!prefersReducedMotion}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isFilled ? 'bg-blue' : 'bg-gray-200',
              )}
              animate={
                isFilled && !prefersReducedMotion
                  ? { scale: [1, 1.5, 1] }
                  : {}
              }
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          );
        })}
      </div>

      <span className="text-xs text-gray-500">
        {currentIndex} of {total}
      </span>

      <span className="text-xs text-gray-400" aria-hidden="true">
        &middot;
      </span>

      <span className="text-xs text-gray-400">
        {timeEstimate}
      </span>
    </div>
  );
}
