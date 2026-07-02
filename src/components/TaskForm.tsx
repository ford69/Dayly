import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, AlignLeft, Type, AlertCircle, Repeat, Link2 } from 'lucide-react';
import { Task, TaskFormData, Priority, Status, RecurrenceRule } from '../lib/types';
import { useTaskContext } from '../context/TaskContext';
import { todayString, timeToMinutes, RECURRENCE_LABELS } from '../lib/utils';

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
  recurrence_rule: 'none',
  recurrence_end: null,
  depends_on: [],
};

const recurrenceOptions: RecurrenceRule[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

export function TaskForm({ onClose, editTask }: TaskFormProps) {
  const { state, createTask, updateTask } = useTaskContext();
  const { darkMode, tasks } = state;
  const [form, setForm] = useState<TaskFormData>(
    editTask
      ? {
          title: editTask.title,
          description: editTask.description,
          date: editTask.date,
          start_time: editTask.start_time,
          end_time: editTask.end_time,
          priority: editTask.priority,
          status: editTask.status,
          recurrence_rule: editTask.recurrence_rule,
          recurrence_end: editTask.recurrence_end,
          depends_on: editTask.depends_on,
        }
      : defaultForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  const otherTasks = tasks.filter((t) => t.id !== editTask?.id && t.status === 'pending');

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

  const toggleDependency = (taskId: string) => {
    const deps = form.depends_on ?? [];
    setForm({
      ...form,
      depends_on: deps.includes(taskId) ? deps.filter((id) => id !== taskId) : [...deps, taskId],
    });
  };

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white'
  }`;

  const labelClass = `flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    darkMode ? 'text-gray-400' : 'text-gray-500'
  }`;

  const priorities: Priority[] = ['low', 'medium', 'high'];
  const statuses: Status[] = ['pending', 'completed'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}
      >
        <div className={`flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {editTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className={labelClass}><Type className="w-3.5 h-3.5" />Title</label>
            <input type="text" placeholder="What needs to be done?" className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          </div>

          <div>
            <label className={labelClass}><AlignLeft className="w-3.5 h-3.5" />Description</label>
            <textarea rows={2} placeholder="Add more details (optional)" className={`${inputClass} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}><Calendar className="w-3.5 h-3.5" />Date</label>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><Clock className="w-3.5 h-3.5" />Start</label>
              <input type="time" className={inputClass} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}><Clock className="w-3.5 h-3.5" />End</label>
              <input type="time" className={inputClass} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            </div>
          </div>

          {timeError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />{timeError}
            </div>
          )}

          <div>
            <label className={labelClass}><Repeat className="w-3.5 h-3.5" />Repeat</label>
            <select className={inputClass} value={form.recurrence_rule} onChange={(e) => setForm({ ...form, recurrence_rule: e.target.value as RecurrenceRule })} disabled={!!editTask?.recurrence_parent_id}>
              {recurrenceOptions.map((r) => (
                <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {form.recurrence_rule !== 'none' && !editTask?.recurrence_parent_id && (
            <div>
              <label className={labelClass}>Repeat until (optional)</label>
              <input type="date" className={inputClass} value={form.recurrence_end ?? ''} onChange={(e) => setForm({ ...form, recurrence_end: e.target.value || null })} />
            </div>
          )}

          <div>
            <label className={labelClass}><Flag className="w-3.5 h-3.5" />Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-all ${form.priority === p ? (p === 'high' ? 'bg-red-500 border-red-500 text-white' : p === 'medium' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-emerald-500 border-emerald-500 text-white') : darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {otherTasks.length > 0 && (
            <div>
              <label className={labelClass}><Link2 className="w-3.5 h-3.5" />Depends on</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {otherTasks.slice(0, 10).map((t) => (
                  <label key={t.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={(form.depends_on ?? []).includes(t.id)} onChange={() => toggleDependency(t.id)} className="rounded" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {editTask && (
            <div>
              <label className={labelClass}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`py-2 rounded-xl text-sm font-semibold capitalize border ${form.status === s ? (s === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-blue-500 border-blue-500 text-white') : darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className={`flex gap-3 px-4 sm:px-6 py-4 sm:py-5 border-t shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.title.trim() || !!timeError} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50">
            {submitting ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
