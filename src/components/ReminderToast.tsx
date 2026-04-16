import { X, Bell, Zap } from 'lucide-react';
import { ReminderNotification } from '../lib/types';
import { useTaskContext } from '../context/TaskContext';

interface ReminderToastProps {
  notifications: ReminderNotification[];
}

export function ReminderToast({ notifications }: ReminderToastProps) {
  const { dismissNotification, state } = useTaskContext();
  const { darkMode } = state;

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 ${
            n.type === 'starting'
              ? darkMode
                ? 'bg-blue-900/90 border-blue-700 text-white'
                : 'bg-blue-500 border-blue-600 text-white'
              : darkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-100 text-gray-900'
          }`}
          style={{ animation: 'slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              n.type === 'starting'
                ? 'bg-white/20'
                : darkMode
                ? 'bg-blue-500/20'
                : 'bg-blue-50'
            }`}
          >
            {n.type === 'starting' ? (
              <Zap className={`w-4.5 h-4.5 ${n.type === 'starting' && !darkMode ? 'text-white' : 'text-blue-400'}`} />
            ) : (
              <Bell className={`w-4.5 h-4.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{n.title}</p>
            <p className={`text-xs mt-0.5 leading-relaxed ${
              n.type === 'starting' ? 'text-white/80' : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {n.message}
            </p>
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
              n.type === 'starting'
                ? 'hover:bg-white/20 text-white/80'
                : darkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
