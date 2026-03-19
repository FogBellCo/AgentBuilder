import type { EmailProvider } from './email-provider.js';
import { ConsoleProvider } from './email-providers/console.js';

export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  switch (provider) {
    case 'resend': {
      // ResendProvider requires the `resend` npm package.
      // Install with: npm install resend
      // Then create server/src/lib/email-providers/resend.ts
      throw new Error(
        'ResendProvider is not yet implemented. Set EMAIL_PROVIDER=console or install `resend` and implement the provider.'
      );
    }
    case 'smtp': {
      // SmtpProvider requires the `nodemailer` npm package.
      // Install with: npm install nodemailer @types/nodemailer
      // Then create server/src/lib/email-providers/smtp.ts
      throw new Error(
        'SmtpProvider is not yet implemented. Set EMAIL_PROVIDER=console or install `nodemailer` and implement the provider.'
      );
    }
    case 'console':
    default:
      return new ConsoleProvider();
  }
}
