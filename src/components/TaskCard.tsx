import { Clock, Pencil, Trash2, CheckCircle2, Circle, AlertTriangle, Zap } from 'lucide-react';
import { Task } from '../lib/types';
import { formatTime, priorityBadge, priorityBadgeDark, isTaskActive } from '../lib/utils';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  hasOverlap?: boolean;
  compact?: boolean;
}

export function TaskCard({ task, onEdit, hasOverlap = false, compact = false }: TaskCardProps) {
  const { state, deleteTask, toggleStatus } = useTaskContext();
  const { darkMode } = state;
  const active = isTaskActive(task);
  const completed = task.status === 'completed';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this task?')) deleteTask(task.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus(task);
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer
        ${compact ? 'p-3' : 'p-4'}
        ${active && !completed
          ? darkMode
            ? 'border-blue-500/50 bg-blue-900/20 shadow-lg shadow-blue-500/10'
            : 'border-blue-300 bg-blue-50 shadow-lg shadow-blue-500/10'
          : darkMode
          ? 'border-gray-700/80 bg-gray-800/60 hover:border-gray-600 hover:bg-gray-800'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
        }
        ${completed ? 'opacity-60' : ''}
      `}
    >
      {active && !completed && (
        <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full shadow-md shadow-blue-500/30">
          <Zap className="w-2.5 h-2.5" />
          Active
        </span>
      )}

      {hasOverlap && (
        <span className="absolute -top-2 left-3 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
          <AlertTriangle className="w-2.5 h-2.5" />
          Overlap
        </span>
      )}

      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className={`mt-0.5 shrink-0 transition-all duration-200 hover:scale-110 ${
            completed ? 'text-emerald-500' : darkMode ? 'text-gray-600 hover:text-blue-400' : 'text-gray-300 hover:text-blue-500'
          }`}
        >
          {completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-sm leading-tight truncate ${
                completed
                  ? 'line-through ' + (darkMode ? 'text-gray-500' : 'text-gray-400')
                  : darkMode
                  ? 'text-white'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium capitalize ${darkMode ? priorityBadgeDark(task.priority) : priorityBadge(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {task.description && !compact && (
            <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {task.description}
            </p>
          )}

          <div className={`flex items-center gap-1.5 mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{formatTime(task.start_time)} – {formatTime(task.end_time)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
