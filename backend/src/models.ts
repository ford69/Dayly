import { ObjectId } from 'mongodb';

export type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export type TaskDoc = {
  _id: ObjectId;
  user_id: ObjectId;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

