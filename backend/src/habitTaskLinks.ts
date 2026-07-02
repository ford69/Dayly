import { getSupabase } from '../db';
import type { HabitRow } from '../models';
import { isGoalMet } from './habitsCore';

export async function applyHabitLinksOnTaskComplete(userId: string, taskId: string, taskDate: string) {
  const supabase = getSupabase();
  const { data: links } = await supabase
    .from('habit_task_links')
    .select('habit_id, auto_complete')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('auto_complete', true);

  if (!links?.length) return;

  for (const link of links) {
    const { data: habit } = await supabase
      .from('habits')
      .select('*')
      .eq('id', link.habit_id)
      .maybeSingle();

    if (!habit) continue;
    const h = habit as HabitRow;
    const now = new Date().toISOString();
    const value = Number(h.target) || 1;

    const { data: existing } = await supabase
      .from('habit_logs')
      .select('id, value')
      .eq('habit_id', link.habit_id)
      .eq('user_id', userId)
      .eq('date', taskDate)
      .maybeSingle();

    const newValue = existing ? Math.max(Number(existing.value), value) : value;
    const completed = isGoalMet(h, newValue);

    if (existing) {
      await supabase
        .from('habit_logs')
        .update({
          value: newValue,
          completed,
          completed_at: completed ? now : null,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('habit_logs').insert({
        habit_id: link.habit_id,
        user_id: userId,
        date: taskDate,
        value: newValue,
        completed,
        completed_at: completed ? now : null,
      });
    }
  }
}
