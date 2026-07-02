export type HabitTemplateItem = {
  title: string;
  description?: string;
  icon: string;
  category: string;
  goal_type: string;
  target: number;
  unit: string;
  frequency: string;
  frequency_config?: Record<string, unknown>;
};

export type HabitTemplateGroup = {
  id: string;
  name: string;
  icon: string;
  habits: HabitTemplateItem[];
};

export const HABIT_TEMPLATES: HabitTemplateGroup[] = [
  {
    id: 'morning',
    name: 'Morning Routine',
    icon: 'sunrise',
    habits: [
      { title: 'Make bed', icon: 'bed', category: 'wellness', goal_type: 'checkbox', target: 1, unit: '', frequency: 'daily' },
      { title: 'Drink water', icon: 'droplets', category: 'wellness', goal_type: 'numeric', target: 1, unit: 'glass', frequency: 'daily' },
      { title: 'Stretch', icon: 'activity', category: 'fitness', goal_type: 'timer', target: 10, unit: 'minutes', frequency: 'daily' },
      { title: 'Journal', icon: 'book-open', category: 'wellness', goal_type: 'timer', target: 5, unit: 'minutes', frequency: 'daily' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: 'dumbbell',
    habits: [
      { title: 'Walk 10,000 steps', icon: 'footprints', category: 'fitness', goal_type: 'count', target: 10000, unit: 'steps', frequency: 'daily' },
      { title: 'Workout', icon: 'dumbbell', category: 'fitness', goal_type: 'checkbox', target: 1, unit: '', frequency: 'daily' },
      { title: 'Protein intake', icon: 'beef', category: 'fitness', goal_type: 'numeric', target: 120, unit: 'grams', frequency: 'daily' },
    ],
  },
  {
    id: 'coding',
    name: 'Coding',
    icon: 'code',
    habits: [
      { title: 'Code 1 hour', icon: 'code', category: 'learning', goal_type: 'timer', target: 60, unit: 'minutes', frequency: 'daily' },
      { title: 'Read documentation', icon: 'file-text', category: 'learning', goal_type: 'timer', target: 20, unit: 'minutes', frequency: 'weekdays' },
      { title: 'Solve one problem', icon: 'puzzle', category: 'learning', goal_type: 'checkbox', target: 1, unit: '', frequency: 'daily' },
    ],
  },
  {
    id: 'student',
    name: 'Student',
    icon: 'graduation-cap',
    habits: [
      { title: 'Review notes', icon: 'notebook', category: 'learning', goal_type: 'timer', target: 30, unit: 'minutes', frequency: 'daily' },
      { title: 'Practice questions', icon: 'help-circle', category: 'learning', goal_type: 'count', target: 10, unit: 'questions', frequency: 'daily' },
      { title: 'Read chapter', icon: 'book', category: 'learning', goal_type: 'checkbox', target: 1, unit: '', frequency: 'daily' },
    ],
  },
];

export const HABIT_MILESTONES = [7, 30, 100, 365];
