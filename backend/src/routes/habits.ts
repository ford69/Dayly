import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import { HABIT_TEMPLATES } from '../habitTemplates';
import {
  achievedMilestones,
  buildHeatmap,
  computeInsights,
  computeStreaks,
  computeWeeklyStats,
  getHabitTimeStatus,
  isGoalMet,
  isHabitScheduledOnDate,
  progressPercent,
  suggestReminderTime,
} from '../habitsCore';
import {
  cancelHabitNotifications,
  cancelHabitNotificationsForDate,
  scheduleHabitReminders,
  scheduleHabitRemindersForDate,
} from '../jobs/scheduleHabitReminders';
import { isUuid, type HabitLogRow, type HabitRow } from '../models';
import { requireAuth } from '../middleware/requireAuth';
import { addDays, todayString } from '../recurrence';

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const habitCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  icon: z.string().trim().max(40).default('circle'),
  color: z.string().trim().max(20).default('blue'),
  category: z
    .enum(['fitness', 'learning', 'work', 'wellness', 'finance', 'relationships', 'other'])
    .default('wellness'),
  frequency: z
    .enum(['daily', 'weekdays', 'weekends', 'weekly', 'every_n_days', 'every_n_weeks', 'monthly', 'custom'])
    .default('daily'),
  frequency_config: z.record(z.string(), z.unknown()).default({}),
  goal_type: z.enum(['checkbox', 'numeric', 'timer', 'distance', 'count']).default('checkbox'),
  target: z.number().positive().default(1),
  unit: z.string().trim().max(40).default(''),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  reminder_time: timeSchema.nullable().optional(),
  rest_days: z.array(z.number().int().min(0).max(6)).default([]),
  start_time: timeSchema.default('09:00'),
  end_time: timeSchema.default('09:30'),
  target_days: z.array(z.number().int().min(0).max(6)).optional(),
});

const habitUpdateSchema = habitCreateSchema.partial();
const logSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  value: z.number().min(0),
  note: z.string().trim().max(500).optional(),
});

async function loadHabitContext(userId: string, habitIds: string[], date: string) {
  const supabase = getSupabase();
  let logs: HabitLogRow[] = [];
  let freezes: string[] = [];

  if (habitIds.length > 0) {
    const [{ data: logData }, { data: freezeData }] = await Promise.all([
      supabase.from('habit_logs').select('*').eq('user_id', userId).in('habit_id', habitIds),
      supabase.from('habit_streak_freezes').select('habit_id, date').eq('user_id', userId).in('habit_id', habitIds),
    ]);
    logs = (logData ?? []) as HabitLogRow[];
    freezes = (freezeData ?? []).map((f) => `${f.habit_id}:${f.date}`);
  }

  const logsByHabit = new Map<string, HabitLogRow[]>();
  const freezesByHabit = new Map<string, string[]>();
  for (const log of logs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }
  for (const key of freezes) {
    const [habitId, d] = key.split(':');
    const list = freezesByHabit.get(habitId) ?? [];
    list.push(d);
    freezesByHabit.set(habitId, list);
  }

  return { logsByHabit, freezesByHabit };
}

function toPublicHabit(
  h: HabitRow,
  opts: {
    date: string;
    logs: HabitLogRow[];
    freezes: string[];
  }
) {
  const todayLog = opts.logs.find((l) => l.date === opts.date);
  const todayValue = todayLog ? Number(todayLog.value) : 0;
  const goalMet = todayLog ? isGoalMet(h, todayValue) : false;
  const { current, best } = computeStreaks(h, opts.logs, opts.freezes, opts.date);
  const suggested = suggestReminderTime(opts.logs);

  return {
    id: h.id,
    title: h.title,
    description: h.description,
    icon: h.icon,
    color: h.color,
    category: h.category,
    frequency: h.frequency,
    frequency_config: h.frequency_config ?? {},
    goal_type: h.goal_type,
    target: Number(h.target),
    unit: h.unit,
    start_date: h.start_date,
    end_date: h.end_date,
    status: h.status,
    reminder_time: h.reminder_time,
    rest_days: h.rest_days ?? [],
    start_time: h.start_time ?? '09:00',
    end_time: h.end_time ?? '09:30',
    today_value: todayValue,
    today_progress: progressPercent(h, todayValue),
    goal_met_today: goalMet,
    scheduled_today: isHabitScheduledOnDate(h, opts.date),
    time_status: getHabitTimeStatus(h, goalMet, opts.date),
    current_streak: current,
    best_streak: best,
    milestones: achievedMilestones(best),
    suggested_reminder: suggested,
    created_at: h.created_at,
    updated_at: h.updated_at,
  };
}

async function afterHabitChange(userId: string, habit: HabitRow) {
  try {
    const supabase = getSupabase();
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
    if (user?.email) await scheduleHabitReminders(userId, habit, user.email);
  } catch {
    // non-blocking
  }
}

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

habitsRouter.get('/templates', (_req, res) => {
  return res.json({ templates: HABIT_TEMPLATES });
});

habitsRouter.get('/weekly', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });
  const weekStart =
    typeof req.query.week_start === 'string' ? req.query.week_start : todayString();
  const weekEnd = addDays(weekStart, 6);

  const supabase = getSupabase();
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.auth.sub)
    .neq('status', 'archived');

  const habitIds = (habits ?? []).map((h) => h.id);
  const { data: logs } =
    habitIds.length > 0
      ? await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', req.auth.sub)
          .in('habit_id', habitIds)
          .gte('date', weekStart)
          .lte('date', weekEnd)
      : { data: [] };

  const stats = computeWeeklyStats(
    (habits ?? []) as HabitRow[],
    (logs ?? []) as HabitLogRow[],
    weekStart,
    weekEnd
  );

  return res.json({ week_start: weekStart, week_end: weekEnd, stats });
});

habitsRouter.get('/', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.query.date === 'string' ? req.query.date : todayString();
  const supabase = getSupabase();

  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.auth.sub)
    .neq('status', 'archived')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to load habits' });

  const habitIds = (habits ?? []).map((h) => h.id);
  const { logsByHabit, freezesByHabit } = await loadHabitContext(req.auth.sub, habitIds, date);

  const result = (habits ?? []).map((h) => {
    const row = h as HabitRow;
    return toPublicHabit(row, {
      date,
      logs: logsByHabit.get(row.id) ?? [],
      freezes: freezesByHabit.get(row.id) ?? [],
    });
  });

  result.sort((a, b) => {
    if (a.scheduled_today !== b.scheduled_today) return a.scheduled_today ? -1 : 1;
    if (a.goal_met_today !== b.goal_met_today) return a.goal_met_today ? 1 : -1;
    return a.title.localeCompare(b.title);
  });

  return res.json({ habits: result, date });
});

habitsRouter.get('/:id/heatmap', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const to = typeof req.query.to === 'string' ? req.query.to : todayString();
  const from = typeof req.query.from === 'string' ? req.query.from : addDays(to, -90);

  const supabase = getSupabase();
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  if (!habit) return res.status(404).json({ error: 'Not found' });

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', id)
    .eq('user_id', req.auth.sub)
    .gte('date', from)
    .lte('date', to);

  const cells = buildHeatmap(habit as HabitRow, (logs ?? []) as HabitLogRow[], from, to);
  return res.json({ habit_id: id, from, to, cells });
});

habitsRouter.get('/:id/insights', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const to = todayString();
  const from = addDays(to, -30);

  const supabase = getSupabase();
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  if (!habit) return res.status(404).json({ error: 'Not found' });

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', id)
    .eq('user_id', req.auth.sub)
    .gte('date', from)
    .lte('date', to);

  const insights = computeInsights(habit as HabitRow, (logs ?? []) as HabitLogRow[], from, to);
  const suggested = suggestReminderTime((logs ?? []) as HabitLogRow[]);

  return res.json({ insights, suggested_reminder: suggested });
});

habitsRouter.post('/', async (req, res) => {
  const parsed = habitCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid habit data' });
  }
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { target_days, start_date, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: req.auth.sub,
      ...rest,
      start_date: start_date ?? todayString(),
      target_days: target_days ?? [0, 1, 2, 3, 4, 5, 6],
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) return res.status(500).json({ error: 'Failed to create habit' });

  const habit = data as HabitRow;
  void afterHabitChange(req.auth.sub, habit);

  return res.status(201).json({
    habit: toPublicHabit(habit, { date: todayString(), logs: [], freezes: [] }),
  });
});

habitsRouter.post('/from-template', async (req, res) => {
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });
  const templateId = req.body?.template_id;
  if (typeof templateId !== 'string') return res.status(400).json({ error: 'template_id required' });

  const group = HABIT_TEMPLATES.find((t) => t.id === templateId);
  if (!group) return res.status(404).json({ error: 'Template not found' });

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const created = [];

  for (const item of group.habits) {
    const { data } = await supabase
      .from('habits')
      .insert({
        user_id: req.auth.sub,
        title: item.title,
        description: item.description ?? '',
        icon: item.icon,
        color: 'blue',
        category: item.category,
        frequency: item.frequency,
        frequency_config: item.frequency_config ?? {},
        goal_type: item.goal_type,
        target: item.target,
        unit: item.unit,
        start_date: todayString(),
        status: 'active',
        target_days: [0, 1, 2, 3, 4, 5, 6],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (data) {
      void afterHabitChange(req.auth.sub, data as HabitRow);
      created.push(data);
    }
  }

  return res.status(201).json({ created: created.length, template: group.name });
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

  const habit = data as HabitRow;
  void afterHabitChange(req.auth.sub, habit);

  const { logsByHabit, freezesByHabit } = await loadHabitContext(req.auth.sub, [id], todayString());
  return res.json({
    habit: toPublicHabit(habit, {
      date: todayString(),
      logs: logsByHabit.get(id) ?? [],
      freezes: freezesByHabit.get(id) ?? [],
    }),
  });
});

habitsRouter.post('/:id/log', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid log data' });

  const date = parsed.data.date ?? todayString();
  const supabase = getSupabase();

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  if (!habit) return res.status(404).json({ error: 'Not found' });

  const h = habit as HabitRow;
  const value = parsed.data.value;
  const completed = isGoalMet(h, value);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', req.auth.sub)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('habit_logs')
      .update({
        value,
        completed,
        completed_at: completed ? now : null,
        note: parsed.data.note ?? '',
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('habit_logs').insert({
      habit_id: id,
      user_id: req.auth.sub,
      date,
      value,
      completed,
      completed_at: completed ? now : null,
      note: parsed.data.note ?? '',
    });
  }

  if (completed) {
    await cancelHabitNotificationsForDate(id, date);
  } else {
    const { data: user } = await supabase.from('users').select('email').eq('id', req.auth.sub).maybeSingle();
    if (user?.email) void scheduleHabitRemindersForDate(req.auth.sub, h, user.email, date);
  }

  const { logsByHabit, freezesByHabit } = await loadHabitContext(req.auth.sub, [id], date);
  return res.json({
    habit: toPublicHabit(h, {
      date,
      logs: logsByHabit.get(id) ?? [],
      freezes: freezesByHabit.get(id) ?? [],
    }),
  });
});

habitsRouter.post('/:id/freeze', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const date = typeof req.body?.date === 'string' ? req.body.date : todayString();
  const supabase = getSupabase();

  const { error } = await supabase.from('habit_streak_freezes').upsert(
    { habit_id: id, user_id: req.auth.sub, date },
    { onConflict: 'habit_id,date' }
  );

  if (error) return res.status(500).json({ error: 'Failed to freeze streak' });
  return res.json({ ok: true, date });
});

habitsRouter.post('/:id/link-task', async (req, res) => {
  const id = req.params.id;
  const taskId = req.body?.task_id;
  if (!isUuid(id) || !isUuid(taskId)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { error } = await supabase.from('habit_task_links').upsert(
    {
      habit_id: id,
      task_id: taskId,
      user_id: req.auth.sub,
      auto_complete: req.body?.auto_complete !== false,
    },
    { onConflict: 'habit_id,task_id' }
  );

  if (error) return res.status(500).json({ error: 'Failed to link task' });
  return res.json({ ok: true });
});

habitsRouter.delete('/:id/link-task/:taskId', async (req, res) => {
  const { id, taskId } = req.params;
  if (!isUuid(id) || !isUuid(taskId)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  await supabase
    .from('habit_task_links')
    .delete()
    .eq('habit_id', id)
    .eq('task_id', taskId)
    .eq('user_id', req.auth.sub);

  return res.json({ ok: true });
});

habitsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select('id')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to delete habit' });
  if (!data) return res.status(404).json({ error: 'Not found' });

  await cancelHabitNotifications(id);
  return res.json({ ok: true });
});
