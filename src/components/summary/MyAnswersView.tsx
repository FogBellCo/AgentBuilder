import { Shield, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Stage,
  StageStatus,
  StageResult,
  ProjectIdea,
  GatherDetails,
  RefineDetails,
  PresentDetails,
} from '@/types/decision-tree';
import type { GapQuestion } from '@/types/gap-analysis';
import { protectionLevels } from '@/data/protection-levels';
import { outputFormats } from '@/data/output-formats';
import { AnswerCard } from './AnswerCard';
import { DecisionPathDisplay } from './DecisionPathDisplay';

interface MyAnswersViewProps {
  projectIdea: ProjectIdea | null;
  stages: Record<Stage, { status: StageStatus; result?: StageResult }>;
  gatherDetails: GatherDetails | null;
  refineDetails: RefineDetails | null;
  presentDetails: PresentDetails | null;
  gapQuestions: GapQuestion[];
}

const taskLabels: Record<string, string> = {
  summarize: 'Summarize or extract key points',
  analyze: 'Analyze trends and patterns',
  compare: 'Compare data sets',
  recommend: 'Generate recommendations',
  classify: 'Classify or categorize',
  answer: 'Answer questions from documents',
  generate: 'Draft or create content',
  extract: 'Pull data from files',
};

const dataPrepLabels: Record<string, string> = {
  'as-is': 'Use as-is',
  filter: 'Filter to a subset',
  combine: 'Combine sources',
  deidentify: 'De-identify',
};

const audienceLabels: Record<string, string> = {
  'just-me': 'Just me',
  'my-team': 'My team or department',
  'campus-wide': 'Campus-wide',
  'public-external': 'Public or external audience',
};

const feasibilityConfig = {
  allowed: { icon: CheckCircle2, color: 'text-green', label: 'Allowed' },
  allowed_with_conditions: { icon: AlertTriangle, color: 'text-orange', label: 'Conditional' },
  not_allowed: { icon: XCircle, color: 'text-p4', label: 'Not Allowed' },
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="font-medium text-navy">{label}:</span>{' '}
      <span className="text-gray-600">{value}</span>
    </div>
  );
}

export function MyAnswersView({
  projectIdea,
  stages,
  gatherDetails,
  refineDetails,
  presentDetails,
  gapQuestions,
}: MyAnswersViewProps) {
  const gatherResult = stages.GATHER.result;
  const refineResult = stages.REFINE.result;
  const presentResult = stages.PRESENT.result;

  const answeredGapQuestions = gapQuestions.filter((q) => q.status === 'answered');

  return (
    <div className="space-y-4">
      {/* Project Idea Card */}
      {projectIdea && (
        <AnswerCard title="Your Request">
          {projectIdea.title && <DetailRow label="Title" value={projectIdea.title} />}
          {projectIdea.description && (
            <DetailRow label="Description" value={projectIdea.description} />
          )}
          {projectIdea.domain && <DetailRow label="Domain" value={projectIdea.domain} />}
          {projectIdea.currentProcess && (
            <DetailRow label="How It's Done Today" value={projectIdea.currentProcess} />
          )}
        </AnswerCard>
      )}

      {/* GATHER Card */}
      {gatherResult && (
        <AnswerCard title="Your Data">
          <DecisionPathDisplay
            stage="GATHER"
            stageAnswers={gatherResult.answers}
          />

          {/* Protection Level Badge */}
          {(() => {
            const levelInfo = protectionLevels[gatherResult.protectionLevel];
            return (
              <div className="flex items-center gap-2 mt-2">
                <Shield className="h-4 w-4" style={{ color: levelInfo.color }} />
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: levelInfo.color }}
                >
                  {levelInfo.level} — {levelInfo.label}
                </span>
              </div>
            );
          })()}

          <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-3">
            {gatherDetails && gatherDetails.dataType.length > 0 && (
              <DetailRow label="Data Format" value={gatherDetails.dataType.join(', ')} />
            )}
            {gatherDetails?.sourceSystem && (
              <DetailRow label="Where It Lives" value={gatherDetails.sourceSystem} />
            )}
            {gatherDetails?.dataSize && (
              <DetailRow label="Data Size" value={gatherDetails.dataSize} />
            )}
            {gatherDetails?.regulatoryContext &&
              gatherDetails.regulatoryContext.length > 0 &&
              !(
                gatherDetails.regulatoryContext.length === 1 &&
                gatherDetails.regulatoryContext[0] === 'none'
              ) && (
                <DetailRow
                  label="Special Rules"
                  value={gatherDetails.regulatoryContext.join(', ')}
                />
              )}
            {gatherDetails?.additionalNotes && (
              <DetailRow label="Additional Notes" value={gatherDetails.additionalNotes} />
            )}
          </div>
        </AnswerCard>
      )}

      {/* REFINE Card */}
      {refineResult && (
        <AnswerCard title="Your AI Tasks">
          <DecisionPathDisplay
            stage="REFINE"
            stageAnswers={refineResult.answers}
          />

          {refineDetails && (
            <div className="mt-2 space-y-2 border-t border-gray-100 pt-3">
              {refineDetails.refinements.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-navy">AI Tasks:</span>
                  {refineDetails.refinements.map((r, i) => (
                    <div
                      key={r.id}
                      className="rounded bg-gray-50 px-3 py-2 text-xs mt-1"
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
                </div>
              )}

              {/* Audience */}
              {refineResult.answers['refine-audience'] && (
                <DetailRow
                  label="Audience"
                  value={
                    audienceLabels[refineResult.answers['refine-audience']] ??
                    refineResult.answers['refine-audience']
                  }
                />
              )}

              {refineDetails.additionalContext && (
                <DetailRow
                  label="Additional Context"
                  value={refineDetails.additionalContext}
                />
              )}
            </div>
          )}
        </AnswerCard>
      )}

      {/* PRESENT Card */}
      {presentResult && (
        <AnswerCard title="Your Results">
          <DecisionPathDisplay
            stage="PRESENT"
            stageAnswers={presentResult.answers}
          />

          {presentDetails && presentDetails.outputs.length > 0 && (
            <div className="mt-2 space-y-2 border-t border-gray-100 pt-3">
              <span className="text-xs font-medium text-navy">Selected Outputs:</span>
              {presentDetails.outputs.map((o) => {
                const fmtInfo = outputFormats.find((f) => f.format === o.format);
                const feasibilityKey = o.feasibility?.feasibility ?? 'not_allowed';
                const fConfig = feasibilityConfig[feasibilityKey];
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
                      <p className="text-gray-400 mt-0.5">
                        Status: {fConfig.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnswerCard>
      )}

      {/* Gap Analysis Answers Card */}
      {answeredGapQuestions.length > 0 && (
        <AnswerCard title="Follow-up Answers">
          <div className="space-y-3">
            {answeredGapQuestions.map((q) => (
              <div key={q.id} className="text-xs">
                <p className="font-medium text-navy">Q: {q.question}</p>
                <p className="text-gray-600 mt-0.5">
                  A:{' '}
                  {q.selectedOptions && q.selectedOptions.length > 0
                    ? q.selectedOptions
                        .map((optId) => {
                          const opt = q.options?.find((o) => o.id === optId);
                          return opt?.label ?? optId;
                        })
                        .join(', ')
                    : q.answer
                      ? q.answer
                      : 'No answer provided'}
                </p>
              </div>
            ))}
          </div>
        </AnswerCard>
      )}
    </div>
  );
}
