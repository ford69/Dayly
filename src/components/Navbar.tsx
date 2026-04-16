import { Moon, Sun, Bell, Plus, LogOut } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, todayString } from '../lib/utils';

interface NavbarProps {
  onAddTask: () => void;
  notificationCount: number;
}

export function Navbar({ onAddTask, notificationCount }: NavbarProps) {
  const { state, toggleDarkMode } = useTaskContext();
  const { darkMode } = state;
  const { logout } = useAuth();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4 md:px-6 border-b backdrop-blur-md transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900/90 border-gray-800 text-white'
          : 'bg-white/90 border-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center mr-auto">
        <img
          src="/dayly.png"
          alt="Dayly"
          className="w-16 h-16 object-contain"
        />
      </div>

      <div className={`hidden md:block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {formatDate(todayString())}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        <div className="relative">
          <button
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
            darkMode ? 'hover:bg-gray-800 text-amber-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <button
          onClick={() => void logout()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
            darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Log out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
