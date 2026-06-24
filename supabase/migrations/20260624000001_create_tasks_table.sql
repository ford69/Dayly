/*
  # Create tasks table (user-scoped)

  Replaces the legacy device_id-based tasks schema.
  Tasks are owned by a user and cascade-deleted when the user is removed.
*/

DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date date NOT NULL,
  start_time text NOT NULL CHECK (start_time ~ '^\d{2}:\d{2}$'),
  end_time text NOT NULL CHECK (end_time ~ '^\d{2}:\d{2}$'),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_date_start_idx ON tasks (user_id, date, start_time);
CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON tasks (user_id, status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
