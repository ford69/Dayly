import { getSupabase } from '../db';
import { addDays, todayString } from '../recurrence';

export type TodaySummary = {
  date: string;
  do_today: { id: string; title: string; start_time: string; priority: string }[];
  urgent: { id: string; title: string; start_time: string }[];
  missed: { id: string; title: string; date: string; start_time: string }[];
  streak: number;
  productivity_score: number;
  tasks_completed: number;
  tasks_total: number;
};

export function computeProductivityScore(completed: number, total: number, focusMinutes: number): number {
  if (total === 0) return focusMinutes > 0 ? 50 : 0;
  const completionPct = (completed / total) * 70;
  const focusBonus = Math.min(focusMinutes / 2, 30);
  return Math.round(Math.min(completionPct + focusBonus, 100));
}

export async function upsertDailyStats(userId: string, date: string) {
  const supabase = getSupabase();

  const { data: tasks } = await supabase.from('tasks').select('status').eq('user_id', userId).eq('date', date);
  const completed = (tasks ?? []).filter((t) => t.status === 'completed').length;
  const total = (tasks ?? []).length;

  const { data: focusSessions } = await supabase
    .from('focus_sessions')
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('completed_at', `${date}T00:00:00`)
    .lte('completed_at', `${date}T23:59:59`);

  const focusMinutes = Math.round(
    (focusSessions ?? []).reduce((sum, s) => sum + s.duration_seconds, 0) / 60
  );

  const score = computeProductivityScore(completed, total, focusMinutes);

  await supabase.from('daily_stats').upsert(
    {
      user_id: userId,
      date,
      tasks_completed: completed,
      tasks_total: total,
      focus_minutes: focusMinutes,
      productivity_score: score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  );

  return { completed, total, focusMinutes, score };
}

export async function getCompletionStreak(userId: string): Promise<number> {
  const supabase = getSupabase();
  let streak = 0;
  let check = todayString();

  const todayComplete = await isDayFullyCompleted(supabase, userId, check);
  if (todayComplete === false) check = addDays(check, -1);

  for (let i = 0; i < 365; i++) {
    const result = await isDayFullyCompleted(supabase, userId, check);
    if (result !== true) break;
    streak++;
    check = addDays(check, -1);
  }

  return streak;
}

async function isDayFullyCompleted(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  date: string
): Promise<boolean | null> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', userId)
    .eq('date', date);

  if (!tasks || tasks.length === 0) return null;
  return tasks.every((t) => t.status === 'completed');
}

export async function buildTodaySummary(userId: string, date: string): Promise<TodaySummary> {
  const supabase = getSupabase();
  const stats = await upsertDailyStats(userId, date);

  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('id, title, start_time, priority, status, date')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  const pending = (todayTasks ?? []).filter((t) => t.status === 'pending');

  const { data: missedTasks } = await supabase
    .from('tasks')
    .select('id, title, date, start_time')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(5);

  const streak = await getCompletionStreak(userId);

  return {
    date,
    do_today: pending.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      start_time: t.start_time,
      priority: t.priority,
    })),
    urgent: pending
      .filter((t) => t.priority === 'high')
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, start_time: t.start_time })),
    missed: (missedTasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date,
      start_time: t.start_time,
    })),
    streak,
    productivity_score: stats.score,
    tasks_completed: stats.completed,
    tasks_total: stats.total,
  };
}
