import { Hono } from 'hono';
import { runOSISummaryGeneration } from '../llm/client.js';

const osiSummaryRoute = new Hono();

/**
 * POST /api/generate-osi-summary
 *
 * Spec 02: Generates the OSI-facing UCSD intake format summary.
 * Client sends deterministic calculated fields; server generates narrative fields.
 */
osiSummaryRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { intakePayload, gapAnswers, calculatedFields } = body;

    if (!intakePayload) {
      return c.json(
        { error: 'intakePayload is required', retryable: false },
        400
      );
    }

    if (!calculatedFields) {
      return c.json(
        { error: 'calculatedFields is required', retryable: false },
        400
      );
    }

    const result = await runOSISummaryGeneration(
      intakePayload,
      gapAnswers ?? [],
      calculatedFields
    );

    return c.json(result);
  } catch (error) {
    console.error('[generate-osi-summary] Error:', error);

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

export default osiSummaryRoute;
