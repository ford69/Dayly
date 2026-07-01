import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { Habit, HabitFormData } from '../lib/types';

interface HabitState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
}

type HabitAction =
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.payload.id ? action.payload : h)),
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface HabitContextValue {
  state: HabitState;
  fetchHabits: (date?: string) => Promise<void>;
  createHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: string, data: Partial<HabitFormData>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabit: (id: string, date?: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, {
    habits: [],
    loading: false,
    error: null,
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

  const createHabit = useCallback(async (data: HabitFormData) => {
    const created = await apiFetch<{ habit: Habit }>('/api/habits', { method: 'POST', json: data });
    dispatch({ type: 'ADD_HABIT', payload: created.habit });
  }, []);

  const updateHabit = useCallback(async (id: string, data: Partial<HabitFormData>) => {
    const updated = await apiFetch<{ habit: Habit }>(`/api/habits/${id}`, {
      method: 'PUT',
      json: data,
    });
    dispatch({ type: 'UPDATE_HABIT', payload: updated.habit });
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    await apiFetch(`/api/habits/${id}`, { method: 'DELETE' });
    dispatch({ type: 'DELETE_HABIT', payload: id });
  }, []);

  const toggleHabit = useCallback(async (id: string, date?: string) => {
    await apiFetch(`/api/habits/${id}/toggle`, { method: 'POST', json: { date } });
    await fetchHabits(date);
  }, [fetchHabits]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  return (
    <HabitContext.Provider
      value={{ state, fetchHabits, createHabit, updateHabit, deleteHabit, toggleHabit }}
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
