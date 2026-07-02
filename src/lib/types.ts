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
export type HabitTimeStatus = 'off_day' | 'upcoming' | 'active' | 'completed' | 'missed';

export interface Habit {
  id: string;
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
  today_value: number;
  today_progress: number;
  goal_met_today: boolean;
  scheduled_today: boolean;
  time_status: HabitTimeStatus;
  current_streak: number;
  best_streak: number;
  milestones: number[];
  suggested_reminder: string | null;
  created_at: string;
  updated_at: string;
}

export type HabitFormData = {
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
  start_date?: string;
  end_date?: string | null;
  status?: HabitStatus;
  reminder_time?: string | null;
  rest_days: number[];
  start_time: string;
  end_time: string;
  target_days?: number[];
};

export interface HabitWeeklyStats {
  completion_rate: number;
  completed: number;
  scheduled: number;
  longest_streak: number;
  average_current_streak: number;
  missed: { habit_id: string; title: string; date: string }[];
}

export interface HabitHeatmapCell {
  date: string;
  value: number;
  level: number;
  scheduled: boolean;
}

export interface HabitTemplateGroup {
  id: string;
  name: string;
  icon: string;
  habits: Partial<HabitFormData>[];
}

export interface HabitInsights {
  completion_rate: number;
  scheduled_days: number;
  completed_days: number;
  best_hour: number | null;
  missed_weekday: string | null;
  suggested_reminder: string | null;
}

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
