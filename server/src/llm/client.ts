import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  GapAnalysisResponseSchema,
  SummaryResponseSchema,
  UserSummaryResponseSchema,
  OSISummaryResponseSchema,
  PromptBundleResponseSchema,
  type GapAnalysisResponse,
  type SummaryResponse,
  type UserSummaryResponse,
  type OSISummaryResponse,
  type PromptBundleResponse,
  type GapQuestion,
} from './schemas.js';
import {
  buildGapAnalysisSystemPrompt,
  buildGapAnalysisUserPrompt,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  buildUserSummarySystemPrompt,
  buildUserSummaryUserPrompt,
  buildOSISummarySystemPrompt,
  buildOSISummaryUserPrompt,
  buildPromptBundleSystemPrompt,
  buildPromptBundleUserPrompt,
} from './prompts.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IntakePayload {
  gather?: {
    protectionLevel?: string;
  };
  [key: string]: unknown;
}

/**
 * Run gap analysis on an intake submission.
 * Uses OpenAI structured outputs with Zod schema validation.
 */
export async function runGapAnalysis(
  intakePayload: IntakePayload,
  previousAnswers?: GapQuestion[]
): Promise<GapAnalysisResponse> {
  const protectionLevel =
    intakePayload.gather?.protectionLevel ?? 'P1';

  const completion = await openai.beta.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content: buildGapAnalysisSystemPrompt(protectionLevel),
      },
      {
        role: 'user',
        content: buildGapAnalysisUserPrompt(
          intakePayload,
          previousAnswers
        ),
      },
    ],
    response_format: zodResponseFormat(
      GapAnalysisResponseSchema,
      'gap_analysis'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error(
      'Failed to parse gap analysis response from OpenAI'
    );
  }

  return parsed;
}

/**
 * Generate a polished summary from intake data and gap analysis answers.
 * Uses OpenAI structured outputs with Zod schema validation.
 */
export async function runSummaryGeneration(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[]
): Promise<SummaryResponse> {
  const completion = await openai.beta.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content: buildSummarySystemPrompt(),
      },
      {
        role: 'user',
        content: buildSummaryUserPrompt(intakePayload, gapAnswers),
      },
    ],
    response_format: zodResponseFormat(
      SummaryResponseSchema,
      'summary'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error(
      'Failed to parse summary response from OpenAI'
    );
  }

  return parsed;
}

/**
 * Spec 02: Generate user-facing summary sections.
 */
export async function runUserSummaryGeneration(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[]
): Promise<UserSummaryResponse> {
  const completion = await openai.beta.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content: buildUserSummarySystemPrompt(),
      },
      {
        role: 'user',
        content: buildUserSummaryUserPrompt(intakePayload, gapAnswers),
      },
    ],
    response_format: zodResponseFormat(
      UserSummaryResponseSchema,
      'user_summary'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error('Failed to parse user summary response from OpenAI');
  }

  return parsed;
}

/**
 * Spec 02: Generate OSI-facing summary narrative sections.
 */
export async function runOSISummaryGeneration(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  calculatedFields: unknown
): Promise<OSISummaryResponse> {
  const completion = await openai.beta.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content: buildOSISummarySystemPrompt(),
      },
      {
        role: 'user',
        content: buildOSISummaryUserPrompt(intakePayload, gapAnswers, calculatedFields),
      },
    ],
    response_format: zodResponseFormat(
      OSISummaryResponseSchema,
      'osi_summary'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error('Failed to parse OSI summary response from OpenAI');
  }

  return parsed;
}

/**
 * Spec 02: Generate Claude Code prompt bundle AI sections.
 */
export async function runPromptBundleGeneration(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  osiSummary: unknown
): Promise<PromptBundleResponse> {
  const completion = await openai.beta.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content: buildPromptBundleSystemPrompt(),
      },
      {
        role: 'user',
        content: buildPromptBundleUserPrompt(intakePayload, gapAnswers, osiSummary),
      },
    ],
    response_format: zodResponseFormat(
      PromptBundleResponseSchema,
      'prompt_bundle'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error('Failed to parse prompt bundle response from OpenAI');
  }

  return parsed;
}
