import { Hono } from 'hono';
import { runPromptBundleGeneration } from '../llm/client.js';

const promptBundleRoute = new Hono();

/**
 * POST /api/generate-prompt-bundle
 *
 * Spec 02: Generates the Claude Code prompt bundle.
 * Returns the AI-generated sections that get combined with deterministic sections client-side.
 */
promptBundleRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { intakePayload, gapAnswers, osiSummary } = body;

    if (!intakePayload) {
      return c.json(
        { error: 'intakePayload is required', retryable: false },
        400
      );
    }

    const result = await runPromptBundleGeneration(
      intakePayload,
      gapAnswers ?? [],
      osiSummary
    );

    // Assemble into a single markdown string
    const markdown = [
      '## Business Context',
      '',
      result.businessContext,
      '',
      '## Requirements',
      '',
      '### Functional Requirements',
      result.functionalRequirements,
      '',
      '### Out of Scope',
      result.outOfScope,
      '',
      '## Suggested Architecture',
      '',
      result.suggestedArchitecture,
      '',
      '## Acceptance Criteria',
      '',
      result.acceptanceCriteria,
      '',
      '## Implementation Notes',
      '',
      result.implementationNotes,
    ].join('\n');

    return c.json({ markdown });
  } catch (error) {
    console.error('[generate-prompt-bundle] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    const retryable =
      message.includes('rate_limit') ||
      message.includes('timeout') ||
      message.includes('503') ||
      message.includes('529');

    return c.json({ error: message, retryable }, 500);
  }
});

export default promptBundleRoute;
