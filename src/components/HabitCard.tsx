import { Flame, Snowflake, Trophy } from 'lucide-react';
import { Habit } from '../lib/types';
import { HABIT_CATEGORIES, HABIT_MILESTONES } from '../lib/habitConstants';
import { HABIT_COLORS } from '../lib/utils';

interface HabitCardProps {
  habit: Habit;
  darkMode: boolean;
  onLog: (value: number) => void;
  onToggle?: () => void;
  onFreeze?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function HabitCard({
  habit,
  darkMode,
  onLog,
  onToggle,
  onFreeze,
  onEdit,
  onDelete,
  compact,
}: HabitCardProps) {
  const cat = HABIT_CATEGORIES.find((c) => c.id === habit.category);
  const nextMilestone = HABIT_MILESTONES.find((m) => m > habit.current_streak);

  const progressLabel =
    habit.goal_type === 'checkbox'
      ? habit.goal_met_today
        ? 'Done'
        : 'Not yet'
      : `${habit.today_value} / ${habit.target} ${habit.unit}`.trim();

  return (
    <div
      className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
    >
      <div className="flex items-start gap-3">
        {habit.goal_type === 'checkbox' ? (
          <button
            onClick={onToggle}
            disabled={!habit.scheduled_today}
            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg ${
              habit.goal_met_today
                ? `${HABIT_COLORS[habit.color] ?? 'bg-blue-500'} text-white`
                : darkMode
                  ? 'bg-gray-800 border border-gray-600'
                  : 'bg-gray-100 border border-gray-200'
            } ${!habit.scheduled_today ? 'opacity-40' : ''}`}
          >
            {habit.goal_met_today ? '✓' : ''}
          </button>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold ${
              darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {Math.round(habit.today_progress)}%
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{cat?.emoji ?? '✨'}</span>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.title}</h3>
          </div>

          {!compact && habit.description && (
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{habit.description}</p>
          )}

          <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {progressLabel}
          </p>

          {habit.goal_type !== 'checkbox' && habit.scheduled_today && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min={0}
                max={habit.target}
                step={habit.goal_type === 'timer' ? 5 : 1}
                value={habit.today_value}
                onChange={(e) => onLog(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <button
                onClick={() => onLog(Math.min(habit.target, habit.today_value + 1))}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                +1
              </button>
            </div>
          )}

          {!compact && (
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
              <span className={`flex items-center gap-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                <Flame className="w-3.5 h-3.5" />
                {habit.current_streak} day streak
              </span>
              <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Best: {habit.best_streak}</span>
              {nextMilestone && (
                <span className={`flex items-center gap-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  <Trophy className="w-3.5 h-3.5" />
                  {nextMilestone}d next
                </span>
              )}
            </div>
          )}

          {habit.suggested_reminder && !compact && (
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              💡 You usually complete this around {habit.suggested_reminder}. Reminder at 7:45?
            </p>
          )}
        </div>

        {!compact && (
          <div className="flex flex-col gap-1">
            {onFreeze && habit.scheduled_today && !habit.goal_met_today && (
              <button
                onClick={onFreeze}
                title="Streak freeze"
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-blue-50 text-gray-400'}`}
              >
                <Snowflake className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className={`p-2 rounded-lg text-xs ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className={`p-2 rounded-lg text-xs ${darkMode ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-red-50 text-gray-400'}`}
              >
                Del
              </button>
            )}
          </div>
        )}
      </div>

      {habit.goal_type !== 'checkbox' && (
        <div className={`h-1.5 rounded-full mt-3 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all"
            style={{ width: `${habit.today_progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
