export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence_rule: RecurrenceRule;
  recurrence_parent_id: string | null;
  recurrence_end: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  target_days: number[];
  created_at: string;
  updated_at: string;
};

export type HabitLogRow = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at: string;
};

export type TaskDependencyRow = {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
};
