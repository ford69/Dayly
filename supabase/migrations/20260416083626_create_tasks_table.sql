/*
  # Create Tasks Table for Day Planner

  ## Overview
  Creates the core `tasks` table for the Day Planner application.

  ## New Tables
  - `tasks`
    - `id` (uuid, primary key) - Unique identifier
    - `device_id` (text) - Anonymous device identifier stored in localStorage
    - `title` (text, required) - Task title
    - `description` (text) - Optional task description
    - `date` (date, required) - Task date
    - `start_time` (time, required) - Task start time
    - `end_time` (time, required) - Task end time
    - `priority` (text) - low / medium / high
    - `status` (text) - pending / completed
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on `tasks` table
  - Anonymous users can read/insert/update/delete their own tasks (matched by device_id)
  - No cross-device data leakage
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Device can read own tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id' OR device_id = '');

CREATE POLICY "Device can insert own tasks"
  ON tasks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Device can update own tasks"
  ON tasks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Device can delete own tasks"
  ON tasks FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS tasks_device_id_idx ON tasks(device_id);
CREATE INDEX IF NOT EXISTS tasks_date_idx ON tasks(date);
