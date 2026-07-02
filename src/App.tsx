import { useState, useCallback, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { HabitProvider } from './context/HabitContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TaskForm } from './components/TaskForm';
import { FocusMode } from './components/FocusMode';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { ReminderToast } from './components/ReminderToast';
import { useReminders } from './hooks/useReminders';
import { Task, ViewMode, ReminderNotification } from './lib/types';
import { todayString } from './lib/utils';

function AppContent() {
  const { state, addNotification } = useTaskContext();
  const { tasks, notifications, darkMode } = state;

  const [showForm, setShowForm] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleViewChange = useCallback((next: ViewMode) => {
    setView(next);
    setMobileNavOpen(false);
  }, []);

  const goToDashboard = useCallback(() => {
    setView('dashboard');
    setSelectedDate(todayString());
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNotify = useCallback(
    (notification: ReminderNotification) => addNotification(notification),
    [addNotification]
  );

  useReminders({ tasks, onNotify: handleNotify });

  const handleOpenAdd = () => { setEditTask(null); setShowForm(true); };
  const handleEdit = (task: Task) => { setEditTask(task); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditTask(null); };

  const handleNotificationTaskClick = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) handleEdit(task);
    },
    [tasks]
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar
        onAddTask={handleOpenAdd}
        onNavigateHome={goToDashboard}
        onNotificationTaskClick={handleNotificationTaskClick}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <div className="flex pt-14 sm:pt-16 min-h-screen">
        <div className="hidden md:block">
          <Sidebar currentView={view} onViewChange={handleViewChange} />
        </div>

        <main className="flex-1 w-full min-w-0 md:ml-64 px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto w-full">
            <Dashboard
              onEdit={handleEdit}
              view={view}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onFocus={() => setShowFocus(true)}
            />
          </div>
        </main>
      </div>

      <MobileBottomNav
        currentView={view}
        onViewChange={handleViewChange}
        onOpenMenu={() => setMobileNavOpen(true)}
        darkMode={darkMode}
      />

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-14 sm:top-16 bottom-0 w-[min(280px,88vw)] shadow-2xl animate-[slideInDrawer_0.2s_ease-out]">
            <Sidebar currentView={view} onViewChange={handleViewChange} isDrawer />
          </div>
        </div>
      )}

      {showForm && <TaskForm onClose={handleClose} editTask={editTask} />}
      {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
      <ReminderToast notifications={notifications} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b10] text-white flex items-center justify-center">
        <div className="text-sm text-white/70">Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <TaskProvider>
      <HabitProvider>
        <AppContent />
      </HabitProvider>
    </TaskProvider>
  );
}
