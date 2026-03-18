/**
 * Client-side logic for the user-facing summary.
 *
 * Handles:
 * - Time savings calculation and display (Section 5)
 * - "What's Next" template text (Section 6)
 * - Fallback bullet-point summary when AI is unavailable
 */

import type { ProtectionLevel, ProjectIdea, GatherDetails, RefineDetails, PresentDetails } from '@/types/decision-tree';
import type { GapQuestion } from '@/types/gap-analysis';
import { outputFormats } from '@/data/output-formats';

// --- Time Savings (Section 5) ---

// Frequency multipliers (instances per month)
const frequencyMultiplier: Record<string, number> = {
  few_times_month: 4,
  few_monthly: 4,
  few_times_week: 12,
  few_weekly: 12,
  daily: 22,
  multiple_daily: 66,
};

// Time per instance (hours)
const timePerInstanceMap: Record<string, number> = {
  few_minutes: 0.15,
  half_hour: 0.5,
  couple_hours: 2,
  half_day: 4,
};

// People multiplier
const peopleMultiplierMap: Record<string, number> = {
  just_me: 1,
  '2_3_people': 2.5,
  two_three: 2.5,
  small_team: 6,
  large_group: 15,
};

export interface TimeSavingsResult {
  monthlyHours: number;
  displayText: string;
}

export function calculateTimeSavings(
  frequency: string,
  timePerInstance: string,
  people: string,
): TimeSavingsResult | null {
  const freq = frequencyMultiplier[frequency];
  const time = timePerInstanceMap[timePerInstance];
  const peopleMult = peopleMultiplierMap[people];

  if (!freq || !time || !peopleMult) return null;

  const monthlyHours = Math.round(freq * time * peopleMult);

  let displayText: string;
  if (monthlyHours < 5) {
    displayText = "Your team spends a few hours a month on this. AI could help streamline it.";
  } else if (monthlyHours < 40) {
    displayText = `It sounds like your team spends about **${monthlyHours} hours/month** on this. AI could help get a good chunk of that time back.`;
  } else if (monthlyHours < 160) {
    const partTime = Math.round(monthlyHours / 160 * 10) / 10;
    const partTimeNote = partTime > 0.3 ? ' part-time' : '';
    displayText = `It sounds like your team spends about **${monthlyHours} hours/month** on this — that's like having a person dedicated to it${partTimeNote}. AI could help get most of that time back.`;
  } else {
    displayText = `Your team spends roughly **${monthlyHours} hours/month** on this — that's more than a full-time position. AI could have a major impact here.`;
  }

  return { monthlyHours, displayText };
}

// --- What's Next (Section 6) ---

const nextStepsTemplates: Record<ProtectionLevel, string> = {
  P1: "Our team will review this and you should hear back within a few business days. Since your data is public, you could even start experimenting with UCSD-approved AI tools right away.",
  P2: "Our team will review this and follow up within a few business days. We may have a couple of quick questions about access and permissions.",
  P3: "Our team will review this carefully given the data sensitivity. Expect to hear back within a week — we'll want to discuss access controls and compliance details.",
  P4: "Since this involves restricted data, our team will review this closely and reach out to discuss alternative approaches. We'll be in touch within a week.",
};

export function buildWhatsNext(
  protectionLevel: ProtectionLevel,
  snoozedCount: number,
): string {
  let text = nextStepsTemplates[protectionLevel];

  if (snoozedCount > 0) {
    text += `\n\nYou still have ${snoozedCount} question${snoozedCount === 1 ? '' : 's'} you skipped — you can come back and answer them anytime to strengthen your submission.`;
  }

  return text;
}

// --- Protection Level Language Mapping ---

const protectionLevelLanguage: Record<ProtectionLevel, string> = {
  P1: "This is publicly available data — no special access needed.",
  P2: "This is internal UCSD data that requires a UCSD login to access.",
  P3: "This is confidential data that needs special access permissions.",
  P4: "This data is restricted under UC policy — AI tools can't process it directly, but there may be workarounds.",
};

// --- Regulatory Context Language Mapping ---

const regulatoryLanguage: Record<string, string> = {
  FERPA: "Since this involves student records, FERPA rules apply.",
  HIPAA: "Since this involves health information, HIPAA rules apply.",
  PCI: "Since this involves payment data, PCI compliance is required.",
  GLBA: "Since this involves financial records, GLBA rules apply.",
};

// --- Feasibility Language Mapping ---

export const feasibilityLanguage: Record<string, string> = {
  allowed: "Good news — this works with your data.",
  allowed_with_conditions: "This can work, but",
  not_allowed: "Unfortunately, this output type isn't available for your data level.",
};

// --- Task Type Friendly Labels ---

const taskLabels: Record<string, string> = {
  summarize: 'Summarize key points',
  analyze: 'Spot trends and patterns',
  compare: 'Compare different data sets',
  recommend: 'Generate recommendations',
  classify: 'Sort and categorize items',
  answer: 'Answer questions from your documents',
  generate: 'Draft content',
  extract: 'Pull data from files',
};

// --- Fallback Builders ---

export interface FallbackItem {
  label: string;
  value: string;
}

export function buildProjectFallback(projectIdea: ProjectIdea | null): FallbackItem[] {
  if (!projectIdea) return [];
  const items: FallbackItem[] = [];
  if (projectIdea.title) items.push({ label: 'Project', value: projectIdea.title });
  if (projectIdea.description) items.push({ label: 'Description', value: projectIdea.description });
  if (projectIdea.currentProcess) items.push({ label: "How it's done today", value: projectIdea.currentProcess });
  if (projectIdea.domain) items.push({ label: 'Domain', value: projectIdea.domain });
  return items;
}

export function buildDataFallback(
  gatherDetails: GatherDetails | null,
  protectionLevel: ProtectionLevel,
): FallbackItem[] {
  const items: FallbackItem[] = [];
  items.push({ label: 'Access', value: protectionLevelLanguage[protectionLevel] });
  if (gatherDetails) {
    if (gatherDetails.sourceSystem) {
      items.push({ label: 'Source', value: gatherDetails.sourceSystem });
    }
    if (gatherDetails.dataType.length > 0) {
      items.push({ label: 'Data types', value: gatherDetails.dataType.join(', ') });
    }
    if (gatherDetails.dataSize) {
      items.push({ label: 'Volume', value: gatherDetails.dataSize });
    }
    const regContext = gatherDetails.regulatoryContext?.filter(r => r !== 'none') ?? [];
    for (const reg of regContext) {
      const lang = regulatoryLanguage[reg] ?? `This data has additional regulatory requirements: ${reg}.`;
      items.push({ label: 'Regulatory', value: lang });
    }
  }
  return items;
}

export function buildRefineFallback(refineDetails: RefineDetails | null): FallbackItem[] {
  if (!refineDetails) return [];
  const items: FallbackItem[] = [];
  for (const r of refineDetails.refinements) {
    const label = taskLabels[r.taskType] ?? r.taskType;
    items.push({ label, value: r.description || 'No additional details' });
  }
  if (refineDetails.additionalContext) {
    items.push({ label: 'Additional context', value: refineDetails.additionalContext });
  }
  return items;
}

export function buildOutputFallback(presentDetails: PresentDetails | null): FallbackItem[] {
  if (!presentDetails) return [];
  const items: FallbackItem[] = [];
  for (const o of presentDetails.outputs) {
    const fmtInfo = outputFormats.find(f => f.format === o.format);
    const label = fmtInfo?.label ?? o.format;
    const feasStatus = o.feasibility.feasibility;
    let statusText = feasibilityLanguage[feasStatus] ?? '';
    if (feasStatus === 'allowed_with_conditions' && o.feasibility.conditions) {
      statusText += ` ${o.feasibility.conditions}`;
    }
    items.push({
      label,
      value: o.description ? `${o.description}. ${statusText}` : statusText,
    });
  }
  return items;
}

export function buildFallbackUserSummary(
  projectIdea: ProjectIdea | null,
  gatherDetails: GatherDetails | null,
  refineDetails: RefineDetails | null,
  presentDetails: PresentDetails | null,
  protectionLevel: ProtectionLevel,
): {
  yourProject: FallbackItem[];
  theData: FallbackItem[];
  whatAIWouldHandle: FallbackItem[];
  howYoudSeeResults: FallbackItem[];
} {
  return {
    yourProject: buildProjectFallback(projectIdea),
    theData: buildDataFallback(gatherDetails, protectionLevel),
    whatAIWouldHandle: buildRefineFallback(refineDetails),
    howYoudSeeResults: buildOutputFallback(presentDetails),
  };
}

// --- User-Facing Markdown Export ---

export function buildUserFacingMarkdown(
  title: string,
  sections: {
    yourProject: string;
    theData: string;
    whatAIWouldHandle: string;
    howYoudSeeResults: string;
  },
  timeSavings: string | null,
  whatsNext: string,
  manualEdits: Record<string, string>,
  snoozedQuestions: GapQuestion[],
): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  lines.push(`# ${title || 'Your AI Request'}`);
  lines.push('');
  lines.push(`> Generated on ${date}`);
  lines.push('');

  lines.push('## Your Project');
  lines.push('');
  lines.push(manualEdits['user_yourProject'] ?? sections.yourProject);
  lines.push('');

  lines.push('## The Data');
  lines.push('');
  lines.push(manualEdits['user_theData'] ?? sections.theData);
  lines.push('');

  lines.push('## What AI Would Handle');
  lines.push('');
  lines.push(manualEdits['user_whatAIWouldHandle'] ?? sections.whatAIWouldHandle);
  lines.push('');

  lines.push("## How You'd See Results");
  lines.push('');
  lines.push(manualEdits['user_howYoudSeeResults'] ?? sections.howYoudSeeResults);
  lines.push('');

  if (timeSavings) {
    lines.push('## Time Savings');
    lines.push('');
    lines.push(timeSavings);
    lines.push('');
  }

  lines.push("## What's Next");
  lines.push('');
  lines.push(whatsNext);
  lines.push('');

  if (snoozedQuestions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`*${snoozedQuestions.length} question${snoozedQuestions.length === 1 ? '' : 's'} skipped — you can come back and answer them anytime.*`);
    lines.push('');
  }

  return lines.join('\n');
}
