import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, getEnv } from './env';
import { authRouter } from './routes/auth';
import { tasksRouter } from './routes/tasks';
import { alertsRouter } from './routes/alerts';

function requireConfiguredEnv() {
  getEnv('MONGODB_URI');
  getEnv('JWT_SECRET');
}

async function main() {
  requireConfiguredEnv();

  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/alerts', alertsRouter);

  // Ensure errors return JSON (handy for Postman)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  });

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

