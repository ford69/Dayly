import type { Request, Response } from 'express';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getCollection } from '../db';
import type { UserDoc } from '../models';
import { signAuthToken, verifyAuthToken } from '../auth';
import { env } from '../env';

const COOKIE_NAME = 'mdp_token';

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function readAuthToken(req: Request): string | null {
  const cookieToken = (req as any).cookies?.[COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;

  const h = req.header('authorization');
  if (!h) return null;
  const m = /^Bearer (.+)$/i.exec(h);
  return m?.[1] ?? null;
}

function publicUser(u: Pick<UserDoc, '_id' | 'email' | 'createdAt'>) {
  return { id: u._id.toHexString(), email: u.email, createdAt: u.createdAt.toISOString() };
}

const emailPasswordSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password' });

  const email = parsed.data.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const users = await getCollection<UserDoc>('users');
  await users.createIndex({ email: 1 }, { unique: true });

  try {
    const createdAt = new Date();
    const result = await users.insertOne({
      _id: new ObjectId(),
      email,
      passwordHash,
      createdAt,
    });

    const token = signAuthToken({ sub: result.insertedId.toHexString(), email });
    setAuthCookie(res, token);

    return res.json({
      user: publicUser({ _id: result.insertedId, email, createdAt }),
    });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password' });

  const email = parsed.data.email.trim().toLowerCase();
  const users = await getCollection<UserDoc>('users');
  const user = await users.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signAuthToken({ sub: user._id.toHexString(), email: user.email });
  setAuthCookie(res, token);

  return res.json({ user: publicUser(user) });
});

authRouter.post('/logout', async (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

authRouter.get('/me', async (req, res) => {
  const token = readAuthToken(req);
  if (!token) return res.json({ user: null });

  try {
    const payload = verifyAuthToken(token);
    const users = await getCollection<UserDoc>('users');
    const user = await users.findOne({ _id: new ObjectId(payload.sub) }, { projection: { passwordHash: 0 } });
    if (!user) return res.json({ user: null });
    return res.json({ user: publicUser(user as any) });
  } catch {
    return res.json({ user: null });
  }
});

