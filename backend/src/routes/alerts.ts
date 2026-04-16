import { Router } from 'express';
import { sendEmail } from '../email/brevo';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.post('/test', async (req, res) => {
  const user = (req as AuthedRequest).auth;

  const subject = 'My Daily Planner test alert';
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
      <h2 style="margin:0 0 8px;">Test alert</h2>
      <p style="margin:0 0 16px;">If you received this, Brevo is connected.</p>
      <p style="margin:0; color:#555;">Signed in as <b>${user.email}</b></p>
    </div>
  `;

  try {
    await sendEmail({
      to: { email: user.email },
      subject,
      html,
      text: `Test alert. Signed in as ${user.email}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return res.status(500).json({ error: message });
  }

  return res.json({ ok: true });
});

