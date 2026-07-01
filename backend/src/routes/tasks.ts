import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import {
  generateInstanceDates,
  suggestNextSlot,
  type RecurrenceRule,
} from '../recurrence';
import { isUuid, type TaskPriority, type TaskRow, type TaskStatus } from '../models';
import { requireAuth } from '../middleware/requireAuth';

async function getDependencyMap(userId: string, taskIds: string[]) {
  if (taskIds.length === 0) return new Map<string, string[]>();

  const supabase = getSupabase();
  const { data } = await supabase
    .from('task_dependencies')
    .select('task_id, depends_on_task_id')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.task_id) ?? [];
    list.push(row.depends_on_task_id);
    map.set(row.task_id, list);
  }
  return map;
}

function toPublicTask(t: TaskRow, extra?: { depends_on?: string[]; blocked?: boolean }) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    date: t.date,
    start_time: t.start_time,
    end_time: t.end_time,
    priority: t.priority,
    status: t.status,
    recurrence_rule: t.recurrence_rule ?? 'none',
    recurrence_parent_id: t.recurrence_parent_id ?? null,
    recurrence_end: t.recurrence_end ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
    depends_on: extra?.depends_on ?? [],
    blocked: extra?.blocked ?? false,
  };
}

const recurrenceSchema = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly'] satisfies [
  RecurrenceRule,
  RecurrenceRule,
  RecurrenceRule,
  RecurrenceRule,
  RecurrenceRule,
]);
const prioritySchema = z.enum(['low', 'medium', 'high'] satisfies [TaskPriority, TaskPriority, TaskPriority]);
const statusSchema = z.enum(['pending', 'completed'] satisfies [TaskStatus, TaskStatus]);

const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  priority: prioritySchema,
  status: statusSchema.optional().default('pending'),
  recurrence_rule: recurrenceSchema.optional().default('none'),
  recurrence_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  depends_on: z.array(z.string().uuid()).optional().default([]),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: statusSchema.optional(),
  depends_on: z.array(z.string().uuid()).optional(),
});

async function syncDependencies(userId: string, taskId: string, dependsOn: string[]) {
  const supabase = getSupabase();
  await supabase.from('task_dependencies').delete().eq('task_id', taskId).eq('user_id', userId);

  if (dependsOn.length === 0) return;

  const rows = dependsOn.map((depends_on_task_id) => ({
    user_id: userId,
    task_id: taskId,
    depends_on_task_id,
  }));
  await supabase.from('task_dependencies').insert(rows);
}

async function generateRecurringInstances(userId: string, parent: TaskRow) {
  if (parent.recurrence_rule === 'none') return;

  const supabase = getSupabase();
  const dates = generateInstanceDates(
    parent.recurrence_rule,
    parent.date,
    parent.recurrence_end,
    90
  ).filter((d) => d !== parent.date);

  if (dates.length === 0) return;

  const now = new Date().toISOString();
  const instances = dates.map((date) => ({
    user_id: userId,
    title: parent.title,
    description: parent.description,
    date,
    start_time: parent.start_time,
    end_time: parent.end_time,
    priority: parent.priority,
    status: 'pending' as const,
    recurrence_rule: 'none' as const,
    recurrence_parent_id: parent.id,
    recurrence_end: null,
    created_at: now,
    updated_at: now,
  }));

  await supabase.from('tasks').insert(instances);
}

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get('/', async (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.auth.sub)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) query = query.eq('date', date);
  else if (from && to) query = query.gte('date', from).lte('date', to);

  const { data: rows, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load tasks' });

  const tasks = (rows ?? []) as TaskRow[];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const depMap = await getDependencyMap(
    req.auth.sub,
    tasks.map((t) => t.id)
  );

  const publicTasks = tasks.map((t) => {
    const deps = depMap.get(t.id) ?? [];
    const blocked = deps.some((depId) => taskMap.get(depId)?.status !== 'completed');
    return toPublicTask(t, { depends_on: deps, blocked });
  });

  return res.json({ tasks: publicTasks });
});

tasksRouter.post('/', async (req, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const { depends_on, recurrence_rule, recurrence_end, ...taskData } = parsed.data;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: req.auth.sub,
      ...taskData,
      recurrence_rule,
      recurrence_end: recurrence_end ?? null,
      recurrence_parent_id: null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) return res.status(500).json({ error: 'Failed to create task' });

  const task = data as TaskRow;
  await syncDependencies(req.auth.sub, task.id, depends_on);
  if (recurrence_rule !== 'none') await generateRecurringInstances(req.auth.sub, task);

  const deps = depends_on;
  return res.status(201).json({ task: toPublicTask(task, { depends_on: deps, blocked: false }) });
});

tasksRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });

  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const { depends_on, ...updateFields } = parsed.data;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updateFields, updated_at: now })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to update task' });
  if (!data) return res.status(404).json({ error: 'Not found' });

  if (depends_on !== undefined) await syncDependencies(req.auth.sub, id, depends_on);

  const task = data as TaskRow;
  const depMap = await getDependencyMap(req.auth.sub, [task.id]);
  const deps = depMap.get(task.id) ?? [];

  return res.json({ task: toPublicTask(task, { depends_on: deps }) });
});

tasksRouter.post('/:id/reschedule', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .maybeSingle();

  if (error || !task) return res.status(404).json({ error: 'Not found' });

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('date, start_time, end_time')
    .eq('user_id', req.auth.sub)
    .eq('status', 'pending')
    .neq('id', id);

  const suggestion = suggestNextSlot(
    task.date,
    task.start_time,
    task.end_time,
    (allTasks ?? []).filter((t) => t.date >= task.date)
  );

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('tasks')
    .update({ ...suggestion, updated_at: now })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select()
    .single();

  if (updateError || !updated) return res.status(500).json({ error: 'Failed to reschedule' });

  return res.json({ task: toPublicTask(updated as TaskRow), suggestion });
});

tasksRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select('id')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to delete task' });
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
});
