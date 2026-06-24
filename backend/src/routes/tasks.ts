import { Router } from 'express';
import { z } from 'zod';
import { getSupabase } from '../db';
import { isUuid, type TaskPriority, type TaskRow, type TaskStatus } from '../models';
import { requireAuth } from '../middleware/requireAuth';

function toPublicTask(t: TaskRow) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    date: t.date,
    start_time: t.start_time,
    end_time: t.end_time,
    priority: t.priority,
    status: t.status,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

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
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: statusSchema.optional(),
});

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get('/', async (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getSupabase();
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.auth.sub)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) query = query.eq('date', date);

  const { data: rows, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load tasks' });

  return res.json({ tasks: (rows ?? []).map(toPublicTask) });
});

tasksRouter.post('/', async (req, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: req.auth.sub,
      ...parsed.data,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) return res.status(500).json({ error: 'Failed to create task' });
  return res.status(201).json({ task: toPublicTask(data) });
});

tasksRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' });

  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });
  if (!req.auth?.sub) return res.status(401).json({ error: 'Not authenticated' });

  const now = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...parsed.data, updated_at: now })
    .eq('id', id)
    .eq('user_id', req.auth.sub)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to update task' });
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json({ task: toPublicTask(data) });
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
