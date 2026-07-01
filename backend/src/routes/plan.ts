import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import { planDay, smartReminderMessage } from '../planner';
import type { TaskRow } from '../models';
import { requireAuth } from '../middleware/requireAuth';

export const planRouter = Router();
planRouter.use(requireAuth);

planRouter.post('/day', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date =
    typeof req.body?.date === 'string' ? req.body.date : new Date().toISOString().split('T')[0];

  const supabase = getSupabase();
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.auth.sub)
    .eq('date', date);

  if (error) return res.status(500).json({ error: 'Failed to load tasks' });

  const result = planDay((tasks ?? []) as TaskRow[], date);
  return res.json(result);
});

planRouter.post('/apply', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const schema = z.object({
    suggestions: z.array(
      z.object({
        task_id: z.string().uuid(),
        suggested_date: z.string(),
        suggested_start_time: z.string(),
        suggested_end_time: z.string(),
      })
    ),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid plan data' });

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const updated = [];

  for (const s of parsed.data.suggestions) {
    const { data } = await supabase
      .from('tasks')
      .update({
        date: s.suggested_date,
        start_time: s.suggested_start_time,
        end_time: s.suggested_end_time,
        updated_at: now,
      })
      .eq('id', s.task_id)
      .eq('user_id', req.auth.sub)
      .select()
      .maybeSingle();

    if (data) updated.push(data);
  }

  return res.json({ tasks: updated, applied: updated.length });
});

planRouter.get('/reminder', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date =
    typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().split('T')[0];

  const supabase = getSupabase();
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', req.auth.sub).eq('date', date);

  const message = smartReminderMessage((tasks ?? []) as TaskRow[], date);
  return res.json({ message });
});

planRouter.post('/focus', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const schema = z.object({
    task_id: z.string().uuid().nullable().optional(),
    duration_seconds: z.number().int().min(1).max(7200),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid focus session data' });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: req.auth.sub,
      task_id: parsed.data.task_id ?? null,
      duration_seconds: parsed.data.duration_seconds,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to log focus session' });
  return res.status(201).json({ session: data });
});
