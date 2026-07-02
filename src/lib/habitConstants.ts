export const HABIT_CATEGORIES = [
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const;

export const HABIT_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Every week (pick day)' },
  { id: 'every_n_days', label: 'Every N days' },
  { id: 'every_n_weeks', label: 'Every N weeks' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom days' },
] as const;

export const HABIT_GOAL_TYPES = [
  { id: 'checkbox', label: 'Checkbox', example: 'Meditate' },
  { id: 'numeric', label: 'Numeric', example: '8 glasses' },
  { id: 'timer', label: 'Timer', example: '30 minutes' },
  { id: 'distance', label: 'Distance', example: '5 km' },
  { id: 'count', label: 'Count', example: '50 reps' },
] as const;

export const HABIT_MILESTONES = [7, 30, 100, 365];

export const DEFAULT_UNITS: Record<string, string> = {
  checkbox: '',
  numeric: '',
  timer: 'minutes',
  distance: 'km',
  count: 'reps',
};
