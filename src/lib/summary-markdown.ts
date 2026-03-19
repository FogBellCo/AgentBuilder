import type { IntakePayload } from '@/types/decision-tree';
import type { GapQuestion } from '@/types/gap-analysis';
import type { AISummaryState } from '@/types/gap-analysis';

type SummarySections = NonNullable<AISummaryState['sections']>;

/**
 * Build a complete Markdown document from the AI-generated summary sections,
 * the structured intake payload, and any gap analysis answers.
 *
 * Format:
 *   # UCSD AI Tool Request — {title}
 *   ## Executive Summary
 *   ...
 *   ## Technical Notes
 *   ```json { payload } ```
 *   ---
 *   ## Raw Submission Data
 *   ### Your Request / Data Classification / etc.
 */
export function buildSpecMarkdown(
  sections: SummarySections,
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
): string {
  const lines: string[] = [];
  const title = intakePayload.projectIdea.title || 'Untitled Request';

  // ── Title ──
  lines.push(`# UCSD AI Tool Request — ${title}`);
  lines.push('');
  lines.push(`> Generated ${intakePayload.generatedAt}`);
  lines.push('');

  // ── AI-generated sections ──
  const sectionMap: { key: keyof SummarySections; title: string }[] = [
    { key: 'executiveSummary', title: 'Executive Summary' },
    { key: 'projectOverview', title: 'Project Overview' },
    { key: 'dataClassification', title: 'Data Classification' },
    { key: 'aiProcessingPlan', title: 'AI Processing Plan' },
    { key: 'outputDeliverables', title: 'Output Deliverables' },
    { key: 'feasibilitySummary', title: 'Feasibility Summary' },
    { key: 'complianceAndNextSteps', title: 'Compliance & Next Steps' },
  ];

  for (const sec of sectionMap) {
    const content = sections[sec.key];
    if (content) {
      lines.push(`## ${sec.title}`);
      lines.push('');
      lines.push(content);
      lines.push('');
    }
  }

  // ── Follow-up Answers ──
  const answered = gapAnswers.filter((q) => q.status === 'answered');
  if (answered.length > 0) {
    lines.push('## Follow-up Answers');
    lines.push('');
    for (const q of answered) {
      lines.push(`**Q:** ${q.question}`);
      const answerText =
        q.selectedOptions && q.selectedOptions.length > 0
          ? q.selectedOptions
              .map((optId) => {
                const opt = q.options?.find((o) => o.id === optId);
                return opt?.label ?? optId;
              })
              .join(', ')
          : q.answer ?? 'No answer provided';
      lines.push(`**A:** ${answerText}`);
      lines.push('');
    }
  }

  // ── Technical Notes (JSON payload) ──
  lines.push('## Technical Notes');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(intakePayload, null, 2));
  lines.push('```');
  lines.push('');

  // ── Divider ──
  lines.push('---');
  lines.push('');

  // ── Raw Submission Data ──
  lines.push('## Raw Submission Data');
  lines.push('');

  // Project Idea
  const pi = intakePayload.projectIdea;
  lines.push('### Your Request');
  lines.push('');
  if (pi.title) lines.push(`- **Title:** ${pi.title}`);
  if (pi.description) lines.push(`- **Description:** ${pi.description}`);
  if (pi.domain) lines.push(`- **Domain:** ${pi.domain}`);
  if (pi.currentProcess) lines.push(`- **How It's Done Today:** ${pi.currentProcess}`);
  lines.push('');

  // Data Classification
  const g = intakePayload.gather;
  lines.push('### Your Data');
  lines.push('');
  lines.push(`- **Protection Level:** ${g.protectionLevel} (${g.protectionLevelLabel})`);
  if (g.selectedDataSources.length > 0) {
    lines.push(
      `- **Selected Data Sources:** ${g.selectedDataSources.map((s) => `${s.level} (${s.label})`).join(', ')}`,
    );
  }
  if (g.details.dataType.length > 0) {
    lines.push(`- **Data Format:** ${g.details.dataType.join(', ')}`);
  }
  if (g.details.sourceSystem) {
    lines.push(`- **Where It Lives:** ${g.details.sourceSystem}`);
  }
  if (g.details.dataSize) {
    lines.push(`- **Data Size:** ${g.details.dataSize}`);
  }
  if (
    g.details.regulatoryContext &&
    g.details.regulatoryContext.length > 0 &&
    !(g.details.regulatoryContext.length === 1 && g.details.regulatoryContext[0] === 'none')
  ) {
    lines.push(`- **Special Rules:** ${g.details.regulatoryContext.join(', ')}`);
  }
  if (g.details.additionalNotes) {
    lines.push(`- **Additional Notes:** ${g.details.additionalNotes}`);
  }
  lines.push('');

  // Refinement Plan
  const r = intakePayload.refine;
  if (r.refinements.length > 0 || r.audience || r.additionalContext) {
    lines.push('### AI Tasks');
    lines.push('');
    if (r.refinements.length > 0) {
      for (const [i, ref] of r.refinements.entries()) {
        lines.push(
          `${i + 1}. **${ref.taskType}**${ref.description ? ` — ${ref.description}` : ''}`,
        );
        if (ref.dataPrep) {
          lines.push(`   - Data prep: ${ref.dataPrep}`);
        }
      }
    }
    if (r.audience) {
      lines.push(`- **Audience:** ${r.audience}`);
    }
    if (r.additionalContext) {
      lines.push(`- **Additional Context:** ${r.additionalContext}`);
    }
    lines.push('');
  }

  // Output Formats
  const p = intakePayload.present;
  if (p.outputs.length > 0) {
    lines.push('### Output Formats');
    lines.push('');
    for (const o of p.outputs) {
      const status =
        o.feasibility === 'allowed'
          ? 'Allowed'
          : o.feasibility === 'allowed_with_conditions'
            ? 'Conditional'
            : 'Not Available';
      lines.push(`- **${o.formatLabel}** [${status}]`);
      if (o.description) {
        lines.push(`  - ${o.description}`);
      }
      if (o.conditions) {
        lines.push(`  - Note: ${o.conditions}`);
      }
    }
    lines.push('');
  }

  // Next Steps
  if (intakePayload.nextSteps.length > 0) {
    lines.push('### Next Steps');
    lines.push('');
    for (const [i, step] of intakePayload.nextSteps.entries()) {
      lines.push(`${i + 1}. ${step}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
