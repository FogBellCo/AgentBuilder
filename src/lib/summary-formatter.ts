import type {
  IntakePayload,
  ProjectIdea,
  GatherDetails,
  RefineDetails,
  PresentDetails,
  ProtectionLevel,
  StageResult,
  ConversationalAnswers,
} from '@/types/decision-tree';
import { protectionLevels } from '@/data/protection-levels';
import { outputFormats } from '@/data/output-formats';
import { checkFeasibility } from '@/lib/tree-engine';
import { gatherTree } from '@/data/gather-tree';
import { computeAllDerivedValues } from '@/lib/intake-calculations';

// Build lookup for gather-start option IDs
const gatherStartNode = gatherTree.find((n) => n.id === 'gather-start');
const gatherOptionLookup: Record<string, { label: string; level: string }> = {};
if (gatherStartNode) {
  for (const opt of gatherStartNode.options) {
    if (opt.mapsToProtectionLevel) {
      gatherOptionLookup[opt.id] = {
        label: opt.label,
        level: opt.mapsToProtectionLevel,
      };
    }
  }
}

interface SummaryState {
  sessionId: string;
  projectIdea: ProjectIdea | null;
  gatherResult: StageResult | undefined;
  gatherDetails: GatherDetails | null;
  refineResult: StageResult | undefined;
  refineDetails: RefineDetails | null;
  presentResult: StageResult | undefined;
  presentDetails: PresentDetails | null;
  conversationalAnswers?: ConversationalAnswers;
  stageAnswers?: Record<string, Record<string, string>>;
}

export function buildIntakeJson(state: SummaryState): IntakePayload {
  const protectionLevel: ProtectionLevel =
    state.gatherResult?.protectionLevel ?? 'P1';
  const levelInfo = protectionLevels[protectionLevel];

  // Parse all selected data sources from gather-start multi-select answer
  const gatherStartAnswer = state.gatherResult?.answers?.['gather-start'] ?? '';
  const selectedDataSources = gatherStartAnswer
    .split(',')
    .filter(Boolean)
    .map((id) => gatherOptionLookup[id])
    .filter(Boolean);

  const refineAnswers = state.refineResult?.answers ?? {};
  const audience = refineAnswers['refine-audience'] ?? '';

  const outputs = state.presentDetails?.outputs ?? [];
  const presentOutputs = outputs.map((o) => {
    const formatInfo = outputFormats.find((f) => f.format === o.format);
    return {
      format: o.format,
      formatLabel: formatInfo?.label ?? o.format,
      description: o.description,
      feasibility: o.feasibility.feasibility,
      conditions: o.feasibility.conditions,
    };
  });

  // Fallback if no presentDetails but presentResult exists
  if (presentOutputs.length === 0 && state.presentResult?.outputFormat) {
    const fmt = state.presentResult.outputFormat;
    const formatInfo = outputFormats.find((f) => f.format === fmt);
    const feas = checkFeasibility(fmt, protectionLevel);
    presentOutputs.push({
      format: fmt,
      formatLabel: formatInfo?.label ?? fmt,
      description: '',
      feasibility: feas.feasibility,
      conditions: feas.conditions,
    });
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sessionId: state.sessionId,
    projectIdea: state.projectIdea ?? {
      title: '',
      description: '',
      domain: '',
      currentProcess: '',
    },
    gather: {
      protectionLevel,
      protectionLevelLabel: levelInfo.label,
      selectedDataSources,
      details: state.gatherDetails ?? {
        dataType: [],
        sourceSystem: '',
        dataSize: '',
        additionalNotes: '',
        regulatoryContext: [],
      },
    },
    refine: {
      refinements: state.refineDetails?.refinements ?? [],
      audience,
      additionalContext: state.refineDetails?.additionalContext ?? '',
    },
    present: {
      outputs: presentOutputs,
    },
    nextSteps: buildNextSteps(protectionLevel),
    conversationalAnswers: state.conversationalAnswers,
    derivedValues: state.conversationalAnswers
      ? computeAllDerivedValues(
          state.conversationalAnswers,
          state.stageAnswers ?? {},
          state.projectIdea,
          state.gatherDetails,
          state.presentDetails,
          protectionLevel,
        )
      : undefined,
  };
}

function buildNextSteps(protectionLevel: ProtectionLevel): string[] {
  const steps: string[] = [];
  if (protectionLevel === 'P1') {
    steps.push(
      'Your data is public — you can get started right away with any UCSD-approved AI tool.',
    );
  } else if (protectionLevel === 'P2') {
    steps.push(
      'Ensure you have UCSD SSO access configured for your AI tool.',
    );
    steps.push(
      'Verify your team has the same access permissions before sharing results.',
    );
  } else if (protectionLevel === 'P3') {
    steps.push('Contact your data steward to obtain API key credentials.');
    steps.push('Set up VPN access if required by your data source.');
    steps.push(
      'Ensure audit logging is enabled for your AI tool.',
    );
  } else {
    steps.push(
      'This data cannot be processed by AI tools under current UC policy.',
    );
    steps.push('Consider working with a de-identified subset of the data.');
    steps.push('Consult UCSD IT Security for alternative approaches.');
  }
  return steps;
}

export function formatSummaryAsPlainText(state: SummaryState): string {
  const payload = buildIntakeJson(state);
  const lines: string[] = [];

  lines.push('UCSD AI Tool Request Summary');
  lines.push('========================');
  lines.push('');

  if (payload.projectIdea.title) {
    lines.push(`Project: ${payload.projectIdea.title}`);
    if (payload.projectIdea.description) {
      lines.push(`Description: ${payload.projectIdea.description}`);
    }
    if (payload.projectIdea.domain) {
      lines.push(`Domain: ${payload.projectIdea.domain}`);
    }
    if (payload.projectIdea.currentProcess) {
      lines.push(`How It's Done Today: ${payload.projectIdea.currentProcess}`);
    }
    lines.push('');
  }

  lines.push('Your Data');
  lines.push('-------------------');
  lines.push(
    `Protection Level: ${payload.gather.protectionLevel} (${payload.gather.protectionLevelLabel})`,
  );
  if (payload.gather.selectedDataSources.length > 1) {
    lines.push(
      `Selected Data Sources: ${payload.gather.selectedDataSources.map((s) => `${s.level} (${s.label})`).join(', ')}`,
    );
  }
  if (payload.gather.details.dataType.length > 0) {
    lines.push(`Data Format: ${payload.gather.details.dataType.join(', ')}`);
  }
  if (payload.gather.details.sourceSystem) {
    lines.push(`Where It Lives: ${payload.gather.details.sourceSystem}`);
  }
  if (payload.gather.details.dataSize) {
    lines.push(`Data Size: ${payload.gather.details.dataSize}`);
  }
  if (
    payload.gather.details.regulatoryContext &&
    payload.gather.details.regulatoryContext.length > 0 &&
    !(payload.gather.details.regulatoryContext.length === 1 && payload.gather.details.regulatoryContext[0] === 'none')
  ) {
    lines.push(`Special Rules: ${payload.gather.details.regulatoryContext.join(', ')}`);
  }
  lines.push('');

  if (payload.refine.refinements.length > 0) {
    lines.push('AI Tasks');
    lines.push('---------------');
    payload.refine.refinements.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.taskType}${r.description ? ` — ${r.description}` : ''}`);
      if (r.dataPrep) {
        lines.push(`   Data prep: ${r.dataPrep}`);
      }
    });
    if (payload.refine.audience) {
      lines.push(`Audience: ${payload.refine.audience}`);
    }
    lines.push('');
  }

  if (payload.present.outputs.length > 0) {
    lines.push('Output Formats');
    lines.push('--------------');
    payload.present.outputs.forEach((o) => {
      const status =
        o.feasibility === 'allowed'
          ? 'Allowed'
          : o.feasibility === 'allowed_with_conditions'
            ? 'Conditional'
            : 'Not Available';
      lines.push(`- ${o.formatLabel} [${status}]`);
      if (o.description) {
        lines.push(`  ${o.description}`);
      }
      if (o.conditions) {
        lines.push(`  Note: ${o.conditions}`);
      }
    });
    lines.push('');
  }

  lines.push('Next Steps');
  lines.push('----------');
  payload.nextSteps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s}`);
  });

  return lines.join('\n');
}

export function downloadJson(payload: IntakePayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ucsd-ai-intake-${payload.sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildMailtoLink(state: SummaryState): string {
  const payload = buildIntakeJson(state);
  const subject = encodeURIComponent(
    `UCSD AI Tool Request: ${payload.projectIdea.title || 'Untitled'}`,
  );
  const body = encodeURIComponent(formatSummaryAsPlainText(state));
  return `mailto:?subject=${subject}&body=${body}`;
}

export async function shareSummary(state: SummaryState): Promise<boolean> {
  const text = formatSummaryAsPlainText(state);
  const payload = buildIntakeJson(state);

  if (navigator.share) {
    try {
      await navigator.share({
        title: `UCSD AI Tool Request: ${payload.projectIdea.title || 'Untitled'}`,
        text,
      });
      return true;
    } catch {
      // User cancelled or share failed — fall through to mailto
    }
  }

  window.location.href = buildMailtoLink(state);
  return true;
}

export async function copyToClipboard(state: SummaryState): Promise<boolean> {
  const text = formatSummaryAsPlainText(state);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// --- Spec 02: Full Export JSON ---

import type { FullExportJSON, UserSummarySections, OSISummary } from '@/types/summaries';
import type { GapQuestion } from '@/types/gap-analysis';

export function buildFullExportJson(
  intake: IntakePayload,
  userSections: UserSummarySections | null,
  timeSavings: string | null,
  whatsNext: string,
  osiSummary: OSISummary | null,
  gapQuestions: GapQuestion[],
  overallAssessment: string,
  manualEdits: Record<string, string>,
): FullExportJSON {
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    sessionId: intake.sessionId,
    intake,
    userSummary: {
      yourProject: userSections?.yourProject ?? '',
      theData: userSections?.theData ?? '',
      whatAIWouldHandle: userSections?.whatAIWouldHandle ?? '',
      howYoudSeeResults: userSections?.howYoudSeeResults ?? '',
      timeSavings,
      whatsNext,
    },
    osiSummary,
    gapAnalysis: {
      questions: gapQuestions,
      overallAssessment,
    },
    manualEdits,
  };
}

export function downloadFullExportJson(exportData: FullExportJSON): void {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ucsd-ai-intake-${exportData.sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
