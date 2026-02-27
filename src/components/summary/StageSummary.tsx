import { CheckCircle2, Shield, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Stage,
  StageResult,
  GatherDetails,
  RefineDetails,
  PresentDetails,
} from '@/types/decision-tree';
import { protectionLevels } from '@/data/protection-levels';
import { outputFormats } from '@/data/output-formats';

interface StageSummaryProps {
  stage: Stage;
  result: StageResult;
  gatherDetails?: GatherDetails | null;
  refineDetails?: RefineDetails | null;
  presentDetails?: PresentDetails | null;
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

const taskLabels: Record<string, string> = {
  summarize: 'Summarize or extract key points',
  analyze: 'Analyze trends and patterns',
  compare: 'Compare data sets',
  recommend: 'Generate recommendations',
  classify: 'Classify or categorize',
};

const dataPrepLabels: Record<string, string> = {
  'as-is': 'Use as-is',
  filter: 'Filter to a subset',
  combine: 'Combine sources',
  deidentify: 'De-identify',
};

const feasibilityIcons = {
  allowed: { icon: CheckCircle2, color: 'text-green' },
  allowed_with_conditions: { icon: AlertTriangle, color: 'text-orange' },
  not_allowed: { icon: XCircle, color: 'text-p4' },
};

export function StageSummary({
  stage,
  result,
  gatherDetails,
  refineDetails,
  presentDetails,
}: StageSummaryProps) {
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
        {/* Protection Level Badge */}
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

        {/* GATHER Details */}
        {stage === 'GATHER' && gatherDetails && (
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            {gatherDetails.dataType && (
              <DetailRow label="Data Type" value={gatherDetails.dataType} />
            )}
            {gatherDetails.sourceSystem && (
              <DetailRow
                label="Source System"
                value={gatherDetails.sourceSystem}
              />
            )}
            {gatherDetails.dataSize && (
              <DetailRow label="Data Size" value={gatherDetails.dataSize} />
            )}
            {gatherDetails.additionalNotes && (
              <DetailRow label="Notes" value={gatherDetails.additionalNotes} />
            )}
          </div>
        )}

        {/* REFINE Details */}
        {stage === 'REFINE' && refineDetails && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {refineDetails.refinements.map((r, i) => (
              <div
                key={r.id}
                className="rounded bg-gray-50 px-3 py-2 text-xs"
              >
                <span className="font-medium text-navy">
                  {i + 1}. {taskLabels[r.taskType] ?? r.taskType}
                </span>
                {r.description && (
                  <p className="text-gray-500 mt-0.5">{r.description}</p>
                )}
                {r.dataPrep && (
                  <p className="text-gray-400 mt-0.5">
                    Prep: {dataPrepLabels[r.dataPrep] ?? r.dataPrep}
                  </p>
                )}
              </div>
            ))}
            {refineDetails.additionalContext && (
              <DetailRow
                label="Additional Context"
                value={refineDetails.additionalContext}
              />
            )}
          </div>
        )}

        {/* PRESENT Details */}
        {stage === 'PRESENT' && presentDetails && presentDetails.outputs.length > 0 ? (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {presentDetails.outputs.map((o) => {
              const fmtInfo = outputFormats.find((f) => f.format === o.format);
              const fConfig = feasibilityIcons[o.feasibility.feasibility];
              const FIcon = fConfig.icon;
              return (
                <div
                  key={o.format}
                  className="flex items-start gap-2 rounded bg-gray-50 px-3 py-2 text-xs"
                >
                  <FIcon
                    className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', fConfig.color)}
                  />
                  <div>
                    <span className="font-medium text-navy">
                      {fmtInfo?.label ?? o.format}
                    </span>
                    {o.description && (
                      <p className="text-gray-500 mt-0.5">{o.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          stage === 'PRESENT' &&
          formatInfo && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-navy">Output:</span>{' '}
              {formatInfo.label}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="font-medium text-navy">{label}:</span>{' '}
      <span className="text-gray-600">{value}</span>
    </div>
  );
}
