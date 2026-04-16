import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { Task, TaskFormData, ReminderNotification } from '../lib/types';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  notifications: ReminderNotification[];
  darkMode: boolean;
}

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: ReminderNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_DARK_MODE' };

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    default:
      return state;
  }
}

interface TaskContextValue {
  state: TaskState;
  fetchTasks: (date?: string) => Promise<void>;
  createTask: (data: TaskFormData) => Promise<void>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleStatus: (task: Task) => Promise<void>;
  addNotification: (notification: ReminderNotification) => void;
  dismissNotification: (id: string) => void;
  toggleDarkMode: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: false,
    error: null,
    notifications: [],
    darkMode: localStorage.getItem('day_planner_dark_mode') === 'true',
  });

  const fetchTasks = useCallback(async (date?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      const data = await apiFetch<{ tasks: Task[] }>(`/api/tasks${qs}`);
      dispatch({ type: 'SET_TASKS', payload: data.tasks ?? [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createTask = useCallback(async (data: TaskFormData) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const created = await apiFetch<{ task: Task }>('/api/tasks', {
        method: 'POST',
        json: data,
      });
      dispatch({ type: 'ADD_TASK', payload: created.task });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<TaskFormData>) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const updated = await apiFetch<{ task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        json: data,
      });
      dispatch({ type: 'UPDATE_TASK', payload: updated.task });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await apiFetch<{ ok: true }>(`/api/tasks/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  }, []);

  const toggleStatus = useCallback(async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { status: newStatus });
  }, [updateTask]);

  const addNotification = useCallback((notification: ReminderNotification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
    const current = localStorage.getItem('day_planner_dark_mode') === 'true';
    localStorage.setItem('day_planner_dark_mode', String(!current));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        state,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleStatus,
        addNotification,
        dismissNotification,
        toggleDarkMode,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used inside TaskProvider');
  return ctx;
}
