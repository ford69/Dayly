import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
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

const pushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

alertsRouter.post('/push-subscribe', async (req, res) => {
  const user = (req as AuthedRequest).auth;
  const parsed = pushSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid push subscription' });

  const supabase = getSupabase();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.sub,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: String(req.headers['user-agent'] ?? '').slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return res.status(500).json({
      error: 'Failed to save push subscription. Apply the push_subscriptions migration if needed.',
    });
  }

  return res.json({ ok: true });
});
