// @ts-nocheck
import { processNotificationQueue, runHourlyDigests } from '../backend/src/jobs/processNotifications';

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const job = url.searchParams.get('job');

    if (job === 'hourly-digests') {
      const digests = await runHourlyDigests();
      const processed = await processNotificationQueue();
      return res.json({ ok: true, ...digests, ...processed });
    }

    const result = await processNotificationQueue();
    return res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return res.status(500).json({ error: message });
  }
}
