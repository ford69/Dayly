import { useEffect, useState } from 'react';
import { ListTodo, Plus, Target, X } from 'lucide-react';

interface QuickAddFabProps {
  darkMode: boolean;
  onAddTask: () => void;
  onAddHabit: () => void;
}

export function QuickAddFab({ darkMode, onAddTask, onAddHabit }: QuickAddFabProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="fixed z-40 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 sm:right-6 flex flex-col items-end gap-2">
      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} aria-hidden />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddHabit();
            }}
            className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-lg border text-sm font-semibold ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <Target className="w-4 h-4 text-teal-500" />
            Habit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddTask();
            }}
            className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-lg border text-sm font-semibold ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <ListTodo className="w-4 h-4 text-blue-500" />
            Task
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close quick add' : 'Quick add'}
        className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
