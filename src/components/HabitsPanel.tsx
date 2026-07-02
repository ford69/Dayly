import { useState } from 'react';
import { Plus, X, LayoutTemplate } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { Habit } from '../lib/types';
import { HabitCard } from './HabitCard';
import { HabitForm, habitToForm } from './HabitForm';
import { HabitHeatmapLoader } from './HabitHeatmap';
import { HabitWeeklyDashboard } from './HabitWeeklyDashboard';
import { HabitTemplatesModal } from './HabitTemplatesModal';

export function HabitsPanel() {
  const {
    state,
    createHabit,
    updateHabit,
    deleteHabit,
    logHabit,
    toggleHabit,
    freezeStreak,
    applyTemplate,
    fetchTemplates,
    fetchHeatmap,
  } = useHabits();
  const { state: taskState } = useTaskContext();
  const { habits, loading, weekly } = state;
  const { darkMode } = taskState;

  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [expandedHeatmap, setExpandedHeatmap] = useState<string | null>(null);

  const todayHabits = habits.filter((h) => h.scheduled_today);
  const otherHabits = habits.filter((h) => !h.scheduled_today);
  const panelClass = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`;

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Habits 2.0</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Goal-based routines with streaks, heatmaps & insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
              darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>
      </div>

      <HabitWeeklyDashboard stats={weekly} darkMode={darkMode} />

      {showTemplates && (
        <HabitTemplatesModal
          darkMode={darkMode}
          fetchTemplates={fetchTemplates}
          onApply={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {(showForm || editing) && (
        <div className={panelClass}>
          <div className="flex justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editing ? 'Edit Habit' : 'New Habit'}
            </h3>
            <button onClick={closeForm} className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <HabitForm
            darkMode={darkMode}
            initial={editing ? habitToForm(editing) : undefined}
            submitLabel={editing ? 'Save' : 'Create'}
            onCancel={closeForm}
            onSubmit={async (data) => {
              if (editing) await updateHabit(editing.id, data);
              else await createHabit(data);
              closeForm();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No habits yet. Start from a template or create your own.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {todayHabits.length > 0 && (
            <section>
              <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Today ({todayHabits.length})
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {todayHabits.map((habit) => (
                  <div key={habit.id} className="space-y-2">
                    <HabitCard
                      habit={habit}
                      darkMode={darkMode}
                      onLog={(v) => void logHabit(habit.id, v)}
                      onToggle={() => void toggleHabit(habit)}
                      onFreeze={() => void freezeStreak(habit.id)}
                      onEdit={() => {
                        setEditing(habit);
                        setShowForm(false);
                      }}
                      onDelete={() => void deleteHabit(habit.id)}
                    />
                    <button
                      onClick={() => setExpandedHeatmap(expandedHeatmap === habit.id ? null : habit.id)}
                      className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      {expandedHeatmap === habit.id ? 'Hide heatmap' : 'Show heatmap'}
                    </button>
                    {expandedHeatmap === habit.id && (
                      <div className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <HabitHeatmapLoader habitId={habit.id} darkMode={darkMode} fetchHeatmap={fetchHeatmap} />
                      </div>
                    )}
                    {habit.milestones.length > 0 && (
                      <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        🏆 Milestones: {habit.milestones.join(', ')} days
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {otherHabits.length > 0 && (
            <section>
              <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Other days ({otherHabits.length})
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {otherHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    darkMode={darkMode}
                    onLog={(v) => void logHabit(habit.id, v)}
                    onToggle={() => void toggleHabit(habit)}
                    onEdit={() => setEditing(habit)}
                    onDelete={() => void deleteHabit(habit.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
