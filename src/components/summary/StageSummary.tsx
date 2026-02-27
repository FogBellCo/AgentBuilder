import { CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage, StageResult } from '@/types/decision-tree';
import { protectionLevels } from '@/data/protection-levels';
import { outputFormats } from '@/data/output-formats';

interface StageSummaryProps {
  stage: Stage;
  result: StageResult;
}

const stageLabels: Record<Stage, string> = {
  GATHER: 'Gather',
  REFINE: 'Refine',
  PRESENT: 'Present',
};

const stageDescriptions: Record<Stage, string> = {
  GATHER: 'Data source and classification',
  REFINE: 'AI task and audience',
  PRESENT: 'Output format',
};

export function StageSummary({ stage, result }: StageSummaryProps) {
  const levelInfo = protectionLevels[result.protectionLevel];
  const formatInfo = result.outputFormat
    ? outputFormats.find((f) => f.format === result.outputFormat)
    : null;

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="h-5 w-5 text-green" />
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            {stageLabels[stage]}
          </h3>
          <p className="text-xs text-gray-500">{stageDescriptions[stage]}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: levelInfo.color }} />
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white',
            )}
            style={{ backgroundColor: levelInfo.color }}
          >
            {levelInfo.level} — {levelInfo.label}
          </span>
        </div>

        {formatInfo && (
          <div className="text-sm text-gray-600">
            <span className="font-medium text-navy">Output:</span> {formatInfo.label}
          </div>
        )}
      </div>
    </div>
  );
}
