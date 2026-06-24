import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../backend/src/app';

let app: ReturnType<typeof createApp> | undefined;

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!app) app = createApp();
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
