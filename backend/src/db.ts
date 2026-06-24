import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env, getEnv } from './env';

type GlobalWithSupabase = typeof globalThis & {
  __supabase?: SupabaseClient;
};

const g = globalThis as GlobalWithSupabase;

function createSupabaseClient(): SupabaseClient {
  const options: NonNullable<Parameters<typeof createClient>[2]> = {
    auth: { autoRefreshToken: false, persistSession: false },
  };

  // Node 20 needs ws; Node 22+ (Vercel production) has native WebSocket.
  if (typeof globalThis.WebSocket === 'undefined') {
    options.realtime = { transport: ws as unknown as typeof WebSocket };
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
