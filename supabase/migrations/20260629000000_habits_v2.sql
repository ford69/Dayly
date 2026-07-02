/*
  Habits 2.0 — goal types, flexible frequency, rich logs, categories, task links
*/

-- Extend habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'circle';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'wellness'
  CHECK (category IN ('fitness', 'learning', 'work', 'wellness', 'finance', 'relationships', 'other'));
ALTER TABLE habits ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily'
  CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'weekly', 'every_n_days', 'every_n_weeks', 'monthly', 'custom'));
ALTER TABLE habits ADD COLUMN IF NOT EXISTS frequency_config jsonb NOT NULL DEFAULT '{}';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_type text NOT NULL DEFAULT 'checkbox'
  CHECK (goal_type IN ('checkbox', 'numeric', 'timer', 'distance', 'count'));
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target numeric NOT NULL DEFAULT 1;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT '';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'archived'));
ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_time text CHECK (reminder_time IS NULL OR reminder_time ~ '^\d{2}:\d{2}$');
ALTER TABLE habits ADD COLUMN IF NOT EXISTS rest_days integer[] NOT NULL DEFAULT '{}';

UPDATE habits SET goal_type = 'checkbox', target = 1 WHERE goal_type IS NULL OR target IS NULL;

-- Rich habit logs (value-based, not binary habit completion)
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS value numeric NOT NULL DEFAULT 1;
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';

UPDATE habit_logs SET value = 1, completed_at = created_at WHERE completed = true AND completed_at IS NULL;

-- Habit ↔ task linking
CREATE TABLE IF NOT EXISTS habit_task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  auto_complete boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, task_id)
);

CREATE INDEX IF NOT EXISTS habit_task_links_task_idx ON habit_task_links (task_id);
CREATE INDEX IF NOT EXISTS habit_task_links_habit_idx ON habit_task_links (habit_id);

ALTER TABLE habit_task_links ENABLE ROW LEVEL SECURITY;

-- Streak freeze (skip a day without breaking streak)
CREATE TABLE IF NOT EXISTS habit_streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS habit_streak_freezes_habit_idx ON habit_streak_freezes (habit_id, date);

ALTER TABLE habit_streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS habits_category_idx ON habits (user_id, category);
CREATE INDEX IF NOT EXISTS habits_status_idx ON habits (user_id, status);
