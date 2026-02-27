import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutputFormat, ProtectionLevel } from '@/types/decision-tree';
import { checkFeasibility } from '@/lib/tree-engine';
import { outputFormats } from '@/data/output-formats';
import { protectionLevels } from '@/data/protection-levels';

interface MultiFeasibilityCheckProps {
  outputs: Array<{ format: OutputFormat; description: string }>;
  protectionLevel: ProtectionLevel;
  onConfirm: () => void;
  onChangeFormats: () => void;
}

const feasibilityIcons = {
  allowed: { icon: CheckCircle2, color: 'text-green', label: 'Allowed' },
  allowed_with_conditions: { icon: AlertTriangle, color: 'text-orange', label: 'Conditional' },
  not_allowed: { icon: XCircle, color: 'text-p4', label: 'Not available' },
};

export function MultiFeasibilityCheck({
  outputs,
  protectionLevel,
  onConfirm,
  onChangeFormats,
}: MultiFeasibilityCheckProps) {
  const levelInfo = protectionLevels[protectionLevel];

  const results = outputs.map((o) => {
    const feasibility = checkFeasibility(o.format, protectionLevel);
    const formatInfo = outputFormats.find((f) => f.format === o.format);
    return { ...o, feasibility, formatInfo };
  });

  const hasBlocked = results.some((r) => r.feasibility.feasibility === 'not_allowed');
  const allBlocked = results.every((r) => r.feasibility.feasibility === 'not_allowed');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-navy mb-2">
          Feasibility Check
        </h2>
        <p className="text-sm text-gray-500">
          Checking your selected formats against{' '}
          <span className="font-medium" style={{ color: levelInfo.color }}>
            {levelInfo.level} ({levelInfo.label})
          </span>{' '}
          data classification.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {results.map((r) => {
          const config = feasibilityIcons[r.feasibility.feasibility];
          const Icon = config.icon;

          return (
            <div
              key={r.format}
              className={cn(
                'rounded-lg border-2 p-4',
                r.feasibility.feasibility === 'not_allowed'
                  ? 'border-p4/30 bg-p4/5'
                  : r.feasibility.feasibility === 'allowed_with_conditions'
                    ? 'border-orange/30 bg-orange/5'
                    : 'border-green/30 bg-green/5',
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-navy">
                      {r.formatInfo?.label ?? r.format}
                    </h4>
                    <span className={cn('text-[10px] uppercase tracking-widest font-medium', config.color)}>
                      {config.label}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                  )}
                  {r.feasibility.conditions && (
                    <p className="text-xs text-gray-600 mt-1">
                      {r.feasibility.conditions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasBlocked && !allBlocked && (
        <div className="mb-6 rounded-lg bg-orange/5 border border-orange/20 p-4">
          <p className="text-xs text-gray-700">
            Some formats are not available for your data level. You can proceed
            with the allowed formats, or go back and change your selections.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!allBlocked && (
          <button
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white hover:bg-navy transition-colors"
          >
            See My Summary
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onChangeFormats}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-3 text-sm font-medium text-navy hover:border-blue transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Change Selections
        </button>
      </div>
    </motion.div>
  );
}
