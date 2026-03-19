import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutputFormat, ProtectionLevel, FeasibilityResult } from '@/types/decision-tree';
import { checkFeasibility } from '@/lib/tree-engine';
import { outputFormats } from '@/data/output-formats';
import { protectionLevels } from '@/data/protection-levels';

interface FeasibilityCheckProps {
  outputFormat: OutputFormat;
  protectionLevel: ProtectionLevel;
  onContinue: () => void;
  onChangeFormat: () => void;
}

const feasibilityConfig = {
  allowed: {
    icon: CheckCircle2,
    title: 'Good to go!',
    color: 'text-green',
    bg: 'bg-green/5 border-green',
  },
  allowed_with_conditions: {
    icon: AlertTriangle,
    title: 'Possible with conditions',
    color: 'text-orange',
    bg: 'bg-orange/5 border-orange',
  },
  not_allowed: {
    icon: XCircle,
    title: 'Not available for this data level',
    color: 'text-p4',
    bg: 'bg-p4/5 border-p4',
  },
};

export function FeasibilityCheck({
  outputFormat,
  protectionLevel,
  onContinue,
  onChangeFormat,
}: FeasibilityCheckProps) {
  const result: FeasibilityResult = checkFeasibility(outputFormat, protectionLevel);
  const formatInfo = outputFormats.find((f) => f.format === outputFormat);
  const levelInfo = protectionLevels[protectionLevel];
  const config = feasibilityConfig[result.feasibility];
  const Icon = config.icon;

  const altFormatInfo = result.alternativeSuggestion
    ? outputFormats.find((f) => f.format === result.alternativeSuggestion)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <div className={cn('rounded-lg border-2 p-8', config.bg)}>
        <div className="flex items-center gap-3 mb-4">
          <Icon className={cn('h-8 w-8', config.color)} />
          <h3 className="text-xl font-bold text-navy">{config.title}</h3>
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-navy">Output format:</span>{' '}
            {formatInfo?.label ?? outputFormat}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-navy">Data level:</span>{' '}
            {levelInfo.level} ({levelInfo.label})
          </p>
        </div>

        {result.conditions && (
          <div className="mb-6 rounded-lg bg-white/60 p-4">
            <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">
              {result.feasibility === 'not_allowed' ? 'Why not?' : 'Requirements'}
            </p>
            <p className="text-sm text-gray-700">{result.conditions}</p>
          </div>
        )}

        {altFormatInfo && (
          <div className="mb-6 rounded-lg bg-blue/5 border border-blue/20 p-4">
            <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Suggested alternative
            </p>
            <p className="text-sm text-gray-700">
              Consider using <span className="font-medium">{altFormatInfo.label}</span> instead — it's compatible with your data level.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {result.feasibility !== 'not_allowed' && (
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white hover:bg-navy transition-colors"
            >
              See My Summary
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onChangeFormat}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-3 text-sm font-medium text-navy hover:border-blue transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Choose a Different Format
          </button>
        </div>
      </div>
    </motion.div>
  );
}
