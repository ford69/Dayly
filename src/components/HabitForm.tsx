import { useState } from 'react';
import { Habit, HabitFormData } from '../lib/types';
import {
  HABIT_CATEGORIES,
  HABIT_FREQUENCIES,
  HABIT_GOAL_TYPES,
  DEFAULT_UNITS,
} from '../lib/habitConstants';
import { DAY_LABELS, HABIT_COLORS, todayString } from '../lib/utils';

const DEFAULT: HabitFormData = {
  title: '',
  description: '',
  icon: 'circle',
  color: 'blue',
  category: 'wellness',
  frequency: 'daily',
  frequency_config: {},
  goal_type: 'checkbox',
  target: 1,
  unit: '',
  rest_days: [],
  start_time: '09:00',
  end_time: '09:30',
};

interface HabitFormProps {
  initial?: Partial<HabitFormData>;
  darkMode: boolean;
  submitLabel: string;
  onSubmit: (data: HabitFormData) => void;
  onCancel: () => void;
}

export function habitToForm(habit: Habit): HabitFormData {
  return {
    title: habit.title,
    description: habit.description,
    icon: habit.icon,
    color: habit.color,
    category: habit.category,
    frequency: habit.frequency,
    frequency_config: habit.frequency_config,
    goal_type: habit.goal_type,
    target: habit.target,
    unit: habit.unit,
    start_date: habit.start_date,
    end_date: habit.end_date,
    reminder_time: habit.reminder_time,
    rest_days: habit.rest_days,
    start_time: habit.start_time,
    end_time: habit.end_time,
  };
}

export function HabitForm({ initial, darkMode, submitLabel, onSubmit, onCancel }: HabitFormProps) {
  const [form, setForm] = useState<HabitFormData>({ ...DEFAULT, ...initial });

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;
  const labelClass = `text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`;

  const handleGoalType = (gt: string) => {
    setForm({
      ...form,
      goal_type: gt as HabitFormData['goal_type'],
      target: gt === 'checkbox' ? 1 : form.target === 1 ? 8 : form.target,
      unit: DEFAULT_UNITS[gt] ?? form.unit,
    });
  };

  const toggleRestDay = (day: number) => {
    const days = form.rest_days.includes(day)
      ? form.rest_days.filter((d) => d !== day)
      : [...form.rest_days, day].sort();
    setForm({ ...form, rest_days: days });
  };

  const toggleCustomDay = (day: number) => {
    const days = (form.frequency_config.days as number[] | undefined) ?? [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    setForm({ ...form, frequency: 'custom', frequency_config: { ...form.frequency_config, days: next } });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, start_date: form.start_date ?? todayString() });
      }}
      className="space-y-4"
    >
      <input
        className={inputClass}
        placeholder="Habit name"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <input
        className={inputClass}
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div>
        <p className={`${labelClass} mb-2`}>Category</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setForm({ ...form, category: c.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                form.category === c.id
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`${labelClass} mb-2`}>Goal type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HABIT_GOAL_TYPES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGoalType(g.id)}
              className={`px-3 py-2 rounded-xl text-left text-xs border ${
                form.goal_type === g.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : darkMode
                    ? 'border-gray-700 text-gray-400'
                    : 'border-gray-200 text-gray-500'
              }`}
            >
              <span className="font-semibold block">{g.label}</span>
              <span className="opacity-70">{g.example}</span>
            </button>
          ))}
        </div>
      </div>

      {form.goal_type !== 'checkbox' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Target</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.target}
              onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit</label>
            <input
              className={inputClass}
              placeholder="glasses, minutes, km…"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
        </div>
      )}

      <div>
        <p className={`${labelClass} mb-2`}>Frequency</p>
        <select
          className={inputClass}
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value as HabitFormData['frequency'] })}
        >
          {HABIT_FREQUENCIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {(form.frequency === 'weekly' || form.frequency === 'monthly') && (
        <div>
          <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {form.frequency === 'weekly' ? 'Day of week' : 'Day of month'}
          </label>
          {form.frequency === 'weekly' ? (
            <select
              className={inputClass}
              value={(form.frequency_config.day as number) ?? 1}
              onChange={(e) =>
                setForm({ ...form, frequency_config: { ...form.frequency_config, day: Number(e.target.value) } })
              }
            >
              {DAY_LABELS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={1}
              max={31}
              className={inputClass}
              value={(form.frequency_config.day as number) ?? 1}
              onChange={(e) =>
                setForm({ ...form, frequency_config: { ...form.frequency_config, day: Number(e.target.value) } })
              }
            />
          )}
        </div>
      )}

      {(form.frequency === 'every_n_days' || form.frequency === 'every_n_weeks') && (
        <div>
          <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Every N</label>
          <input
            type="number"
            min={2}
            className={inputClass}
            value={(form.frequency_config.interval as number) ?? 2}
            onChange={(e) =>
              setForm({ ...form, frequency_config: { ...form.frequency_config, interval: Number(e.target.value) } })
            }
          />
        </div>
      )}

      {form.frequency === 'custom' && (
        <div className="flex gap-1">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleCustomDay(i)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${
                ((form.frequency_config.days as number[]) ?? []).includes(i)
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
      )}

      <div>
        <p className={`${labelClass} mb-2`}>Rest days (won&apos;t break streak)</p>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleRestDay(i)}
              className={`flex-1 py-1.5 text-xs rounded-lg ${
                form.rest_days.includes(i)
                  ? 'bg-purple-500 text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {label[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reminder start</label>
          <input type="time" className={inputClass} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reminder end</label>
          <input type="time" className={inputClass} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>
      </div>

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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
            darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'
          }`}
        >
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
