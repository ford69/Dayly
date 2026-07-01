import { Router } from 'express';
import { getSupabase } from '../db';
import { buildTodaySummary } from '../services/todaySummary';
import { requireAuth } from '../middleware/requireAuth';
import { todayString } from '../recurrence';

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

todayRouter.put('/preferences', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const emailReminders = req.body?.email_reminders_enabled;
  if (typeof emailReminders !== 'boolean') {
    return res.status(400).json({ error: 'email_reminders_enabled must be a boolean' });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .update({ email_reminders_enabled: emailReminders })
    .eq('id', req.auth.sub)
    .select('id, email, email_reminders_enabled')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update preferences' });
  return res.json({ user: data });
});
