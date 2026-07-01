/*
  Feature expansion: recurrence, habits, dependencies, focus sessions
*/

-- Recurring tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule text NOT NULL DEFAULT 'none'
  CHECK (recurrence_rule IN ('none', 'daily', 'weekly', 'weekdays', 'monthly'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES tasks (id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end date;

CREATE INDEX IF NOT EXISTS tasks_recurrence_parent_idx ON tasks (recurrence_parent_id);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS task_dependencies_task_idx ON task_dependencies (task_id);
CREATE INDEX IF NOT EXISTS task_dependencies_depends_idx ON task_dependencies (depends_on_task_id);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'blue',
  target_days integer[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date date NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS habits_user_idx ON habits (user_id);
CREATE INDEX IF NOT EXISTS habit_logs_habit_date_idx ON habit_logs (habit_id, date);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Focus session log
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks (id) ON DELETE SET NULL,
  duration_seconds integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_sessions_user_idx ON focus_sessions (user_id);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
