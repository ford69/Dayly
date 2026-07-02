import { Router, type Request, type Response } from 'express';
import { processNotificationQueue, runHourlyDigests } from '../jobs/processNotifications';

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

async function handleProcess(req: Request, res: Response) {
  if (!verifyCronSecret(req, res)) return;
  try {
    const result = await processNotificationQueue();
    return res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
}

async function handleHourlyDigests(req: Request, res: Response) {
  if (!verifyCronSecret(req, res)) return;
  try {
    const digests = await runHourlyDigests();
    const processed = await processNotificationQueue();
    return res.json({ ok: true, ...digests, ...processed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
}

cronRouter.post('/process-notifications', handleProcess);
cronRouter.get('/process-notifications', handleProcess);
cronRouter.post('/hourly-digests', handleHourlyDigests);
cronRouter.get('/hourly-digests', handleHourlyDigests);
