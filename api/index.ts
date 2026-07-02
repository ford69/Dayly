// @ts-nocheck
import { createApp } from '../backend/src/app.js';

let app;

export default function handler(req, res) {
  try {
    if (!app) app = createApp();
    app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API handler failed:', message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
}
