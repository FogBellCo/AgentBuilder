/**
 * Forward a payload to the configured webhook URL (TritonAI).
 */
export async function forwardToWebhook(
  payload: unknown
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      success: false,
      error: 'WEBHOOK_URL is not configured',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to reach webhook: ${message}`,
    };
  }
}
