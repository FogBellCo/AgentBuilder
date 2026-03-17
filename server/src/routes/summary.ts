import { Hono } from 'hono';
import { runSummaryGeneration } from '../llm/client.js';

const summaryRoute = new Hono();

/**
 * POST /api/generate-summary
 *
 * Proxies the summary generation LLM call. Accepts the full intake payload
 * and gap analysis answers, returns a structured 7-section summary.
 */
summaryRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();

    const { intakePayload, gapAnswers } = body;

    if (!intakePayload) {
      return c.json(
        { error: 'intakePayload is required', retryable: false },
        400
      );
    }

    // Validate required fields in intakePayload
    const missingFields: string[] = [];
    if (!intakePayload.projectIdea) missingFields.push('projectIdea');
    if (!intakePayload.gather) missingFields.push('gather');
    if (!intakePayload.refine) missingFields.push('refine');
    if (!intakePayload.present) missingFields.push('present');

    if (missingFields.length > 0) {
      return c.json(
        {
          error: `intakePayload is missing required fields: ${missingFields.join(', ')}`,
          retryable: false,
        },
        400
      );
    }

    const result = await runSummaryGeneration(
      intakePayload,
      gapAnswers ?? []
    );

    return c.json(result);
  } catch (error) {
    console.error('[generate-summary] Error:', error);

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

export default summaryRoute;
