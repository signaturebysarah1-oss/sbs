import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: env.resendFromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  if (error) {
    console.error('[email] Resend rejected delivery', {
      to: options.to,
      subject: options.subject,
      name: error.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    throw new Error(`Resend email delivery failed: ${error.message}`);
  }
  console.info('[email] Resend accepted delivery', { to: options.to, subject: options.subject, emailId: data?.id });
}
