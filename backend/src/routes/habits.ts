import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import { isUuid, type HabitRow } from '../models';
import { requireAuth } from '../middleware/requireAuth';
import { todayString } from '../recurrence';
import {
  computeHabitStreak,
  getHabitTimeStatus,
  isHabitScheduledOnDate,
  type HabitTimeStatus,
} from '../habits';
import {
  cancelHabitNotifications,
  cancelHabitNotificationsForDate,
  scheduleHabitReminders,
  scheduleHabitRemindersForDate,
} from '../jobs/scheduleHabitReminders';

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

async function afterHabitChange(userId: string, habit: HabitRow) {
  try {
    const supabase = getSupabase();
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
    if (user?.email) await scheduleHabitReminders(userId, habit, user.email);
  } catch {
    // non-blocking
  }
}

function toPublicHabit(
  h: HabitRow,
  opts: {
    date: string;
    completedToday?: boolean;
    streak?: number;
    scheduledToday?: boolean;
    time_status?: HabitTimeStatus;
  }
) {
  return {
    id: h.id,
    title: h.title,
    description: h.description,
    color: h.color,
    target_days: h.target_days,
    start_time: h.start_time,
    end_time: h.end_time,
    completed_today: opts.completedToday ?? false,
    streak: opts.streak ?? 0,
    scheduled_today: opts.scheduledToday ?? isHabitScheduledOnDate(h, opts.date),
    time_status: opts.time_status ?? getHabitTimeStatus(h, opts.completedToday ?? false, opts.date),
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
}

const habitCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).default(''),
    color: z.string().trim().max(20).default('blue'),
    target_days: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
    start_time: timeSchema.default('09:00'),
    end_time: timeSchema.default('09:30'),
  })
  .refine((d) => {
    const [sh, sm] = d.start_time.split(':').map(Number);
    const [eh, em] = d.end_time.split(':').map(Number);
    return eh * 60 + em > sh * 60 + sm;
  }, { message: 'End time must be after start time' });

const habitUpdateSchema = habitCreateSchema.partial();

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

habitsRouter.get('/', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.query.date === 'string' ? req.query.date : todayString();
  const supabase = getSupabase();

  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.auth.sub)
    .order('start_time', { ascending: true });

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
    const row = h as HabitRow;
    const habitLogs = (logsByHabit.get(row.id) ?? [])
      .filter((l) => l.completed)
      .map((l) => l.date);
    const completedToday = habitLogs.includes(date);
    const streak = computeHabitStreak(row, habitLogs, date);
    const timeStatus = getHabitTimeStatus(row, completedToday, date);

    return toPublicHabit(row, {
      date,
      completedToday,
      streak,
      time_status: timeStatus,
    });
  });

  result.sort((a, b) => {
    if (a.scheduled_today !== b.scheduled_today) return a.scheduled_today ? -1 : 1;
    return a.start_time.localeCompare(b.start_time);
  });

  return res.json({ habits: result });
});

habitsRouter.post('/', async (req, res) => {
  const parsed = habitCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid habit data';
    return res.status(400).json({ error: msg });
  }
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: req.auth.sub, ...parsed.data, created_at: now, updated_at: now })
    .select()
    .single();

  if (error || !data) return res.status(500).json({ error: 'Failed to create habit' });

  const habit = data as HabitRow;
  void afterHabitChange(req.auth.sub, habit);

  const date = todayString();
  return res.status(201).json({
    habit: toPublicHabit(habit, { date }),
  });
});

habitsRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });

  const parsed = habitUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid habit data';
    return res.status(400).json({ error: msg });
  }
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: 'Failed to update habit' });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const startTime = parsed.data.start_time ?? (existing as HabitRow).start_time;
  const endTime = parsed.data.end_time ?? (existing as HabitRow).end_time;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('habits')
    .update({ ...parsed.data, updated_at: now })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to update habit' });
  if (!data) return res.status(404).json({ error: 'Not found' });

  const habit = data as HabitRow;
  void afterHabitChange(req.auth.sub, habit);

  const date = todayString();
  return res.json({ habit: toPublicHabit(habit, { date }) });
});

habitsRouter.post('/:id/toggle', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.body?.date === 'string' ? req.body.date : todayString();
  const supabase = getSupabase();

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id, completed')
    .eq('habit_id', id)
    .eq('user_id', req.auth.sub)
    .eq('date', date)
    .maybeSingle();

  const { data: user } = await supabase.from('users').select('email').eq('id', req.auth.sub).maybeSingle();

  if (existing) {
    await supabase.from('habit_logs').delete().eq('id', existing.id);
    if (habit && user?.email) {
      void scheduleHabitRemindersForDate(req.auth.sub, habit as HabitRow, user.email, date);
    }
    return res.json({ completed: false, date });
  }

  await supabase.from('habit_logs').insert({
    habit_id: id,
    user_id: req.auth.sub,
    date,
    completed: true,
  });

  await cancelHabitNotificationsForDate(id, date);
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

  await cancelHabitNotifications(id);
  return res.json({ ok: true });
});
