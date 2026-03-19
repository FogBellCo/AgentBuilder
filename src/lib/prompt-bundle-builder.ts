/**
 * Client-side builder for the Claude Code Prompt Bundle.
 *
 * Assembles deterministic sections of the prompt bundle locally.
 * AI-generated sections come from the server.
 * This file handles the protection-level constraints and data requirements
 * sections that are deterministic.
 */

import type {
  IntakePayload,
  ProtectionLevel,
} from '@/types/decision-tree';
import type { OSISummary } from '@/types/summaries';

// --- Protection Level Constraints (deterministic) ---

const protectionLevelConstraints: Record<ProtectionLevel, string> = {
  P1: 'No access restrictions required. Data is public.',
  P2: `- All endpoints must require UCSD SSO authentication
- Data must not be exposed to unauthenticated users
- Use UCSD Active Directory for identity`,
  P3: `- Requires API key authentication beyond SSO
- All data access must be audit-logged
- VPN may be required for data source access
- Data steward approval required before deployment
- Consider encryption at rest and in transit`,
  P4: `- **AI processing of raw data is prohibited under UC policy**
- Must use de-identified data only
- Consult UCSD IT Security before proceeding
- Consider synthetic data for development/testing`,
};

/**
 * Build the deterministic parts of the prompt bundle.
 * AI-generated parts (business context, functional requirements, architecture,
 * acceptance criteria, implementation notes, out of scope) come from the server.
 */
export function buildPromptBundleDeterministic(
  intake: IntakePayload,
  osiSummary: OSISummary | null,
): string {
  const lines: string[] = [];

  lines.push(`# Project: ${intake.projectIdea.title || 'Untitled Request'}`);
  lines.push('');

  // Data Requirements
  lines.push('## Data Requirements');
  lines.push('');
  const sources = intake.gather.selectedDataSources.map(s => s.label).join(', ');
  lines.push(`- **Data sources:** ${sources || intake.gather.details.sourceSystem || 'Not specified'}`);
  lines.push(`- **Data types:** ${intake.gather.details.dataType.join(', ') || 'Not specified'}`);
  lines.push(`- **Data volume:** ${intake.gather.details.dataSize || 'Not specified'}`);
  lines.push(`- **Protection level:** ${intake.gather.protectionLevel} (${intake.gather.protectionLevelLabel})`);
  lines.push('');

  // Processing Requirements
  if (intake.refine.refinements.length > 0) {
    lines.push('## Processing Requirements');
    lines.push('');
    for (const r of intake.refine.refinements) {
      lines.push(`- **${r.taskType}:** ${r.description || 'No details specified'}`);
      if (r.dataPrep && r.dataPrep !== 'as-is') {
        lines.push(`  - Data prep: ${r.dataPrep}`);
      }
    }
    lines.push('');
  }

  // Output Requirements
  if (intake.present.outputs.length > 0) {
    lines.push('## Output Requirements');
    lines.push('');
    for (const o of intake.present.outputs) {
      const status = o.feasibility === 'allowed'
        ? 'Allowed'
        : o.feasibility === 'allowed_with_conditions'
          ? 'Conditional'
          : 'Not allowed';
      lines.push(`- **${o.formatLabel}** [${status}]: ${o.description || 'No description'}`);
      if (o.conditions) {
        lines.push(`  - Condition: ${o.conditions}`);
      }
    }
    lines.push('');
  }

  // Constraints
  lines.push('## Constraints');
  lines.push('');
  lines.push('### Data Classification');
  lines.push(`- Must comply with UC **${intake.gather.protectionLevel} (${intake.gather.protectionLevelLabel})** data classification`);
  lines.push(protectionLevelConstraints[intake.gather.protectionLevel]);
  lines.push('');

  // Regulatory
  lines.push('### Regulatory');
  const regContext = intake.gather.details.regulatoryContext?.filter(r => r !== 'none') ?? [];
  if (regContext.length > 0) {
    for (const reg of regContext) {
      lines.push(`- ${reg} compliance required`);
    }
  } else {
    lines.push('No specific regulatory requirements identified.');
  }
  lines.push('');

  // Feasibility conditions
  const conditionalOutputs = intake.present.outputs.filter(
    o => o.feasibility === 'allowed_with_conditions'
  );
  if (conditionalOutputs.length > 0) {
    lines.push('### Feasibility Conditions');
    for (const o of conditionalOutputs) {
      lines.push(`- **${o.formatLabel}:** ${o.conditions || 'Conditions apply'}`);
    }
    lines.push('');
  }

  // Platform
  lines.push('### Platform');
  lines.push('- No platform preference specified');
  lines.push('');

  // User Profile
  lines.push('## User Profile');
  lines.push('');
  lines.push(`- **User count:** ${osiSummary?.desirability.customerSize ?? 'Not determined'}`);
  lines.push('- **Technical level:** Non-technical (university staff)');
  lines.push(`- **Current workflow:** ${intake.projectIdea.currentProcess || 'Not described'}`);
  lines.push('');

  // Scope
  lines.push('## Scope');
  lines.push('');
  lines.push('### In Scope');
  lines.push(`- **Process volume:** ${osiSummary?.viability.processVolume ?? 'TBD'}`);
  lines.push(`- **Current time per instance:** ${osiSummary?.viability.potentialSavingsPerCycle ?? 'TBD'}`);
  if (osiSummary?.viability.potentialSavingsPerMonth) {
    lines.push(`- **Target time savings:** ~80% reduction (${osiSummary.viability.potentialSavingsPerMonth})`);
  }
  if (intake.refine.refinements.length > 0) {
    lines.push('- **Processing tasks:**');
    for (const r of intake.refine.refinements) {
      lines.push(`  - ${r.taskType}${r.description ? `: ${r.description}` : ''}`);
    }
  }
  if (intake.present.outputs.length > 0) {
    lines.push('- **Output formats:**');
    for (const o of intake.present.outputs) {
      lines.push(`  - ${o.formatLabel}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
