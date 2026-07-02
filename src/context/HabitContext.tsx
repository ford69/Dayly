import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import {
  Habit,
  HabitFormData,
  HabitHeatmapCell,
  HabitInsights,
  HabitTemplateGroup,
  HabitWeeklyStats,
} from '../lib/types';

interface HabitState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  weekly: HabitWeeklyStats | null;
}

type HabitAction =
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WEEKLY'; payload: HabitWeeklyStats | null };

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.payload.id ? action.payload : h)),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_WEEKLY':
      return { ...state, weekly: action.payload };
    default:
      return state;
  }
}

interface HabitContextValue {
  state: HabitState;
  fetchHabits: (date?: string) => Promise<void>;
  fetchWeekly: (weekStart?: string) => Promise<void>;
  createHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: string, data: Partial<HabitFormData>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (id: string, value: number, date?: string) => Promise<void>;
  toggleHabit: (habit: Habit) => Promise<void>;
  freezeStreak: (id: string, date?: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
  fetchTemplates: () => Promise<HabitTemplateGroup[]>;
  fetchHeatmap: (id: string, from?: string, to?: string) => Promise<HabitHeatmapCell[]>;
  fetchInsights: (id: string) => Promise<HabitInsights>;
  linkTask: (habitId: string, taskId: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, {
    habits: [],
    loading: false,
    error: null,
    weekly: null,
  });

  const fetchHabits = useCallback(async (date?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      const data = await apiFetch<{ habits: Habit[] }>(`/api/habits${qs}`);
      dispatch({ type: 'SET_HABITS', payload: data.habits ?? [] });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load habits' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchWeekly = useCallback(async (weekStart?: string) => {
    const qs = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : '';
    const data = await apiFetch<{ stats: HabitWeeklyStats }>(`/api/habits/weekly${qs}`);
    dispatch({ type: 'SET_WEEKLY', payload: data.stats });
  }, []);

  const createHabit = useCallback(
    async (data: HabitFormData) => {
      await apiFetch('/api/habits', { method: 'POST', json: data });
      await fetchHabits();
      await fetchWeekly();
    },
    [fetchHabits, fetchWeekly]
  );

  const updateHabit = useCallback(
    async (id: string, data: Partial<HabitFormData>) => {
      const updated = await apiFetch<{ habit: Habit }>(`/api/habits/${id}`, {
        method: 'PUT',
        json: data,
      });
      dispatch({ type: 'UPDATE_HABIT', payload: updated.habit });
    },
    []
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      await apiFetch(`/api/habits/${id}`, { method: 'DELETE' });
      await fetchHabits();
      await fetchWeekly();
    },
    [fetchHabits, fetchWeekly]
  );

  const logHabit = useCallback(
    async (id: string, value: number, date?: string) => {
      const result = await apiFetch<{ habit: Habit }>(`/api/habits/${id}/log`, {
        method: 'POST',
        json: { value, date },
      });
      dispatch({ type: 'UPDATE_HABIT', payload: result.habit });
    },
    []
  );

  const toggleHabit = useCallback(
    async (habit: Habit) => {
      if (habit.goal_type === 'checkbox') {
        await logHabit(habit.id, habit.goal_met_today ? 0 : 1);
      }
    },
    [logHabit]
  );

  const freezeStreak = useCallback(
    async (id: string, date?: string) => {
      await apiFetch(`/api/habits/${id}/freeze`, { method: 'POST', json: { date } });
      await fetchHabits();
    },
    [fetchHabits]
  );

  const applyTemplate = useCallback(
    async (templateId: string) => {
      await apiFetch('/api/habits/from-template', { method: 'POST', json: { template_id: templateId } });
      await fetchHabits();
      await fetchWeekly();
    },
    [fetchHabits, fetchWeekly]
  );

  const fetchTemplates = useCallback(async () => {
    const data = await apiFetch<{ templates: HabitTemplateGroup[] }>('/api/habits/templates');
    return data.templates ?? [];
  }, []);

  const fetchHeatmap = useCallback(async (id: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch<{ cells: HabitHeatmapCell[] }>(`/api/habits/${id}/heatmap${qs}`);
    return data.cells ?? [];
  }, []);

  const fetchInsights = useCallback(async (id: string) => {
    const data = await apiFetch<{ insights: HabitInsights; suggested_reminder: string | null }>(
      `/api/habits/${id}/insights`
    );
    return { ...data.insights, suggested_reminder: data.suggested_reminder };
  }, []);

  const linkTask = useCallback(async (habitId: string, taskId: string) => {
    await apiFetch(`/api/habits/${habitId}/link-task`, { method: 'POST', json: { task_id: taskId } });
  }, []);

  useEffect(() => {
    void fetchHabits();
    void fetchWeekly();
  }, [fetchHabits, fetchWeekly]);

  return (
    <HabitContext.Provider
      value={{
        state,
        fetchHabits,
        fetchWeekly,
        createHabit,
        updateHabit,
        deleteHabit,
        logHabit,
        toggleHabit,
        freezeStreak,
        applyTemplate,
        fetchTemplates,
        fetchHeatmap,
        fetchInsights,
        linkTask,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitProvider');
  return ctx;
}
