/*
  Extend notification queue for habit reminders
*/

ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS habit_id uuid REFERENCES habits (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notification_queue_habit_idx ON notification_queue (habit_id);

ALTER TABLE notification_queue DROP CONSTRAINT IF EXISTS notification_queue_kind_check;
ALTER TABLE notification_queue ADD CONSTRAINT notification_queue_kind_check CHECK (
  kind IN (
    'task_reminder_10m',
    'task_reminder_5m',
    'task_starting',
    'habit_reminder_10m',
    'habit_reminder_5m',
    'habit_starting',
    'daily_summary',
    'missed_tasks'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_queue_habit_day_kind_unique
  ON notification_queue (habit_id, kind, ((payload ->> 'habit_date')))
  WHERE habit_id IS NOT NULL AND status = 'pending';
