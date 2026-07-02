import { getSupabase } from '../db';
import type { HabitRow, TaskRow } from '../models';
import { scheduleHabitReminders } from './scheduleHabitReminders';
import { scheduleTaskReminders } from './scheduleReminders';

export async function rescheduleAllUserReminders(userId: string) {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('email, email_reminders_enabled')
    .eq('id', userId)
    .maybeSingle();

  if (!user?.email_reminders_enabled || !user.email) return { tasks: 0, habits: 0 };

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  for (const task of (tasks ?? []) as TaskRow[]) {
    await scheduleTaskReminders(userId, task, user.email);
  }

  const { data: habits } = await supabase.from('habits').select('*').eq('user_id', userId);

  for (const habit of (habits ?? []) as HabitRow[]) {
    await scheduleHabitReminders(userId, habit, user.email);
  }

  return { tasks: tasks?.length ?? 0, habits: habits?.length ?? 0 };
}
