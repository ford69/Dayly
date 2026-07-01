export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'completed';
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  priority: Priority;
  status: Status;
  recurrence_rule: RecurrenceRule;
  recurrence_parent_id: string | null;
  recurrence_end: string | null;
  created_at: string;
  updated_at: string;
  depends_on: string[];
  blocked: boolean;
}

export type TaskFormData = Omit<
  Task,
  'id' | 'created_at' | 'updated_at' | 'recurrence_parent_id' | 'depends_on' | 'blocked'
> & {
  depends_on?: string[];
};

export interface Habit {
  id: string;
  title: string;
  description: string;
  color: string;
  target_days: number[];
  completed_today: boolean;
  streak: number;
  created_at: string;
  updated_at: string;
}

export type HabitFormData = Pick<Habit, 'title' | 'description' | 'color' | 'target_days'>;

export interface PlanSuggestion {
  task_id: string;
  title: string;
  priority: Priority;
  suggested_date: string;
  suggested_start_time: string;
  suggested_end_time: string;
  reason: string;
}

export interface TodaySummary {
  date: string;
  do_today: { id: string; title: string; start_time: string; priority: Priority }[];
  urgent: { id: string; title: string; start_time: string }[];
  missed: { id: string; title: string; date: string; start_time: string }[];
  streak: number;
  productivity_score: number;
  tasks_completed: number;
  tasks_total: number;
}

export interface ReminderNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: 'upcoming' | 'starting' | 'smart';
}

export type ViewMode =
  | 'dashboard'
  | 'timeline'
  | 'week'
  | 'month'
  | 'agenda'
  | 'all'
  | 'habits'
  | 'focus';

export type CalendarView = 'week' | 'month' | 'agenda';
