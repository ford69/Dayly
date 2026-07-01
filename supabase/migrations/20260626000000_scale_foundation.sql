/*
  Scale foundation: multi-tenant prep, notification queue, stats, indexes
*/

-- Workspaces (future team support; each user gets a personal workspace)
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Personal',
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces (slug);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces (id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces (id) ON DELETE SET NULL;

-- Server-side notification queue (processed by cron, not client)
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces (id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email')),
  kind text NOT NULL CHECK (kind IN ('task_reminder_10m', 'task_reminder_5m', 'task_starting', 'daily_summary', 'missed_tasks')),
  scheduled_for timestamptz NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_queue_pending_idx ON notification_queue (status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS notification_queue_user_idx ON notification_queue (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_queue_task_kind_unique ON notification_queue (task_id, kind)
  WHERE task_id IS NOT NULL AND status = 'pending';

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Daily stats for streaks and productivity score
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces (id) ON DELETE SET NULL,
  date date NOT NULL,
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_total integer NOT NULL DEFAULT 0,
  habits_completed integer NOT NULL DEFAULT 0,
  focus_minutes integer NOT NULL DEFAULT 0,
  productivity_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_stats_user_date_idx ON daily_stats (user_id, date DESC);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Composite index for today's tasks cache lookups
CREATE INDEX IF NOT EXISTS tasks_user_date_status_idx ON tasks (user_id, date, status);
