import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env, getEnv } from './env';

type GlobalWithSupabase = typeof globalThis & {
  __supabase?: SupabaseClient;
};

const g = globalThis as GlobalWithSupabase;

export function getSupabase(): SupabaseClient {
  if (!env.SUPABASE_URL) getEnv('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!g.__supabase) {
    g.__supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    });
  }
  return g.__supabase;
}
