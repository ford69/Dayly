import { useState } from 'react';
import { Plus, Trash2, Flame, X } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { HabitFormData } from '../lib/types';
import { DAY_LABELS, HABIT_COLORS } from '../lib/utils';

export function HabitsPanel() {
  const { state: habitState, createHabit, deleteHabit, toggleHabit } = useHabits();
  const { state: taskState } = useTaskContext();
  const { habits, loading } = habitState;
  const { darkMode } = taskState;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<HabitFormData>({
    title: '',
    description: '',
    color: 'blue',
    target_days: [0, 1, 2, 3, 4, 5, 6],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createHabit(form);
    setForm({ title: '', description: '', color: 'blue', target_days: [0, 1, 2, 3, 4, 5, 6] });
    setShowForm(false);
  };

  const toggleDay = (day: number) => {
    const days = form.target_days.includes(day)
      ? form.target_days.filter((d) => d !== day)
      : [...form.target_days, day].sort();
    setForm({ ...form, target_days: days });
  };

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Habits</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Long-term routines, separate from one-time tasks</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600">
          <Plus className="w-4 h-4" />Add Habit
        </button>
      </div>

      {showForm && (
        <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Habit</h3>
            <button onClick={() => setShowForm(false)} className={darkMode ? 'text-gray-400' : 'text-gray-500'}><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input className={inputClass} placeholder="Habit name (e.g. Gym)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className={inputClass} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              {Object.keys(HABIT_COLORS).map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full ${HABIT_COLORS[c]} ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} />
              ))}
            </div>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${form.target_days.includes(i) ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm">Create Habit</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className={`h-20 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}</div>
      ) : habits.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No habits yet. Build routines that stick.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {habits.map((habit) => (
            <div key={habit.id} className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white ${habit.completed_today ? HABIT_COLORS[habit.color] ?? 'bg-blue-500' : darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-200'}`}
                >
                  {habit.completed_today ? '✓' : ''}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.title}</h3>
                  {habit.description && <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{habit.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{habit.streak} day streak</span>
                  </div>
                </div>
                <button onClick={() => deleteHabit(habit.id)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
