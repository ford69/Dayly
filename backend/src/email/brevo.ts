import { BrevoClient } from '@getbrevo/brevo';
import { env, getEnv } from '../env';

export type SendEmailArgs = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text?: string;
};

function getBrevoApiKey(): string {
  if (!env.BREVO_API_KEY) return getEnv('BREVO_API_KEY');
  return env.BREVO_API_KEY;
}

function getSender() {
  const email = env.BREVO_SENDER_EMAIL || getEnv('BREVO_SENDER_EMAIL');
  const name = env.BREVO_SENDER_NAME || 'My Daily Planner';
  return { email, name };
}

export async function sendEmail(args: SendEmailArgs) {
  const sender = getSender();
  const client = new BrevoClient({ apiKey: getBrevoApiKey() });

  return client.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: args.to.email, name: args.to.name }],
    subject: args.subject,
    htmlContent: args.html,
    ...(args.text ? { textContent: args.text } : {}),
  } as any);
}

