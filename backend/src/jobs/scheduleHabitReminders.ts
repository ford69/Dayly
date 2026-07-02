import { getSupabase } from '../db';
import { isHabitScheduledOnDate } from '../habitsCore';
import type { HabitRow } from '../models';
import { addDays, todayString } from '../recurrence';

export type HabitNotificationKind = 'habit_reminder_10m' | 'habit_reminder_5m' | 'habit_starting';

const SCHEDULE_DAYS = 14;

function habitStartAt(date: string, startTime: string): Date {
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function cancelHabitNotifications(habitId: string) {
  const supabase = getSupabase();
  await supabase
    .from('notification_queue')
    .update({ status: 'cancelled' })
    .eq('habit_id', habitId)
    .eq('status', 'pending');
}

export async function cancelHabitNotificationsForDate(habitId: string, habitDate: string) {
  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from('notification_queue')
    .select('id, payload')
    .eq('habit_id', habitId)
    .eq('status', 'pending');

  for (const row of rows ?? []) {
    const payload = row.payload as { habit_date?: string };
    if (payload.habit_date === habitDate) {
      await supabase.from('notification_queue').update({ status: 'cancelled' }).eq('id', row.id);
    }
  }
}

export async function scheduleHabitReminders(userId: string, habit: HabitRow, userEmail: string) {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('email_reminders_enabled, workspace_id')
    .eq('id', userId)
    .maybeSingle();

  if (!user?.email_reminders_enabled) return;

  await cancelHabitNotifications(habit.id);

  const now = new Date();
  const workspaceId = user.workspace_id ?? null;
  const baseDate = todayString();
  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < SCHEDULE_DAYS; i++) {
    const habitDate = addDays(baseDate, i);
    if (!isHabitScheduledOnDate(habit, habitDate)) continue;

    const start = habitStartAt(habitDate, habit.start_time);
    const reminders: { kind: HabitNotificationKind; scheduled_for: Date; message: string }[] = [
      {
        kind: 'habit_reminder_10m',
        scheduled_for: new Date(start.getTime() - 10 * 60 * 1000),
        message: `Habit "${habit.title}" starts in 10 minutes`,
      },
      {
        kind: 'habit_reminder_5m',
        scheduled_for: new Date(start.getTime() - 5 * 60 * 1000),
        message: `Habit "${habit.title}" starts in 5 minutes`,
      },
      {
        kind: 'habit_starting',
        scheduled_for: start,
        message: `Time for "${habit.title}" — your habit is starting now`,
      },
    ];

    for (const r of reminders) {
      if (r.scheduled_for <= now) continue;
      rows.push({
        user_id: userId,
        workspace_id: workspaceId,
        task_id: null,
        habit_id: habit.id,
        channel: 'email',
        kind: r.kind,
        scheduled_for: r.scheduled_for.toISOString(),
        payload: {
          email: userEmail,
          habit_title: habit.title,
          habit_date: habitDate,
          start_time: habit.start_time,
          end_time: habit.end_time,
          message: r.message,
        },
        status: 'pending',
      });
    }
  }

  if (rows.length > 0) {
    await supabase.from('notification_queue').insert(rows);
  }
}

export async function scheduleHabitRemindersForDate(
  userId: string,
  habit: HabitRow,
  userEmail: string,
  habitDate: string
) {
  if (!isHabitScheduledOnDate(habit, habitDate)) return;

  await cancelHabitNotificationsForDate(habit.id, habitDate);

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('email_reminders_enabled, workspace_id')
    .eq('id', userId)
    .maybeSingle();

  if (!user?.email_reminders_enabled) return;

  const now = new Date();
  const start = habitStartAt(habitDate, habit.start_time);
  const reminders = [
    {
      kind: 'habit_reminder_10m' as const,
      scheduled_for: new Date(start.getTime() - 10 * 60 * 1000),
      message: `Habit "${habit.title}" starts in 10 minutes`,
    },
    {
      kind: 'habit_reminder_5m' as const,
      scheduled_for: new Date(start.getTime() - 5 * 60 * 1000),
      message: `Habit "${habit.title}" starts in 5 minutes`,
    },
    {
      kind: 'habit_starting' as const,
      scheduled_for: start,
      message: `Time for "${habit.title}" — your habit is starting now`,
    },
  ];

  const rows = reminders
    .filter((r) => r.scheduled_for > now)
    .map((r) => ({
      user_id: userId,
      workspace_id: user.workspace_id ?? null,
      task_id: null,
      habit_id: habit.id,
      channel: 'email',
      kind: r.kind,
      scheduled_for: r.scheduled_for.toISOString(),
      payload: {
        email: userEmail,
        habit_title: habit.title,
        habit_date: habitDate,
        start_time: habit.start_time,
        end_time: habit.end_time,
        message: r.message,
      },
      status: 'pending',
    }));

  if (rows.length > 0) {
    await supabase.from('notification_queue').insert(rows);
  }
}
