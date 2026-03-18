import { Hono } from 'hono';
import { forwardToWebhook } from '../lib/webhook.js';

const submitRoute = new Hono();

/**
 * POST /api/submit
 *
 * Legacy endpoint — accepts a finalized intake payload and forwards it
 * to the TritonAI webhook. The new auth-based flow uses
 * POST /api/submissions/:id/submit instead.
 */
submitRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body) {
      return c.json({ error: 'Request body is required' }, 400);
    }

    console.log('[submit] Received submission via legacy endpoint');

    // Forward to webhook
    const webhookResult = await forwardToWebhook(body);

    if (!webhookResult.success) {
      console.warn(
        '[submit] Webhook forwarding failed:',
        webhookResult.error
      );

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
