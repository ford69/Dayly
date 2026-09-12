import { useEffect, useState } from 'react';
import { Brain, Clock3, Flame, TrendingUp } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { apiFetch } from '../lib/api';
import { HabitInsights, TodaySummary } from '../lib/types';
import { todayString } from '../lib/utils';

export function ProductivityInsights() {
  const { state } = useTaskContext();
  const { state: habitState, fetchInsights } = useHabits();
  const { darkMode } = state;
  const { habits } = habitState;

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [habitInsight, setHabitInsight] = useState<(HabitInsights & { title: string }) | null>(null);

  useEffect(() => {
    void apiFetch<{ summary: TodaySummary }>(`/api/today/summary?date=${todayString()}`)
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    const top = [...habits].sort((a, b) => b.current_streak - a.current_streak)[0];
    if (!top) {
      setHabitInsight(null);
      return;
    }
    void fetchInsights(top.id)
      .then((insights) => setHabitInsight({ ...insights, title: top.title }))
      .catch(() => setHabitInsight(null));
  }, [habits, fetchInsights]);

  const card = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Productivity insights
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Metric
          icon={TrendingUp}
          label="Today score"
          value={summary ? `${summary.productivity_score}%` : '—'}
          darkMode={darkMode}
        />
        <Metric
          icon={Flame}
          label="Streak"
          value={summary ? `${summary.streak}d` : '—'}
          darkMode={darkMode}
        />
        <Metric
          icon={Clock3}
          label="Tasks done"
          value={summary ? `${summary.tasks_completed}/${summary.tasks_total}` : '—'}
          darkMode={darkMode}
        />
        <Metric
          icon={Brain}
          label="Habit rate"
          value={habitInsight ? `${Math.round(habitInsight.completion_rate)}%` : '—'}
          darkMode={darkMode}
        />
      </div>

      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {habitInsight
          ? `Top habit “${habitInsight.title}”: ${habitInsight.completed_days}/${habitInsight.scheduled_days} days logged${
              habitInsight.best_hour != null ? ` · best around ${habitInsight.best_hour}:00` : ''
            }. Focus sessions boost your productivity score.`
          : 'Complete focus sessions and habits to unlock personalized insights.'}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  darkMode,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  darkMode: boolean;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
      <Icon className={`w-3.5 h-3.5 mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </p>
    </div>
  );
}
