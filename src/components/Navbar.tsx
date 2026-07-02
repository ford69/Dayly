import { Moon, Sun, Bell, Plus, LogOut, Menu } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, todayString } from '../lib/utils';

interface NavbarProps {
  onAddTask: () => void;
  onNavigateHome: () => void;
  notificationCount: number;
  onMenuClick?: () => void;
}

export function Navbar({ onAddTask, onNavigateHome, notificationCount, onMenuClick }: NavbarProps) {
  const { state, toggleDarkMode } = useTaskContext();
  const { darkMode } = state;
  const { logout } = useAuth();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 flex items-center px-3 sm:px-6 border-b backdrop-blur-md transition-colors duration-300 pt-[env(safe-area-inset-top)] ${
        darkMode
          ? 'bg-gray-900/90 border-gray-800 text-white'
          : 'bg-white/90 border-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center min-w-0 mr-2 sm:mr-auto gap-1 sm:gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className={`md:hidden w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onNavigateHome}
          className="shrink-0 rounded-lg hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Go to dashboard"
        >
          <img
            src="/dayly.png"
            alt="Dayly"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain"
          />
        </button>
        <span
          className={`md:hidden text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Dayly
        </span>
      </div>

      <div className={`hidden lg:block text-sm font-medium shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {formatDate(todayString())}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-500/30"
          aria-label="Add task"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        <div className="relative hidden sm:block">
          <button
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
            darkMode ? 'hover:bg-gray-800 text-amber-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <button
          onClick={() => void logout()}
          className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center transition-colors duration-200 ${
            darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
