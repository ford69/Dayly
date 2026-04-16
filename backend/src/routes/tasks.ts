import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCollection } from '../db';
import type { TaskDoc, TaskPriority, TaskStatus } from '../models';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

function toPublicTask(t: TaskDoc) {
  return {
    id: t._id.toHexString(),
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
  const userId = new ObjectId((req as AuthedRequest).auth.sub);

  const tasks = await getCollection<TaskDoc>('tasks');
  const query: Partial<Pick<TaskDoc, 'user_id' | 'date'>> = { user_id: userId };
  if (date) query.date = date;

  const rows = await tasks.find(query).sort({ date: 1, start_time: 1 }).toArray();
  return res.json({ tasks: rows.map(toPublicTask) });
});

tasksRouter.post('/', async (req, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });

  const userId = new ObjectId((req as AuthedRequest).auth.sub);
  const tasks = await getCollection<TaskDoc>('tasks');

  const now = new Date().toISOString();
  const doc: TaskDoc = {
    _id: new ObjectId(),
    user_id: userId,
    ...parsed.data,
    created_at: now,
    updated_at: now,
  };

  await tasks.insertOne(doc);
  return res.status(201).json({ task: toPublicTask(doc) });
});

tasksRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid task data' });

  const userId = new ObjectId((req as AuthedRequest).auth.sub);
  const tasks = await getCollection<TaskDoc>('tasks');

  const now = new Date().toISOString();
  const update = { ...parsed.data, updated_at: now };

  const result = await tasks.findOneAndUpdate(
    { _id: new ObjectId(id), user_id: userId },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result) return res.status(404).json({ error: 'Not found' });
  return res.json({ task: toPublicTask(result as TaskDoc) });
});

tasksRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

  const userId = new ObjectId((req as AuthedRequest).auth.sub);
  const tasks = await getCollection<TaskDoc>('tasks');

  const result = await tasks.deleteOne({ _id: new ObjectId(id), user_id: userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
});

