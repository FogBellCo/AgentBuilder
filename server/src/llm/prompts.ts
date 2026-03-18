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

// --- Spec 02: User-Facing Summary Prompts ---

const USER_SUMMARY_SYSTEM_PROMPT = `You are writing a friendly, warm summary for a non-technical university staff member
who just completed an AI project intake form. They should read this and think "yes,
that's exactly what I meant."

Rules:
- Write in second person ("Your team...", "You want...")
- No jargon: never say "protection level", "P1/P2/P3/P4", "desirability",
  "viability", "feasibility", "process overview", or any internal UCSD terms
- Keep it conversational — like a smart colleague summarizing what you told them
- Be specific: use the actual numbers, system names, and team details they provided
- Each section should be 2-4 sentences
- If data is missing for a section, write a shorter section that still feels complete
  (don't say "no information provided")

Output a JSON object with exactly 4 keys:
- yourProject: A 2-3 sentence narrative about their project
- theData: A short paragraph about data sources, sensitivity, and access
- whatAIWouldHandle: A plain-language description of AI processing tasks
- howYoudSeeResults: Description of output formats in friendly language`;

export function buildUserSummarySystemPrompt(): string {
  return USER_SUMMARY_SYSTEM_PROMPT;
}

export function buildUserSummaryUserPrompt(
  intakePayload: unknown,
  gapAnswers: GapQuestion[]
): string {
  let prompt = `Here is the user's intake submission:

<submission>
${JSON.stringify(intakePayload, null, 2)}
</submission>

`;

  if (gapAnswers.length > 0) {
    prompt += `Here are the gap analysis follow-up answers:

<gap_answers>
${JSON.stringify(gapAnswers, null, 2)}
</gap_answers>

`;
  }

  prompt += `Generate the 4 user-facing summary sections. Each should be 2-4 conversational sentences.`;

  return prompt;
}

// --- Spec 02: OSI-Facing Summary Prompts ---

const OSI_SUMMARY_SYSTEM_PROMPT = `You are a technical writer for UCSD's TritonAI team. You generate structured intake
summaries that match the UCSD AI intake template format.

Rules:
- Write in third person professional voice
- Be thorough and specific — the review team uses this to prioritize and plan
- For Process Overview fields, synthesize across all provided data
- For Context/Challenge/Request, write full narrative paragraphs (2-3 each)
- Reference specific systems, data volumes, and timelines where available
- If gap analysis answers provide additional detail beyond the intake form, integrate
  that information
- Flag uncertainties explicitly: "The submitter did not specify X; follow-up recommended"

Output a JSON object with these keys:
- processOverview: { purpose: string, description: string, keyPoints: string[], potentialImpact: string[], questionsAndConsiderations: string[] }
- context: string (2-3 paragraphs about current state)
- challenge: string (2-3 paragraphs about pain points)
- request: string (2-3 paragraphs about what they want built)
- impactBullets: string[] (2-3 impact bullets for savings section)`;

export function buildOSISummarySystemPrompt(): string {
  return OSI_SUMMARY_SYSTEM_PROMPT;
}

export function buildOSISummaryUserPrompt(
  intakePayload: unknown,
  gapAnswers: GapQuestion[],
  calculatedFields: unknown
): string {
  let prompt = `Here is the user's intake submission:

<submission>
${JSON.stringify(intakePayload, null, 2)}
</submission>

Here are the deterministically calculated UCSD fields (DO NOT change these values):

<calculated_fields>
${JSON.stringify(calculatedFields, null, 2)}
</calculated_fields>

`;

  if (gapAnswers.length > 0) {
    prompt += `Here are the gap analysis follow-up answers:

<gap_answers>
${JSON.stringify(gapAnswers, null, 2)}
</gap_answers>

`;
  }

  prompt += `Generate the OSI summary narrative sections. The Process Overview purpose should be 1-2 sentences. The description should be 1-2 paragraphs. Key points, potential impact, and questions & considerations should each be 3-5 bullets. Context, Challenge, and Request should each be 2-3 paragraphs.`;

  return prompt;
}

// --- Spec 02: Claude Code Prompt Bundle Prompts ---

const PROMPT_BUNDLE_SYSTEM_PROMPT = `You are generating a Claude Code project prompt bundle — a structured markdown document
that a developer will paste into an AI coding assistant to scaffold this project.

Rules:
- Be technically precise
- Include concrete implementation guidance, not just requirements
- Reference UC data classification constraints specifically
- For suggested architecture, name actual patterns (RAG, ETL, event-driven) and
  explain briefly why
- Acceptance criteria should be testable (Given/When/Then or checkbox format)
- Out of scope should be inferred from what was NOT selected
- Implementation notes should address UCSD-specific gotchas (SSO, TritonGPT, etc.)

Output a JSON object with these keys:
- businessContext: string (2-3 paragraph narrative for developers)
- functionalRequirements: string (bulleted markdown list)
- outOfScope: string (bulleted markdown list, 3-6 items)
- suggestedArchitecture: string (markdown with component list)
- acceptanceCriteria: string (4-6 criteria in checkbox format)
- implementationNotes: string (3-5 practical notes)`;

export function buildPromptBundleSystemPrompt(): string {
  return PROMPT_BUNDLE_SYSTEM_PROMPT;
}

export function buildPromptBundleUserPrompt(
  intakePayload: unknown,
  gapAnswers: GapQuestion[],
  osiSummary: unknown
): string {
  let prompt = `Here is the user's intake submission:

<submission>
${JSON.stringify(intakePayload, null, 2)}
</submission>

`;

  if (osiSummary) {
    prompt += `Here is the OSI intake summary for reference:

<osi_summary>
${JSON.stringify(osiSummary, null, 2)}
</osi_summary>

`;
  }

  if (gapAnswers.length > 0) {
    prompt += `Here are the gap analysis follow-up answers:

<gap_answers>
${JSON.stringify(gapAnswers, null, 2)}
</gap_answers>

`;
  }

  prompt += `Generate the AI-authored sections of the Claude Code prompt bundle.`;

  return prompt;
}
