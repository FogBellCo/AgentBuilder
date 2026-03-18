/**
 * Email templates for magic link auth and status change notifications.
 */

export function magicLinkEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Sign in to UCSD AgentBuilder';

  const text = `Hi there,

Click the link below to sign in to AgentBuilder:

${verifyUrl}

This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.

— The UCSD AgentBuilder Team`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #182B49;">Sign in to AgentBuilder</h2>
  <p>Hi there,</p>
  <p>Click the button below to sign in to AgentBuilder:</p>
  <p style="margin: 24px 0;">
    <a href="${verifyUrl}" style="background-color: #0072CE; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
      Sign In to AgentBuilder
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">&mdash; The UCSD AgentBuilder Team</p>
</body>
</html>`;

  return { subject, html, text };
}

export function statusChangeEmail(
  title: string,
  newStatusFriendly: string,
  reason?: string,
  viewUrl?: string,
): { subject: string; html: string; text: string } {
  const subject = `Your AgentBuilder submission "${title}" has been updated`;

  let text = `Hi there,

Your submission "${title}" has been moved to: ${newStatusFriendly}`;

  if (reason) {
    text += `\n\n${reason}`;
  }

  if (viewUrl) {
    text += `\n\nView your submission: ${viewUrl}`;
  }

  text += '\n\n— The UCSD AgentBuilder Team';

  let reasonHtml = '';
  if (reason) {
    reasonHtml = `<p style="background-color: #f9f9f9; padding: 12px; border-radius: 6px; border-left: 4px solid #0072CE;">${reason}</p>`;
  }

  let buttonHtml = '';
  if (viewUrl) {
    buttonHtml = `
    <p style="margin: 24px 0;">
      <a href="${viewUrl}" style="background-color: #0072CE; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
        View Your Submission
      </a>
    </p>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #182B49;">Submission Update</h2>
  <p>Hi there,</p>
  <p>Your submission <strong>"${title}"</strong> has been moved to: <strong>${newStatusFriendly}</strong></p>
  ${reasonHtml}
  ${buttonHtml}
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">&mdash; The UCSD AgentBuilder Team</p>
</body>
</html>`;

  return { subject, html, text };
}

/** Map status codes to user-friendly names */
export function friendlyStatus(status: string): string {
  const map: Record<string, string> = {
    draft: 'In Progress',
    submitted: 'Submitted',
    in_review: 'Under Review',
    needs_info: 'Action Needed',
    approved: 'Approved',
    building: 'In Development',
    complete: 'Complete',
    archived: 'Archived',
  };
  return map[status] || status;
}
