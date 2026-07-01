import { getSupabase } from '../db';
import { sendEmail } from '../email/brevo';
import { todayString } from '../recurrence';

const BATCH_SIZE = 50;

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
    const payload = row.payload as {
      email?: string;
      message?: string;
      task_title?: string;
    };

    if (!payload.email) {
      await supabase
        .from('notification_queue')
        .update({ status: 'failed', error: 'Missing email in payload' })
        .eq('id', row.id);
      failed++;
      continue;
    }

    try {
      const subject =
        row.kind === 'daily_summary'
          ? 'Your Dayly summary'
          : row.kind === 'missed_tasks'
            ? 'Tasks you missed — Dayly'
            : `Reminder: ${payload.task_title ?? 'Task'}`;

      const html = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px;">
          <h2 style="margin:0 0 12px;">Dayly</h2>
          <p style="margin:0 0 16px; color:#444;">${payload.message ?? 'You have a task reminder.'}</p>
          <p style="margin:0; color:#888; font-size:12px;">Manage tasks at your Dayly app.</p>
        </div>
      `;

      await sendEmail({
        to: { email: payload.email },
        subject,
        html,
        text: payload.message ?? subject,
      });

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

export async function sendDailySummaries() {
  const supabase = getSupabase();
  const today = todayString();

  const { data: users } = await supabase
    .from('users')
    .select('id, email, workspace_id')
    .eq('email_reminders_enabled', true);

  let queued = 0;

  for (const user of users ?? []) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, priority, status, start_time')
      .eq('user_id', user.id)
      .eq('date', today);

    const pending = (tasks ?? []).filter((t) => t.status === 'pending');
    if (pending.length === 0) continue;

    const high = pending.filter((t) => t.priority === 'high').length;
    const summary = `Today: ${pending.length} task${pending.length === 1 ? '' : 's'} remaining${high ? ` (${high} high priority)` : ''}.`;

    const { error } = await supabase.from('notification_queue').insert({
      user_id: user.id,
      workspace_id: user.workspace_id,
      task_id: null,
      channel: 'email',
      kind: 'daily_summary',
      scheduled_for: new Date().toISOString(),
      payload: { email: user.email, message: summary },
      status: 'pending',
    });

    if (!error) queued++;
  }

  return { queued };
}
