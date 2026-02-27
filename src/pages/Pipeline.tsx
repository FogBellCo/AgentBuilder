import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { useSessionStore } from '@/store/session-store';

function TransitionMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 mx-auto max-w-xl rounded-lg border-2 border-blue/20 bg-blue/5 px-5 py-4 flex items-start gap-3"
    >
      <CheckCircle2 className="h-5 w-5 text-blue shrink-0 mt-0.5" />
      <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
    </motion.div>
  );
}

export function Pipeline() {
  const navigate = useNavigate();
  const { stages, projectIdea } = useSessionStore();

  useEffect(() => {
    if (!projectIdea) {
      navigate('/describe', { replace: true });
    }
  }, [projectIdea, navigate]);

  if (!projectIdea) return null;

  const gatherDone = stages.GATHER.status === 'complete';
  const refineDone = stages.REFINE.status === 'complete';
  const presentDone = stages.PRESENT.status === 'complete';
  const allComplete = gatherDone && refineDone && presentDone;

  // Determine transition message
  let transitionMessage: string | null = null;
  if (gatherDone && !refineDone) {
    transitionMessage =
      "You've identified your data and its access level — nice work! Next, tell us what you want AI to do with it.";
  } else if (gatherDone && refineDone && !presentDone) {
    transitionMessage =
      "Almost there! You've defined the AI tasks. Now choose how you want to see the results.";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="py-8"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/describe')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Your AI Workflow</h1>
          <p className="text-sm text-gray-500 mb-1">
            We'll walk through three steps: figure out where your data lives, define what AI should do with it, and pick how you want to see the results. Click a stage below to get started.
          </p>
          <p className="text-xs text-blue font-medium mt-2">
            Project: {projectIdea.title}
          </p>
        </div>

        <PipelineView />

        {transitionMessage && (
          <TransitionMessage message={transitionMessage} />
        )}

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
