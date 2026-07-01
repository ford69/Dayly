import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import { isUuid, type HabitRow } from '../models';
import { requireAuth } from '../middleware/requireAuth';

function toPublicHabit(h: HabitRow, completedToday = false, streak = 0) {
  return {
    id: h.id,
    title: h.title,
    description: h.description,
    color: h.color,
    target_days: h.target_days,
    completed_today: completedToday,
    streak,
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
}

const habitCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  color: z.string().trim().max(20).default('blue'),
  target_days: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
});

const habitUpdateSchema = habitCreateSchema.partial();

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

habitsRouter.get('/', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().split('T')[0];
  const supabase = getSupabase();

  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.auth.sub)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to load habits' });

  const habitIds = (habits ?? []).map((h) => h.id);
  let logs: { habit_id: string; date: string; completed: boolean }[] = [];
  if (habitIds.length > 0) {
    const { data: logData } = await supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', req.auth.sub)
      .in('habit_id', habitIds);
    logs = logData ?? [];
  }

  const logsByHabit = new Map<string, { date: string; completed: boolean }[]>();
  for (const log of logs ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push({ date: log.date, completed: log.completed });
    logsByHabit.set(log.habit_id, list);
  }

  const result = (habits ?? []).map((h) => {
    const habitLogs = (logsByHabit.get(h.id) ?? []).filter((l) => l.completed).map((l) => l.date).sort();
    const completedToday = habitLogs.includes(date);
    let streak = 0;
    const check = new Date(date + 'T00:00:00');
    while (true) {
      const ds = check.toISOString().split('T')[0];
      if (habitLogs.includes(ds)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return toPublicHabit(h as HabitRow, completedToday, streak);
  });

  return res.json({ habits: result });
});

habitsRouter.post('/', async (req, res) => {
  const parsed = habitCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid habit data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: req.auth.sub, ...parsed.data, created_at: now, updated_at: now })
    .select()
    .single();

  if (error || !data) return res.status(500).json({ error: 'Failed to create habit' });
  return res.status(201).json({ habit: toPublicHabit(data as HabitRow) });
});

habitsRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });

  const parsed = habitUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid habit data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .update({ ...parsed.data, updated_at: now })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to update habit' });
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json({ habit: toPublicHabit(data as HabitRow) });
});

habitsRouter.post('/:id/toggle', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date =
    typeof req.body?.date === 'string' ? req.body.date : new Date().toISOString().split('T')[0];

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id, completed')
    .eq('habit_id', id)
    .eq('user_id', req.auth.sub)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    await supabase.from('habit_logs').delete().eq('id', existing.id);
    return res.json({ completed: false, date });
  }

  await supabase.from('habit_logs').insert({
    habit_id: id,
    user_id: req.auth.sub,
    date,
    completed: true,
  });

  return res.json({ completed: true, date });
});

habitsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select('id')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to delete habit' });
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
});
