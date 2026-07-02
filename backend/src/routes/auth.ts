import type { Request, Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { getSupabase } from '../db';
import type { UserRow } from '../models';
import { signAuthToken, verifyAuthToken } from '../auth';
import { env } from '../env';
import { ensurePersonalWorkspace } from '../workspace';

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

function publicUser(
  u: Pick<UserRow, 'id' | 'email' | 'created_at'> & {
    email_reminders_enabled?: boolean;
    timezone?: string;
  }
) {
  return {
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    emailRemindersEnabled: u.email_reminders_enabled ?? false,
    timezone: u.timezone ?? 'UTC',
  };
}

const emailPasswordSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});
const googleCredentialSchema = z.object({
  credential: z.string().min(1),
});

let googleClient: OAuth2Client | null = null;
function getGoogleClient() {
  if (!googleClient) googleClient = new OAuth2Client();
  return googleClient;
}

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password' });

  const email = parsed.data.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash })
    .select('id, email, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Failed to create account' });
  }

  await ensurePersonalWorkspace(data.id);

  const token = signAuthToken({ sub: data.id, email });
  setAuthCookie(res, token);

  return res.json({
    user: publicUser(data),
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = emailPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password' });

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, created_at')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signAuthToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);

  return res.json({ user: publicUser(user) });
});

authRouter.post('/logout', async (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

authRouter.post('/google', async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured' });

  const parsed = googleCredentialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid Google credential' });

  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.trim().toLowerCase();
    if (!email) return res.status(401).json({ error: 'Google account has no email' });

    const supabase = getSupabase();
    let { data: user } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      const { data: created, error } = await supabase
        .from('users')
        .insert({ email, password_hash: '' })
        .select('id, email, created_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('users')
            .select('id, email, created_at')
            .eq('email', email)
            .single();
          user = existing;
        } else {
          return res.status(500).json({ error: 'Failed to create account' });
        }
      } else {
        user = created;
        await ensurePersonalWorkspace(created.id);
      }
    }

    if (!user) return res.status(500).json({ error: 'Failed to create account' });

    const token = signAuthToken({ sub: user.id, email: user.email });
    setAuthCookie(res, token);
    return res.json({ user: publicUser(user) });
  } catch {
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

authRouter.get('/me', async (req, res) => {
  const token = readAuthToken(req);
  if (!token) return res.json({ user: null });

  try {
    const payload = verifyAuthToken(token);
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, created_at, email_reminders_enabled, timezone')
      .eq('id', payload.sub)
      .maybeSingle();

    if (!user) return res.json({ user: null });
    await ensurePersonalWorkspace(user.id);
    return res.json({ user: publicUser(user) });
  } catch {
    return res.json({ user: null });
  }
});
