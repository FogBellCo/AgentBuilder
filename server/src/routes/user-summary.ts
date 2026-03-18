import { Hono } from 'hono';
import { runUserSummaryGeneration } from '../llm/client.js';

const userSummaryRoute = new Hono();

/**
 * POST /api/generate-user-summary
 *
 * Spec 02: Generates the user-facing friendly summary sections.
 * Returns 4 sections: yourProject, theData, whatAIWouldHandle, howYoudSeeResults.
 */
userSummaryRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { intakePayload, gapAnswers } = body;

    if (!intakePayload) {
      return c.json(
        { error: 'intakePayload is required', retryable: false },
        400
      );
    }

    const result = await runUserSummaryGeneration(
      intakePayload,
      gapAnswers ?? []
    );

    return c.json(result);
  } catch (error) {
    console.error('[generate-user-summary] Error:', error);

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

export default userSummaryRoute;
