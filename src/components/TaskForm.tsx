import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, AlignLeft, Type, AlertCircle } from 'lucide-react';
import { Task, TaskFormData, Priority, Status } from '../lib/types';
import { useTaskContext } from '../context/TaskContext';
import { todayString, timeToMinutes } from '../lib/utils';

interface TaskFormProps {
  onClose: () => void;
  editTask?: Task | null;
}

const defaultForm: TaskFormData = {
  title: '',
  description: '',
  date: todayString(),
  start_time: '09:00',
  end_time: '10:00',
  priority: 'medium',
  status: 'pending',
};

export function TaskForm({ onClose, editTask }: TaskFormProps) {
  const { state, createTask, updateTask } = useTaskContext();
  const { darkMode } = state;
  const [form, setForm] = useState<TaskFormData>(editTask ? {
    title: editTask.title,
    description: editTask.description,
    date: editTask.date,
    start_time: editTask.start_time,
    end_time: editTask.end_time,
    priority: editTask.priority,
    status: editTask.status,
  } : defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (timeToMinutes(form.end_time) <= timeToMinutes(form.start_time)) {
      setTimeError('End time must be after start time');
    } else {
      setTimeError('');
    }
  }, [form.start_time, form.end_time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || timeError) return;
    setSubmitting(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, form);
      } else {
        await createTask(form);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:shadow-sm'
  }`;

  const labelClass = `flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    darkMode ? 'text-gray-400' : 'text-gray-500'
  }`;

  const priorities: Priority[] = ['low', 'medium', 'high'];
  const statuses: Status[] = ['pending', 'completed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}
        style={{ animation: 'modalEnter 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {editTask ? 'Update task details below' : 'Fill in the details to add a new task'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelClass}>
              <Type className="w-3.5 h-3.5" />
              Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>
              <AlignLeft className="w-3.5 h-3.5" />
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Add more details (optional)"
              className={`${inputClass} resize-none`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <Clock className="w-3.5 h-3.5" />
                Start Time
              </label>
              <input
                type="time"
                className={inputClass}
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                <Clock className="w-3.5 h-3.5" />
                End Time
              </label>
              <input
                type="time"
                className={inputClass}
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          {timeError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {timeError}
            </div>
          )}

          <div>
            <label className={labelClass}>
              <Flag className="w-3.5 h-3.5" />
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-all duration-200 ${
                    form.priority === p
                      ? p === 'high'
                        ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30'
                        : p === 'medium'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {editTask && (
            <div>
              <label className={labelClass}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-all duration-200 ${
                      form.status === s
                        ? s === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30'
                        : darkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className={`flex items-center gap-3 px-6 py-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
              darkMode
                ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !!timeError}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {submitting ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
