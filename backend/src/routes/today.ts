import { Router } from 'express';
import { getSupabase } from '../db';
import { rescheduleAllUserReminders } from '../jobs/rescheduleUserReminders';
import { buildTodaySummary } from '../services/todaySummary';
import { requireAuth } from '../middleware/requireAuth';
import { todayString } from '../recurrence';
import { isValidTimezone } from '../timezone';

export const todayRouter = Router();
todayRouter.use(requireAuth);

todayRouter.get('/summary', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.query.date === 'string' ? req.query.date : todayString();

  try {
    const summary = await buildTodaySummary(req.auth.sub, date);
    return res.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load summary';
    return res.status(500).json({ error: message });
  }
});

todayRouter.get('/preferences', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('email_reminders_enabled, timezone')
    .eq('id', req.auth.sub)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to load preferences' });
  return res.json({
    email_reminders_enabled: data.email_reminders_enabled,
    timezone: data.timezone,
  });
});

todayRouter.put('/preferences', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const emailReminders = req.body?.email_reminders_enabled;
  const timezone = req.body?.timezone;

  if (emailReminders !== undefined && typeof emailReminders !== 'boolean') {
    return res.status(400).json({ error: 'email_reminders_enabled must be a boolean' });
  }
  if (timezone !== undefined && (typeof timezone !== 'string' || !isValidTimezone(timezone))) {
    return res.status(400).json({ error: 'Invalid timezone' });
  }

  const updates: Record<string, unknown> = {};
  if (emailReminders !== undefined) updates.email_reminders_enabled = emailReminders;
  if (timezone !== undefined) updates.timezone = timezone;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No preferences to update' });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.auth.sub)
    .select('id, email, email_reminders_enabled, timezone')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update preferences' });

  if (emailReminders === true) {
    void rescheduleAllUserReminders(req.auth.sub);
  }

  return res.json({
    email_reminders_enabled: data.email_reminders_enabled,
    timezone: data.timezone,
  });
});
