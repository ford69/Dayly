// @ts-nocheck
export default async function handler(req, res) {
  try {
    const { createApp } = await import('../backend/src/app');
    const app = createApp();
    await new Promise((resolve, reject) => {
      app(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('API bootstrap failed:', message, stack);
    if (!res.headersSent) {
      res.status(500).json({ error: message, stack });
    }
  }
}
