import { Hono } from 'hono';
import { forwardToWebhook } from '../lib/webhook.js';
import { upsertSubmission } from '../lib/db-operations.js';

const submitRoute = new Hono();

/**
 * POST /api/submit
 *
 * Accepts a finalized intake payload, logs it, and forwards it
 * to the TritonAI webhook.
 *
 * TODO: Store submissions in SQLite for persistence and audit trail.
 */
submitRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body) {
      return c.json({ error: 'Request body is required' }, 400);
    }

    // Log submission to console (placeholder for database storage)
    console.log(
      '[submit] Received submission:',
      JSON.stringify(body, null, 2)
    );

    // Persist to database
    try {
      const sessionId = body.sessionId || crypto.randomUUID();
      const title = body.projectIdea?.title || '';
      const email = body.email || 'unknown@ucsd.edu';
      upsertSubmission(sessionId, email, title, 'submitted', JSON.stringify(body));
    } catch (dbError) {
      console.warn('[submit] DB persistence failed:', dbError);
    }

    // Forward to webhook
    const webhookResult = await forwardToWebhook(body);

    if (!webhookResult.success) {
      console.warn(
        '[submit] Webhook forwarding failed:',
        webhookResult.error
      );

      // Still return success to the client — the submission was received.
      // The webhook failure is logged but not blocking.
      return c.json({
        success: true,
        webhookStatus: 'failed',
        webhookError: webhookResult.error,
      });
    }

    return c.json({
      success: true,
      webhookStatus: 'forwarded',
    });
  } catch (error) {
    console.error('[submit] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    return c.json({ error: message }, 500);
  }
});

export default submitRoute;
