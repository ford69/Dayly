import { LayoutDashboard, Clock, ListTodo, ChevronRight } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { ViewMode } from '../lib/types';
import { todayString } from '../lib/utils';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navItems: { id: ViewMode; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'all', label: 'All Tasks', icon: ListTodo },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { state } = useTaskContext();
  const { tasks, darkMode } = state;
  const today = todayString();

  const todayTasks = tasks.filter((t) => t.date === today);
  const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
  const totalToday = todayTasks.length;
  const progress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 w-64 border-r flex flex-col transition-colors duration-300 overflow-y-auto ${
        darkMode
          ? 'bg-gray-900 border-gray-800 text-white'
          : 'bg-white border-gray-100 text-gray-900'
      }`}
    >
      <div className="p-4 space-y-1 mt-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              currentView === id
                ? darkMode
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-50 text-blue-600'
                : darkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4.5 h-4.5 shrink-0" />
            <span>{label}</span>
            {currentView === id && (
              <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
            )}
          </button>
        ))}
      </div>

      <div className={`mx-4 my-2 p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Today's Progress
          </span>
          <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {progress}%
          </span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {completedToday} of {totalToday} tasks completed
        </p>
      </div>

      <div className={`mx-4 mt-2 grid grid-cols-2 gap-2`}>
        {[
          { label: 'Total', value: tasks.length, color: 'blue' },
          { label: 'Today', value: totalToday, color: 'teal' },
          { label: 'Done', value: tasks.filter((t) => t.status === 'completed').length, color: 'emerald' },
          { label: 'Pending', value: tasks.filter((t) => t.status === 'pending').length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`p-3 rounded-xl border text-center ${
              darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100'
            }`}
          >
            <p className={`text-xl font-bold text-${color}-500`}>{value}</p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
