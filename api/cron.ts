// @ts-nocheck
import { processNotificationQueue, sendDailySummaries } from '../backend/src/jobs/processNotifications.js';

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    if (url.searchParams.get('job') === 'daily-summaries') {
      const queued = await sendDailySummaries();
      const processed = await processNotificationQueue();
      return res.json({ ok: true, ...queued, ...processed });
    }

    const result = await processNotificationQueue();
    return res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
}
