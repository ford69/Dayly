/*
  Habit scheduling: time windows for daily routines
*/

ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_time text NOT NULL DEFAULT '09:00'
  CHECK (start_time ~ '^\d{2}:\d{2}$');
ALTER TABLE habits ADD COLUMN IF NOT EXISTS end_time text NOT NULL DEFAULT '09:30'
  CHECK (end_time ~ '^\d{2}:\d{2}$');

CREATE INDEX IF NOT EXISTS habits_user_start_idx ON habits (user_id, start_time);
