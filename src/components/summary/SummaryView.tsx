import { motion } from 'framer-motion';
import { useSessionStore } from '@/store/session-store';
import { StageSummary } from './StageSummary';
import { NextSteps } from './NextSteps';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

export function SummaryView() {
  const { stages, resetSession } = useSessionStore();

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');

  const gatherResult = stages.GATHER.result;
  const presentResult = stages.PRESENT.result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl py-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-navy mb-2">
          {allComplete ? 'Your AI Workflow Summary' : 'Progress So Far'}
        </h1>
        <p className="text-sm text-gray-500">
          {allComplete
            ? 'Here is a complete overview of your decisions and recommended next steps.'
            : 'Complete all three stages to see your full summary.'}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {stageOrder.map((stage) => {
          const stageData = stages[stage];
          if (stageData.status !== 'complete' || !stageData.result) return null;
          return (
            <StageSummary key={stage} stage={stage} result={stageData.result} />
          );
        })}
      </div>

      {gatherResult && (
        <NextSteps
          protectionLevel={gatherResult.protectionLevel}
          outputFormat={presentResult?.outputFormat}
          onStartOver={resetSession}
        />
      )}
    </motion.div>
  );
}
