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

export type HabitGoalType = 'checkbox' | 'numeric' | 'timer' | 'distance' | 'count';
export type HabitFrequency =
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'every_n_days'
  | 'every_n_weeks'
  | 'monthly'
  | 'custom';
export type HabitCategory =
  | 'fitness'
  | 'learning'
  | 'work'
  | 'wellness'
  | 'finance'
  | 'relationships'
  | 'other';
export type HabitStatus = 'active' | 'paused' | 'archived';

export type HabitRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  frequency_config: Record<string, unknown>;
  goal_type: HabitGoalType;
  target: number;
  unit: string;
  start_date: string;
  end_date: string | null;
  status: HabitStatus;
  reminder_time: string | null;
  rest_days: number[];
  start_time: string;
  end_time: string;
  target_days: number[];
  created_at: string;
  updated_at: string;
};

export type HabitLogRow = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  value: number;
  completed: boolean;
  completed_at: string | null;
  note: string;
  created_at: string;
};

export type TaskDependencyRow = {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
};
