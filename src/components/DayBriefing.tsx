import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { apiFetch } from '../lib/api';
import { TodaySummary } from '../lib/types';
import { formatTime, todayString } from '../lib/utils';

type Mode = 'morning' | 'evening';

function key(userId: string, mode: Mode, date: string) {
  return `dayly_briefing_${mode}_${userId}_${date}`;
}

export function DayBriefing() {
  const { user } = useAuth();
  const { state: habitState } = useHabits();
  const { state } = useTaskContext();
  const { darkMode, tasks } = state;
  const { habits } = habitState;

  const [mode, setMode] = useState<Mode | null>(null);
  const [summary, setSummary] = useState<TodaySummary | null>(null);

  const hour = new Date().getHours();
  const date = todayString();

  useEffect(() => {
    if (!user) return;
    const next: Mode | null = hour < 11 ? 'morning' : hour >= 18 ? 'evening' : null;
    if (!next) return;
    if (localStorage.getItem(key(user.id, next, date))) return;
    setMode(next);
  }, [user, hour, date]);

  useEffect(() => {
    if (!mode) return;
    void apiFetch<{ summary: TodaySummary }>(`/api/today/summary?date=${date}`)
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null));
  }, [mode, date]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === date), [tasks, date]);
  const pending = todayTasks.filter((t) => t.status === 'pending');
  const done = todayTasks.filter((t) => t.status === 'completed');
  const todayHabits = habits.filter((h) => h.scheduled_today);
  const habitsDone = todayHabits.filter((h) => h.goal_met_today).length;

  if (!mode || !user) return null;

  const dismiss = () => {
    localStorage.setItem(key(user.id, mode, date), '1');
    setMode(null);
  };

  const isMorning = mode === 'morning';

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={dismiss} />
      <div
        className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl p-6 ${
          darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        <button
          onClick={dismiss}
          className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${
            darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          {isMorning ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isMorning ? 'Morning briefing' : 'End-of-day review'}
          </p>
        </div>

        <h2 className="text-xl font-bold mb-1">
          {isMorning ? 'Here’s your day' : 'How did today go?'}
        </h2>
        <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isMorning
            ? `${pending.length} tasks · ${todayHabits.length} habits scheduled`
            : `${done.length}/${todayTasks.length} tasks done · ${habitsDone}/${todayHabits.length} habits`}
        </p>

        {summary && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Stat label="Streak" value={`${summary.streak}d`} darkMode={darkMode} />
            <Stat label="Score" value={`${summary.productivity_score}%`} darkMode={darkMode} />
          </div>
        )}

        <div className="space-y-2 max-h-48 overflow-y-auto mb-5">
          {isMorning
            ? pending.slice(0, 5).map((t) => (
                <Row key={t.id} title={t.title} meta={formatTime(t.start_time)} darkMode={darkMode} />
              ))
            : [
                ...done.slice(0, 3).map((t) => (
                  <Row key={t.id} title={t.title} meta="Done" darkMode={darkMode} />
                )),
                ...(summary?.missed ?? []).slice(0, 3).map((t) => (
                  <Row key={t.id} title={t.title} meta="Missed" darkMode={darkMode} />
                )),
              ]}
          {isMorning && pending.length === 0 && (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No tasks yet — add one to start.</p>
          )}
        </div>

        <button onClick={dismiss} className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold">
          {isMorning ? 'Start my day' : 'Close review'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, darkMode }: { label: string; value: string; darkMode: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
      <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Row({ title, meta, darkMode }: { title: string; meta: string; darkMode: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      <span className="truncate font-medium">{title}</span>
      <span className={`shrink-0 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{meta}</span>
    </div>
  );
}
