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

/** Fill Habits 2.0 fields when the live DB is still on the original schema. */
export function normalizeHabitRow(raw: Record<string, unknown>): HabitRow {
  const createdAt = typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString();
  const startDate =
    typeof raw.start_date === 'string' && raw.start_date
      ? raw.start_date
      : createdAt.slice(0, 10);

  return {
    id: String(raw.id ?? ''),
    user_id: String(raw.user_id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    icon: typeof raw.icon === 'string' && raw.icon ? raw.icon : 'circle',
    color: typeof raw.color === 'string' && raw.color ? raw.color : 'blue',
    category: (typeof raw.category === 'string' ? raw.category : 'wellness') as HabitCategory,
    frequency: (typeof raw.frequency === 'string' ? raw.frequency : 'daily') as HabitFrequency,
    frequency_config:
      raw.frequency_config && typeof raw.frequency_config === 'object'
        ? (raw.frequency_config as Record<string, unknown>)
        : {},
    goal_type: (typeof raw.goal_type === 'string' ? raw.goal_type : 'checkbox') as HabitGoalType,
    target: Number(raw.target ?? 1) || 1,
    unit: typeof raw.unit === 'string' ? raw.unit : '',
    start_date: startDate,
    end_date: typeof raw.end_date === 'string' ? raw.end_date : null,
    status: (typeof raw.status === 'string' ? raw.status : 'active') as HabitStatus,
    reminder_time: typeof raw.reminder_time === 'string' ? raw.reminder_time : null,
    rest_days: Array.isArray(raw.rest_days) ? (raw.rest_days as number[]) : [],
    start_time: typeof raw.start_time === 'string' ? raw.start_time : '09:00',
    end_time: typeof raw.end_time === 'string' ? raw.end_time : '09:30',
    target_days: Array.isArray(raw.target_days) ? (raw.target_days as number[]) : [0, 1, 2, 3, 4, 5, 6],
    created_at: createdAt,
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : createdAt,
  };
}

export function normalizeHabitLogRow(raw: Record<string, unknown>): HabitLogRow {
  const completed = raw.completed === true;
  const value = raw.value == null ? (completed ? 1 : 0) : Number(raw.value);
  return {
    id: String(raw.id ?? ''),
    habit_id: String(raw.habit_id ?? ''),
    user_id: String(raw.user_id ?? ''),
    date: String(raw.date ?? ''),
    value,
    completed,
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
    note: typeof raw.note === 'string' ? raw.note : '',
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
  };
}

export function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    error.code === '42703' ||
    error.code === '42P01' ||
    /does not exist|schema cache|Could not find the table/i.test(error.message ?? '')
  );
}

export type TaskDependencyRow = {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
};
