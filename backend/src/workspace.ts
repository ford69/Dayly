import { getSupabase } from './db';

export async function ensurePersonalWorkspace(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('id', userId)
    .maybeSingle();

  if (user?.workspace_id) return user.workspace_id;

  const slug = `personal-${userId.replace(/-/g, '').slice(0, 12)}`;
  const { data: ws, error } = await supabase
    .from('workspaces')
    .insert({ name: 'Personal', slug })
    .select('id')
    .single();

  if (error || !ws) return null;

  await supabase.from('users').update({ workspace_id: ws.id }).eq('id', userId);
  return ws.id;
}
