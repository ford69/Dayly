import { getSupabase } from '../db';
import { sendEmail } from '../email/brevo';
import { buildDigestEmail, buildReminderEmail, reminderSubject } from '../email/templates';
import { isHabitScheduledOnDate } from '../habits';
import type { HabitRow } from '../models';
import { addDays, todayString } from '../recurrence';
import { getLocalDateString, getLocalHour } from '../timezone';

const BATCH_SIZE = 50;
const MORNING_HOUR = 7;
const EVENING_HOUR = 20;
const MISSED_LOOKBACK_DAYS = 7;

type QueuePayload = {
  email?: string;
  message?: string;
  task_title?: string;
  habit_title?: string;
  local_date?: string;
  sections?: { title: string; items: string[] }[];
};

async function alreadySentDigest(userId: string, kind: string, localDate: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('notification_queue')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', kind)
    .in('status', ['pending', 'sent'])
    .contains('payload', { local_date: localDate })
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function processNotificationQueue() {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;

  for (const row of pending ?? []) {
    const payload = row.payload as QueuePayload;

    if (!payload.email) {
      await supabase
        .from('notification_queue')
        .update({ status: 'failed', error: 'Missing email in payload' })
        .eq('id', row.id);
      failed++;
      continue;
    }

    try {
      const title = payload.task_title ?? payload.habit_title ?? 'Dayly';
      const subject = reminderSubject(row.kind, title);

      let html: string;
      let text: string;

      if (row.kind === 'daily_summary' || row.kind === 'missed_tasks') {
        const digest = buildDigestEmail({
          headline: row.kind === 'daily_summary' ? 'Good morning' : 'Time to catch up',
          intro: payload.message ?? '',
          sections: payload.sections ?? [],
        });
        html = digest.html;
        text = digest.text;
      } else {
        const reminder = buildReminderEmail({
          headline: subject,
          message: payload.message ?? 'You have a reminder from Dayly.',
        });
        html = reminder.html;
        text = reminder.text;
      }

      await sendEmail({ to: { email: payload.email }, subject, html, text });

      await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', row.id);
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed';
      await supabase
        .from('notification_queue')
        .update({ status: 'failed', error: message })
        .eq('id', row.id);
      failed++;
    }
  }

  return { processed: (pending ?? []).length, sent, failed };
}

async function queueMorningSummary(
  user: { id: string; email: string; workspace_id: string | null },
  localDate: string
): Promise<boolean> {
  const supabase = getSupabase();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, priority, status, start_time')
    .eq('user_id', user.id)
    .eq('date', localDate)
    .order('start_time', { ascending: true });

  const { data: habits } = await supabase.from('habits').select('*').eq('user_id', user.id);

  const pendingTasks = (tasks ?? []).filter((t) => t.status === 'pending');
  const todayHabits = ((habits ?? []) as HabitRow[]).filter((h) => isHabitScheduledOnDate(h, localDate));

  if (pendingTasks.length === 0 && todayHabits.length === 0) return false;

  const high = pendingTasks.filter((t) => t.priority === 'high').length;
  const intro =
    pendingTasks.length > 0
      ? `You have ${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} scheduled today${high ? ` (${high} high priority)` : ''}.`
      : `You have ${todayHabits.length} habit${todayHabits.length === 1 ? '' : 's'} scheduled today.`;

  const sections = [
    {
      title: 'Tasks today',
      items: pendingTasks.map((t) => `${t.start_time} — ${t.title}${t.priority === 'high' ? ' ⚡' : ''}`),
    },
    {
      title: 'Habits today',
      items: todayHabits.map((h) => `${h.start_time}–${h.end_time} — ${h.title}`),
    },
  ];

  const { error } = await supabase.from('notification_queue').insert({
    user_id: user.id,
    workspace_id: user.workspace_id,
    task_id: null,
    habit_id: null,
    channel: 'email',
    kind: 'daily_summary',
    scheduled_for: new Date().toISOString(),
    payload: {
      email: user.email,
      message: intro,
      local_date: localDate,
      sections,
    },
    status: 'pending',
  });

  return !error;
}

async function queueMissedDigest(
  user: { id: string; email: string; workspace_id: string | null },
  localDate: string
): Promise<boolean> {
  const supabase = getSupabase();

  const { data: missedTasks } = await supabase
    .from('tasks')
    .select('title, date, start_time, priority')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lt('date', localDate)
    .order('date', { ascending: false })
    .limit(10);

  const { data: habits } = await supabase.from('habits').select('*').eq('user_id', user.id);
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, date, completed')
    .eq('user_id', user.id)
    .gte('date', addDays(localDate, -MISSED_LOOKBACK_DAYS));

  const completedSet = new Set(
    (logs ?? []).filter((l) => l.completed).map((l) => `${l.habit_id}:${l.date}`)
  );

  const missedHabits: string[] = [];
  for (let i = 1; i <= MISSED_LOOKBACK_DAYS; i++) {
    const checkDate = addDays(localDate, -i);
    for (const h of (habits ?? []) as HabitRow[]) {
      if (!isHabitScheduledOnDate(h, checkDate)) continue;
      if (!completedSet.has(`${h.id}:${checkDate}`)) {
        missedHabits.push(`${checkDate} — ${h.title} (${h.start_time})`);
      }
    }
  }

  const taskItems = (missedTasks ?? []).map(
    (t) => `${t.date} ${t.start_time} — ${t.title}${t.priority === 'high' ? ' ⚡' : ''}`
  );

  if (taskItems.length === 0 && missedHabits.length === 0) return false;

  const intro =
    taskItems.length + missedHabits.length === 1
      ? 'You have 1 item to catch up on.'
      : `You have ${taskItems.length + missedHabits.length} items to catch up on.`;

  const { error } = await supabase.from('notification_queue').insert({
    user_id: user.id,
    workspace_id: user.workspace_id,
    task_id: null,
    habit_id: null,
    channel: 'email',
    kind: 'missed_tasks',
    scheduled_for: new Date().toISOString(),
    payload: {
      email: user.email,
      message: intro,
      local_date: localDate,
      sections: [
        { title: 'Overdue tasks', items: taskItems },
        { title: 'Missed habits (last 7 days)', items: missedHabits.slice(0, 10) },
      ],
    },
    status: 'pending',
  });

  return !error;
}

/** Timezone-aware morning (7am) and evening (8pm) digests — run hourly via cron */
export async function runHourlyDigests() {
  const supabase = getSupabase();
  const { data: users } = await supabase
    .from('users')
    .select('id, email, timezone, workspace_id')
    .eq('email_reminders_enabled', true);

  const now = new Date();
  let morningQueued = 0;
  let missedQueued = 0;

  for (const user of users ?? []) {
    const tz = user.timezone || 'UTC';
    let localHour: number;
    let localDate: string;

    try {
      localHour = getLocalHour(tz, now);
      localDate = getLocalDateString(tz, now);
    } catch {
      continue;
    }

    if (localHour === MORNING_HOUR) {
      if (!(await alreadySentDigest(user.id, 'daily_summary', localDate))) {
        if (await queueMorningSummary(user, localDate)) morningQueued++;
      }
    }

    if (localHour === EVENING_HOUR) {
      if (!(await alreadySentDigest(user.id, 'missed_tasks', localDate))) {
        if (await queueMissedDigest(user, localDate)) missedQueued++;
      }
    }
  }

  return { morningQueued, missedQueued };
}

/** @deprecated Use runHourlyDigests — kept for manual/cron compatibility */
export async function sendDailySummaries() {
  const supabase = getSupabase();
  const today = todayString();
  const { data: users } = await supabase
    .from('users')
    .select('id, email, workspace_id')
    .eq('email_reminders_enabled', true);

  let queued = 0;
  for (const user of users ?? []) {
    if (await queueMorningSummary(user, today)) queued++;
  }
  return { queued };
}
