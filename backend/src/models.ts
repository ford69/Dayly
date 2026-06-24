export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};
