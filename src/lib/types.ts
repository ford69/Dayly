export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  priority: Priority;
  status: Status;
  created_at: string;
  updated_at: string;
}

export type TaskFormData = Omit<Task, 'id' | 'created_at' | 'updated_at'>;

export interface ReminderNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: 'upcoming' | 'starting';
}

export type ViewMode = 'dashboard' | 'timeline' | 'all';
