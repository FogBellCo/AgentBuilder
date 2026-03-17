import { Hono } from 'hono';
import { runGapAnalysis } from '../llm/client.js';

const gapAnalysisRoute = new Hono();

/**
 * POST /api/gap-analysis
 *
 * Proxies the gap analysis LLM call. Accepts the full intake payload
 * and optional previous gap answers, returns structured follow-up questions.
 */
gapAnalysisRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();

    const { intakePayload, previousGapAnswers } = body;

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

    const result = await runGapAnalysis(
      intakePayload,
      previousGapAnswers
    );

    return c.json(result);
  } catch (error) {
    console.error('[gap-analysis] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    // OpenAI rate limit or timeout errors are retryable
    const retryable =
      message.includes('rate_limit') ||
      message.includes('timeout') ||
      message.includes('503') ||
      message.includes('529');

    return c.json({ error: message, retryable }, 500);
  }
});

export default gapAnalysisRoute;
