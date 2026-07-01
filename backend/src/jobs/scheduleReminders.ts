import { getSupabase } from '../db';
import type { TaskRow } from '../models';

export type NotificationKind = 'task_reminder_10m' | 'task_reminder_5m' | 'task_starting' | 'daily_summary' | 'missed_tasks';

function taskStartAt(date: string, startTime: string): Date {
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function cancelTaskNotifications(taskId: string) {
  const supabase = getSupabase();
  await supabase
    .from('notification_queue')
    .update({ status: 'cancelled' })
    .eq('task_id', taskId)
    .eq('status', 'pending');
}

export async function scheduleTaskReminders(userId: string, task: TaskRow, userEmail: string) {
  if (task.status === 'completed') {
    await cancelTaskNotifications(task.id);
    return;
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('email_reminders_enabled, workspace_id')
    .eq('id', userId)
    .maybeSingle();

  if (!user?.email_reminders_enabled) return;

  await cancelTaskNotifications(task.id);

  const start = taskStartAt(task.date, task.start_time);
  const now = new Date();
  const workspaceId = user.workspace_id ?? null;

  const reminders: { kind: NotificationKind; scheduled_for: Date; message: string }[] = [
    {
      kind: 'task_reminder_10m',
      scheduled_for: new Date(start.getTime() - 10 * 60 * 1000),
      message: `"${task.title}" starts in 10 minutes`,
    },
    {
      kind: 'task_reminder_5m',
      scheduled_for: new Date(start.getTime() - 5 * 60 * 1000),
      message: `"${task.title}" starts in 5 minutes`,
    },
    {
      kind: 'task_starting',
      scheduled_for: start,
      message: `"${task.title}" is starting now`,
    },
  ];

  const rows = reminders
    .filter((r) => r.scheduled_for > now)
    .map((r) => ({
      user_id: userId,
      workspace_id: workspaceId,
      task_id: task.id,
      channel: 'email' as const,
      kind: r.kind,
      scheduled_for: r.scheduled_for.toISOString(),
      payload: {
        email: userEmail,
        task_title: task.title,
        task_date: task.date,
        start_time: task.start_time,
        message: r.message,
      },
      status: 'pending' as const,
    }));

  if (rows.length > 0) {
    await supabase.from('notification_queue').insert(rows);
  }
}
