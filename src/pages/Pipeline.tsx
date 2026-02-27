import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { useSessionStore } from '@/store/session-store';

export function Pipeline() {
  const navigate = useNavigate();
  const { stages } = useSessionStore();

  const allComplete =
    stages.GATHER.status === 'complete' &&
    stages.REFINE.status === 'complete' &&
    stages.PRESENT.status === 'complete';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="py-8"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Your AI Workflow</h1>
          <p className="text-sm text-gray-500">
            Click on a stage below to begin. Complete each stage to unlock the next.
          </p>
        </div>

        <PipelineView />

        {allComplete && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/summary')}
              className="rounded-lg bg-blue px-8 py-3 text-sm font-medium text-white hover:bg-navy transition-colors uppercase tracking-wider"
            >
              View Complete Summary
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
