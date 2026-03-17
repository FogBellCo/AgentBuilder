import { exampleSubmissions } from './examples.js';
import type { GapQuestion } from './schemas.js';

// --- Gap Analysis Prompts ---

const GAP_ANALYSIS_SYSTEM_PROMPT = `You are an intake reviewer for UCSD's TritonAI team. You review AI project
intake submissions from non-technical university staff and identify gaps,
missing details, vague descriptions, and contradictions.

You have access to:
1. The intake form schema (all fields and what they represent)
2. Examples of strong, complete submissions
3. UC data classification policy (P1-P4)

Your job:
- Compare the submission against the required fields and examples
- Identify what's missing, vague, or contradictory
- Generate targeted follow-up questions (max 20)
- Prioritize each question as "critical" (blocks the team from acting)
  or "nice_to_have" (would improve the submission)
- For each question, decide if it should be free-text or multiple-choice
- If multiple-choice, generate 2-4 clear options
- Flag any contradictions between answers (e.g., P1 classification but
  FERPA-regulated data)
- If the data suggests the protection level may be wrong, note this

Output your analysis as structured JSON matching the provided schema.`;

const P4_MODIFIER = `

IMPORTANT: This submission involves P4 (Restricted) data where AI use is
currently prohibited under UC policy. Focus your questions on:
- Whether de-identification is feasible
- What specific restricted data elements are involved
- Whether a non-restricted subset could achieve the project goals
- What approvals or exemptions might apply
Do NOT ask questions about output formats or AI task details that assume
the project will proceed as-is with restricted data.`;

export function buildGapAnalysisSystemPrompt(
  protectionLevel: string
): string {
  let prompt = GAP_ANALYSIS_SYSTEM_PROMPT;
  if (protectionLevel === 'P4') {
    prompt += P4_MODIFIER;
  }
  return prompt;
}

export function buildGapAnalysisUserPrompt(
  intakePayload: unknown,
  previousAnswers?: GapQuestion[]
): string {
  let prompt = `Here is the user's intake submission:

<submission>
${JSON.stringify(intakePayload, null, 2)}
</submission>

Here are examples of strong, complete submissions for reference:

`;

  exampleSubmissions.forEach((example, index) => {
    prompt += `<example_${index + 1}>
${example}
</example_${index + 1}>

`;
  });

  if (previousAnswers && previousAnswers.length > 0) {
    prompt += `The user has already answered some follow-up questions from a previous analysis. Here are their answers:

<previous_answers>
${JSON.stringify(previousAnswers, null, 2)}
</previous_answers>

Take these answers into account. Do not re-ask questions that have already been adequately answered. Focus on any remaining gaps or new gaps revealed by the answers.

`;
  }

  prompt += `Analyze this submission and generate follow-up questions.`;

  return prompt;
}

// --- Summary Generation Prompts ---

const SUMMARY_SYSTEM_PROMPT = `You are a technical writer for UCSD's TritonAI team. You generate polished,
professional project intake summaries from structured data.

You must output content for exactly 7 sections in the specified JSON format.
Write in clear, professional language appropriate for a university audience.
The executive summary should be 2-3 sentences. Other sections should be
thorough but concise.

Use the gap analysis answers to enrich sections where the original intake
data was sparse. If gap analysis answers contradict the original data,
prefer the gap analysis answer (it's more recent/specific).

For the Compliance & Next Steps section, tailor recommendations to the
protection level. For P4 submissions, focus on de-identification paths
and alternative approaches.

For the Feasibility Summary section, output a Markdown table showing each
selected output format against the protection level with go/no-go status.`;

export function buildSummarySystemPrompt(): string {
  return SUMMARY_SYSTEM_PROMPT;
}

export function buildSummaryUserPrompt(
  intakePayload: unknown,
  gapAnswers: GapQuestion[]
): string {
  let prompt = `Here is the user's intake submission:

<submission>
${JSON.stringify(intakePayload, null, 2)}
</submission>

`;

  if (gapAnswers.length > 0) {
    prompt += `Here are the gap analysis follow-up questions and the user's answers:

<gap_answers>
${JSON.stringify(gapAnswers, null, 2)}
</gap_answers>

`;
  }

  prompt += `Generate the full project intake summary with all 7 sections. Use Markdown formatting within each section for readability.`;

  return prompt;
}
