import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useStartOver } from '@/hooks/use-start-over';
import { ProjectIdeaSummary } from './ProjectIdeaSummary';
import { StageSummary } from './StageSummary';
import { NextSteps } from './NextSteps';
import {
  buildIntakeJson,
  downloadJson,
  shareSummary,
  copyToClipboard,
} from '@/lib/summary-formatter';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

export function SummaryView() {
  const store = useSessionStore();
  const { stages, projectIdea, gatherDetails, refineDetails, presentDetails } =
    store;
  const startOver = useStartOver();
  const [copied, setCopied] = useState(false);

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');
  const gatherResult = stages.GATHER.result;
  const presentResult = stages.PRESENT.result;

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

  const handleDownload = () => {
    const payload = buildIntakeJson(summaryState);
    downloadJson(payload);
  };

  const handleShare = () => {
    shareSummary(summaryState);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(summaryState);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl py-8"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-navy mb-2">
          {allComplete ? 'Your AI Workflow Summary' : 'Progress So Far'}
        </h1>
        {allComplete ? (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Sparkles className="h-4 w-4 text-blue" />
            <p className="text-sm text-gray-600">
              Here's your personalized AI workflow plan. We've mapped out the data,
              defined the tasks, and picked the format — you're ready for next steps.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Complete all three stages to see your full summary.
          </p>
        )}
      </div>

      {/* Next Steps — Promoted to top when complete */}
      {allComplete && gatherResult && (
        <div className="mb-6">
          <NextSteps
            protectionLevel={gatherResult.protectionLevel}
            outputFormat={presentResult?.outputFormat}
            onStartOver={startOver}
          />
        </div>
      )}

      {/* Action Buttons — Right after next steps */}
      {allComplete && (
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-xs font-medium text-white hover:bg-blue transition-colors uppercase tracking-wider"
          >
            <Download className="h-3.5 w-3.5" />
            Download JSON
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-5 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share via Email
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-5 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      )}

      {/* Project & Stage Details */}
      <div className="space-y-4 mb-8">
        {projectIdea && <ProjectIdeaSummary idea={projectIdea} />}

        {stageOrder.map((stage) => {
          const stageData = stages[stage];
          if (stageData.status !== 'complete' || !stageData.result) return null;
          return (
            <StageSummary
              key={stage}
              stage={stage}
              result={stageData.result}
              gatherDetails={stage === 'GATHER' ? gatherDetails : undefined}
              refineDetails={stage === 'REFINE' ? refineDetails : undefined}
              presentDetails={stage === 'PRESENT' ? presentDetails : undefined}
            />
          );
        })}
      </div>

      {/* Next Steps fallback for incomplete summary */}
      {!allComplete && gatherResult && (
        <NextSteps
          protectionLevel={gatherResult.protectionLevel}
          outputFormat={presentResult?.outputFormat}
          onStartOver={startOver}
        />
      )}
    </motion.div>
  );
}
