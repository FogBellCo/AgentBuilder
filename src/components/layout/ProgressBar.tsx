import { useSessionStore } from '@/store/session-store';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];
const stageLabels: Record<Stage, string> = {
  GATHER: 'Gather',
  REFINE: 'Refine',
  PRESENT: 'Present',
};

export function ProgressBar() {
  const { stages } = useSessionStore();

  const completedCount = stageOrder.filter((s) => stages[s].status === 'complete').length;

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">
            Progress
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {completedCount} of 3 stages
          </span>
        </div>
        <div className="flex gap-2">
          {stageOrder.map((stage) => (
            <div key={stage} className="flex-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-500',
                  stages[stage].status === 'complete' && 'bg-green',
                  stages[stage].status === 'in_progress' && 'bg-blue',
                  stages[stage].status === 'not_started' && 'bg-gray-200',
                )}
              />
              <div className="mt-1 text-center">
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-widest font-medium',
                    stages[stage].status === 'complete' && 'text-green',
                    stages[stage].status === 'in_progress' && 'text-blue',
                    stages[stage].status === 'not_started' && 'text-gray-400',
                  )}
                >
                  {stageLabels[stage]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
