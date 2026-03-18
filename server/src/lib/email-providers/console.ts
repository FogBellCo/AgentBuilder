import type { EmailMessage, EmailProvider } from '../email-provider.js';

export class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log('--- EMAIL ---');
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body:\n${message.text}`);
    console.log('--- END EMAIL ---');
    return { success: true, messageId: `console-${Date.now()}` };
  }
}
