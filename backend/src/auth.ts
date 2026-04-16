import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { env, getEnv } from './env';

export type JwtPayload = {
  sub: string;
  email: string;
};

export function signAuthToken(payload: JwtPayload): string {
  if (!env.JWT_SECRET) getEnv('JWT_SECRET');
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '14d' });
}

export function verifyAuthToken(token: string): JwtPayload {
  if (!env.JWT_SECRET) getEnv('JWT_SECRET');
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== 'object' || !decoded) throw new Error('Invalid token');
  const sub = (decoded as any).sub;
  const email = (decoded as any).email;
  if (typeof sub !== 'string' || typeof email !== 'string') throw new Error('Invalid token');
  if (!ObjectId.isValid(sub)) throw new Error('Invalid token');
  return { sub, email };
}

