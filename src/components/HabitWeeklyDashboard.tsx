import { Flame, TrendingUp } from 'lucide-react';
import { HabitWeeklyStats } from '../lib/types';

interface HabitWeeklyDashboardProps {
  stats: HabitWeeklyStats | null;
  darkMode: boolean;
}

export function HabitWeeklyDashboard({ stats, darkMode }: HabitWeeklyDashboardProps) {
  if (!stats) return null;

  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <h2 className={`text-sm font-bold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Weekly Habits
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {stats.completion_rate}%
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Completion rate</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {stats.completed}/{stats.scheduled}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Habits done</p>
        </div>
        <div>
          <p className={`text-2xl font-bold flex items-center gap-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            <Flame className="w-5 h-5" />
            {stats.average_current_streak}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Avg streak</p>
        </div>
        <div>
          <p className={`text-2xl font-bold flex items-center gap-1 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
            <TrendingUp className="w-5 h-5" />
            {stats.longest_streak}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Longest streak</p>
        </div>
      </div>

      <div className={`h-3 rounded-full overflow-hidden mb-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all"
          style={{ width: `${stats.completion_rate}%` }}
        />
      </div>

      {stats.missed.length > 0 && (
        <div className="mt-3">
          <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Missed this week ({stats.missed.length})
          </p>
          <ul className={`text-xs space-y-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {stats.missed.slice(0, 5).map((m, i) => (
              <li key={i}>
                {m.title} — {m.date}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
