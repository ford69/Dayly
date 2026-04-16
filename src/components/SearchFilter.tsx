import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Priority, Status } from '../lib/types';

interface SearchFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityChange: (v: Priority | 'all') => void;
  statusFilter: Status | 'all';
  onStatusChange: (v: Status | 'all') => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
}: SearchFilterProps) {
  const { state } = useTaskContext();
  const { darkMode } = state;

  const chipBase = `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer`;
  const chipActive = (color: string) => `bg-${color}-500 border-${color}-500 text-white shadow-sm`;
  const chipInactive = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
        />
        {search && (
          <button onClick={() => onSearchChange('')} className={`${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Priority:
        </div>
        {(['all', 'high', 'medium', 'low'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onPriorityChange(p)}
            className={`${chipBase} ${
              priorityFilter === p
                ? p === 'all' ? `bg-blue-500 border-blue-500 text-white shadow-sm` : chipActive(p === 'high' ? 'red' : p === 'medium' ? 'amber' : 'emerald')
                : chipInactive
            }`}
          >
            {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Status:
        </div>
        {(['all', 'pending', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`${chipBase} ${
              statusFilter === s
                ? s === 'all' ? `bg-blue-500 border-blue-500 text-white shadow-sm` : chipActive(s === 'completed' ? 'emerald' : 'blue')
                : chipInactive
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
