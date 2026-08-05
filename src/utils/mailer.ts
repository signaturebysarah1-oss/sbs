import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await resend.emails.send({
    from: 'Signature By Sarah <onboarding@resend.dev>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
