// app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, getEnv } from './env';
import { authRouter } from './routes/auth';
import { tasksRouter } from './routes/tasks';
import { alertsRouter } from './routes/alerts';

export function createApp() {
  // ensure env is configured
  getEnv('MONGODB_URI');
  getEnv('JWT_SECRET');

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

  // error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  });

  return app;
}