import { createRequire } from 'module';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, getEnv } from './env';

type GlobalWithSupabase = typeof globalThis & {
  __supabase?: SupabaseClient;
};

const g = globalThis as GlobalWithSupabase;

function createSupabaseClient(): SupabaseClient {
  const options: NonNullable<Parameters<typeof createClient>[2]> = {
    auth: { autoRefreshToken: false, persistSession: false },
  };

  // Node 20 needs ws; Node 22+ (Vercel) has native WebSocket.
  if (typeof globalThis.WebSocket === 'undefined') {
    const nodeRequire = createRequire(__filename);
    const ws = nodeRequire('ws') as typeof import('ws');
    options.realtime = { transport: ws as never };
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
}

export function getSupabase(): SupabaseClient {
  if (!env.SUPABASE_URL) getEnv('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!g.__supabase) {
    g.__supabase = createSupabaseClient();
  }
  return g.__supabase;
}
