import {
  LayoutDashboard,
  CalendarRange,
  Target,
  ListTodo,
  MoreHorizontal,
} from 'lucide-react';
import { ViewMode } from '../lib/types';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenMenu: () => void;
  darkMode: boolean;
}

const tabs: { id: ViewMode | 'menu'; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'week', label: 'Week', icon: CalendarRange },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'all', label: 'Tasks', icon: ListTodo },
  { id: 'menu', label: 'More', icon: MoreHorizontal },
];

export function MobileBottomNav({
  currentView,
  onViewChange,
  onOpenMenu,
  darkMode,
}: MobileBottomNavProps) {
  const isMoreActive = ['month', 'agenda', 'timeline', 'focus'].includes(currentView);

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md pb-[env(safe-area-inset-bottom)] ${
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      }`}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-14">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isMenu = id === 'menu';
          const active = isMenu ? isMoreActive : currentView === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => (isMenu ? onOpenMenu() : onViewChange(id as ViewMode))}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${
                active
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-500'
                    : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold truncate max-w-full">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
