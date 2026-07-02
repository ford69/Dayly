import { useMemo, useState } from 'react';
import { Plus, Trash2, Flame, X, Clock, Pencil, CalendarDays } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { Habit, HabitFormData, HabitTimeStatus } from '../lib/types';
import { DAY_LABELS, HABIT_COLORS, formatTime, timeToMinutes } from '../lib/utils';

const DEFAULT_FORM: HabitFormData = {
  title: '',
  description: '',
  color: 'blue',
  target_days: [0, 1, 2, 3, 4, 5, 6],
  start_time: '09:00',
  end_time: '09:30',
};

const STATUS_LABELS: Record<HabitTimeStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Now',
  completed: 'Done',
  missed: 'Missed',
  off_day: 'Rest day',
};

const STATUS_STYLES: Record<HabitTimeStatus, { light: string; dark: string }> = {
  upcoming: { light: 'bg-blue-50 text-blue-700', dark: 'bg-blue-950/40 text-blue-300' },
  active: { light: 'bg-emerald-50 text-emerald-700', dark: 'bg-emerald-950/40 text-emerald-300' },
  completed: { light: 'bg-gray-100 text-gray-600', dark: 'bg-gray-800 text-gray-400' },
  missed: { light: 'bg-red-50 text-red-700', dark: 'bg-red-950/40 text-red-300' },
  off_day: { light: 'bg-gray-50 text-gray-500', dark: 'bg-gray-800/60 text-gray-500' },
};

function HabitForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel,
  darkMode,
}: {
  form: HabitFormData;
  setForm: (f: HabitFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  darkMode: boolean;
}) {
  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;
  const labelClass = `text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`;

  const toggleDay = (day: number) => {
    const days = form.target_days.includes(day)
      ? form.target_days.filter((d) => d !== day)
      : [...form.target_days, day].sort();
    setForm({ ...form, target_days: days });
  };

  const timeInvalid = timeToMinutes(form.end_time) <= timeToMinutes(form.start_time);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        className={inputClass}
        placeholder="Habit name (e.g. Morning run)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <input
        className={inputClass}
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div>
        <p className={`${labelClass} mb-2`}>Time window</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start</label>
            <input
              type="time"
              className={inputClass}
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End</label>
            <input
              type="time"
              className={inputClass}
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>
        </div>
        {timeInvalid && (
          <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
        )}
      </div>

      <div>
        <p className={`${labelClass} mb-2`}>Color</p>
        <div className="flex gap-2">
          {Object.keys(HABIT_COLORS).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`w-8 h-8 rounded-full ${HABIT_COLORS[c]} ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={`${labelClass} mb-2`}>Repeat on</p>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${
                form.target_days.includes(i)
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
            darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={timeInvalid || form.target_days.length === 0}
          className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function HabitCard({
  habit,
  darkMode,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  darkMode: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle = STATUS_STYLES[habit.time_status];
  const canToggle = habit.scheduled_today && habit.time_status !== 'off_day';

  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => canToggle && onToggle()}
          disabled={!canToggle}
          title={canToggle ? 'Mark complete' : 'Not scheduled today'}
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white transition-opacity ${
            habit.completed_today
              ? HABIT_COLORS[habit.color] ?? 'bg-blue-500'
              : darkMode
                ? 'bg-gray-800 border border-gray-600'
                : 'bg-gray-100 border border-gray-200'
          } ${!canToggle ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {habit.completed_today ? '✓' : ''}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${darkMode ? statusStyle.dark : statusStyle.light}`}>
              {STATUS_LABELS[habit.time_status]}
            </span>
          </div>

          {habit.description && (
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{habit.description}</p>
          )}

          <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(habit.start_time)} – {formatTime(habit.end_time)}
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {habit.streak} day streak
              </span>
            </div>
            <div className="flex gap-0.5">
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className={`text-[10px] w-5 text-center rounded ${
                    habit.target_days.includes(i)
                      ? darkMode
                        ? 'bg-blue-900/50 text-blue-300 font-semibold'
                        : 'bg-blue-100 text-blue-700 font-semibold'
                      : darkMode
                        ? 'text-gray-600'
                        : 'text-gray-300'
                  }`}
                >
                  {label[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={onEdit}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function HabitsPanel() {
  const { state: habitState, createHabit, updateHabit, deleteHabit, toggleHabit } = useHabits();
  const { state: taskState } = useTaskContext();
  const { habits, loading } = habitState;
  const { darkMode } = taskState;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HabitFormData>(DEFAULT_FORM);

  const todayHabits = useMemo(() => habits.filter((h) => h.scheduled_today), [habits]);
  const otherHabits = useMemo(() => habits.filter((h) => !h.scheduled_today), [habits]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (habit: Habit) => {
    setForm({
      title: habit.title,
      description: habit.description,
      color: habit.color,
      target_days: habit.target_days,
      start_time: habit.start_time,
      end_time: habit.end_time,
    });
    setEditingId(habit.id);
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createHabit(form);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.title.trim()) return;
    await updateHabit(editingId, form);
    resetForm();
  };

  const panelClass = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Habits</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Scheduled routines with time windows — separate from one-time tasks
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />Add Habit
        </button>
      </div>

      {showForm && (
        <div className={panelClass}>
          <div className="flex justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Habit</h3>
            <button onClick={resetForm} className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <HabitForm
            form={form}
            setForm={setForm}
            onSubmit={handleCreate}
            onCancel={resetForm}
            submitLabel="Create Habit"
            darkMode={darkMode}
          />
        </div>
      )}

      {editingId && (
        <div className={panelClass}>
          <div className="flex justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Habit</h3>
            <button onClick={resetForm} className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <HabitForm
            form={form}
            setForm={setForm}
            onSubmit={handleUpdate}
            onCancel={resetForm}
            submitLabel="Save Changes"
            darkMode={darkMode}
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
            No habits yet. Build routines with start/end times that stick.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {todayHabits.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Today&apos;s schedule ({todayHabits.length})
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {todayHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    darkMode={darkMode}
                    onToggle={() => toggleHabit(habit.id)}
                    onEdit={() => startEdit(habit)}
                    onDelete={() => deleteHabit(habit.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherHabits.length > 0 && (
            <section>
              <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Other days ({otherHabits.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    darkMode={darkMode}
                    onToggle={() => toggleHabit(habit.id)}
                    onEdit={() => startEdit(habit)}
                    onDelete={() => deleteHabit(habit.id)}
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
