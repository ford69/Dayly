import { useEffect, useRef } from 'react';
import { Bell, X, Zap, Sparkles } from 'lucide-react';
import { ReminderNotification } from '../lib/types';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: ReminderNotification[];
  smartReminder: string | null;
  darkMode: boolean;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onDismissSmartReminder: () => void;
  onTaskClick?: (taskId: string) => void;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  smartReminder,
  darkMode,
  onDismiss,
  onClearAll,
  onDismissSmartReminder,
  onTaskClick,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const totalCount = notifications.length + (smartReminder ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-full mt-2 w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border shadow-2xl overflow-hidden z-50 ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          darkMode ? 'border-gray-800' : 'border-gray-100'
        }`}
      >
        <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Notifications
          {totalCount > 0 && (
            <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              {totalCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {totalCount > 0 && (
            <button
              onClick={onClearAll}
              className={`text-xs font-medium px-2 py-1 rounded-lg ${
                darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[min(420px,60vh)] overflow-y-auto">
        {totalCount === 0 ? (
          <div className={`px-4 py-10 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Bell className={`w-8 h-8 mx-auto mb-2 opacity-40`} />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">Task reminders will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {smartReminder && (
              <li className={`flex items-start gap-3 px-4 py-3 ${darkMode ? 'bg-amber-950/20' : 'bg-amber-50/80'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                    Smart suggestion
                  </p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-300/80' : 'text-amber-800/80'}`}>
                    {smartReminder}
                  </p>
                </div>
                <button
                  onClick={onDismissSmartReminder}
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-amber-100 text-gray-400'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            )}

            {notifications.map((n) => (
              <li key={n.id}>
                <div className={`flex items-start gap-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'starting'
                        ? darkMode
                          ? 'bg-blue-500/20'
                          : 'bg-blue-100'
                        : darkMode
                          ? 'bg-gray-800'
                          : 'bg-gray-100'
                    }`}
                  >
                    {n.type === 'starting' ? (
                      <Zap className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    ) : (
                      <Bell className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => {
                      if (n.taskId && onTaskClick) onTaskClick(n.taskId);
                      onDismiss(n.id);
                      onClose();
                    }}
                  >
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {n.message}
                    </p>
                  </button>
                  <button
                    onClick={() => onDismiss(n.id)}
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                      darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
