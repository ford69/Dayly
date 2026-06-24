import { getSupabase } from './db';
import { getEnv } from './env';

async function migrate() {
  getEnv('SUPABASE_URL');
  getEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = getSupabase();

  for (const table of ['users', 'tasks'] as const) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      throw new Error(
        `Table "${table}" is not available. Apply migrations with "npm run db:push" or "supabase db push".\n${error.message}`
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log('Database schema verified: users, tasks');
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
