import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, type JwtPayload } from '../auth';

const COOKIE_NAME = 'mdp_token';

export type AuthedRequest = Request & {
  auth: JwtPayload;
};

function readAuthToken(req: Request): string | null {
  const cookieToken = (req as any).cookies?.[COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;

  const h = req.header('authorization');
  if (!h) return null;
  const m = /^Bearer (.+)$/i.exec(h);
  return m?.[1] ?? null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readAuthToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = verifyAuthToken(token);
    (req as AuthedRequest).auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

