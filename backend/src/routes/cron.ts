import { Router, type Request, type Response } from 'express';
import { processNotificationQueue, sendDailySummaries } from '../jobs/processNotifications';
import { env } from '../env';

function verifyCronSecret(req: Request, res: Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'CRON_SECRET is not configured' });
    return false;
  }
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export const cronRouter = Router();

/** Process due email/push notifications — call every 5 min via Vercel Cron */
cronRouter.post('/process-notifications', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    const result = await processNotificationQueue();
    return res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
});

/** Queue morning daily summaries — call once daily via Vercel Cron */
cronRouter.post('/daily-summaries', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    const queued = await sendDailySummaries();
    const processed = await processNotificationQueue();
    return res.json({ ok: true, ...queued, ...processed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
});

// Allow GET for Vercel Cron (sends GET by default in some configs)
cronRouter.get('/process-notifications', async (req, res) => {
  if (!verifyCronSecret(req, res)) return;
  if (env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    return res.status(503).json({ error: 'Not configured' });
  }
  try {
    const result = await processNotificationQueue();
    return res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
});
