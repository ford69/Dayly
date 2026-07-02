import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { HabitCard } from './HabitCard';
import { Flame } from 'lucide-react';

export function HabitCheckIn() {
  const { user } = useAuth();
  const { state, logHabit, toggleHabit } = useHabits();
  const { state: taskState } = useTaskContext();
  const { habits } = state;
  const { darkMode } = taskState;

  const todayHabits = habits.filter((h) => h.scheduled_today);
  const completed = todayHabits.filter((h) => h.goal_met_today).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.current_streak), 0);

  if (todayHabits.length === 0) return null;

  const firstName = user?.email?.split('@')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className={`rounded-2xl border p-5 ${
        darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'
      }`}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Daily check-in
          </p>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {greeting}, {firstName} 👋
          </h2>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white/80'}`}>
          <Flame className="w-4 h-4 text-orange-500" />
          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {maxStreak} day streak
          </span>
        </div>
      </div>

      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Today&apos;s habits — {completed}/{todayHabits.length} complete
      </p>

      <div className="space-y-2">
        {todayHabits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            darkMode={darkMode}
            compact
            onLog={(v) => void logHabit(habit.id, v)}
            onToggle={() => void toggleHabit(habit)}
          />
        ))}
      </div>
    </div>
  );
}
