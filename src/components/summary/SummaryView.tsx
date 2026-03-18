import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Share2, Copy, Check, ArrowLeft, Users } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { ProjectIdeaSummary } from './ProjectIdeaSummary';
import { StageSummary } from './StageSummary';
import {
  buildIntakeJson,
  downloadJson,
  shareSummary,
  copyToClipboard,
} from '@/lib/summary-formatter';
import type { Stage, ConversationalAnswers } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

// Q-M1 options
const onBehalfOptions = [
  { value: 'self' as const, label: 'For myself' },
  { value: 'other' as const, label: 'On behalf of someone else' },
];

// Q-M2 options
const tritonGPTOptions = [
  { value: 'use_it', label: 'Yes, I already use it' },
  { value: 'heard_of', label: "I've heard of it" },
  { value: 'no', label: "No, what's that?" },
];

export function SummaryView() {
  const store = useSessionStore();
  const navigate = useNavigate();
  const {
    stages,
    projectIdea,
    gatherDetails,
    refineDetails,
    presentDetails,
    conversationalAnswers,
    stageAnswers,
    setConversationalAnswer,
  } = store;
  const [copied, setCopied] = useState(false);

  // Local state for metadata fields
  const [onBehalf, setOnBehalf] = useState<ConversationalAnswers['onBehalf']>(
    conversationalAnswers.onBehalf,
  );
  const [onBehalfName, setOnBehalfName] = useState(conversationalAnswers.onBehalfName);
  const [tritonGPT, setTritonGPT] = useState(conversationalAnswers.tritonGPT);

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');

  // Save metadata to store when values change
  const handleOnBehalfChange = (value: ConversationalAnswers['onBehalf']) => {
    setOnBehalf(value);
    setConversationalAnswer('onBehalf', value);
    if (value !== 'other') {
      setOnBehalfName('');
      setConversationalAnswer('onBehalfName', '');
    }
  };

  const handleOnBehalfNameChange = (value: string) => {
    setOnBehalfName(value);
    setConversationalAnswer('onBehalfName', value);
  };

  const handleTritonGPTChange = (value: string) => {
    setTritonGPT(value);
    setConversationalAnswer('tritonGPT', value);
  };

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
          {allComplete ? 'Your AI Tool Request' : 'Progress So Far'}
        </h1>
        {!allComplete && (
          <p className="text-sm text-gray-500">
            Complete all three stages to see your full summary.
          </p>
        )}
      </div>

      {/* TritonAI outreach message — top of page when complete */}
      {allComplete && (
        <div className="mb-6 rounded-lg border-2 border-blue/20 bg-blue/5 p-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-navy mb-1">
                Thank you for completing your intake!
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                A member of the TritonAI team will reach out to you with next steps
                based on your responses. You'll receive a detailed email with
                recommendations tailored to your request.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Before you submit — metadata questions */}
      {allComplete && (
        <div className="mb-6 rounded-lg border-2 border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            Before you submit
          </h3>

          {/* Q-M1: On behalf */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Are you submitting this for yourself or someone else?
            </label>
            <div className="flex flex-wrap gap-2">
              {onBehalfOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleOnBehalfChange(onBehalf === opt.value ? '' : opt.value)}
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    onBehalf === opt.value
                      ? 'border-blue bg-blue/5 text-blue'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {onBehalf === 'other' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={onBehalfName}
                  onChange={(e) => handleOnBehalfNameChange(e.target.value)}
                  placeholder="Their name and role"
                  maxLength={200}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>

          {/* Q-M2: TritonGPT */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Have you heard of TritonGPT?
            </label>
            <div className="flex flex-wrap gap-2">
              {tritonGPTOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTritonGPTChange(tritonGPT === opt.value ? '' : opt.value)}
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    tritonGPT === opt.value
                      ? 'border-blue bg-blue/5 text-blue'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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

      {/* Action Buttons — After summary details */}
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
    </motion.div>
  );
}
