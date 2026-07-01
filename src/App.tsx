import { useState, useCallback, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { HabitProvider } from './context/HabitContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
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

  const handleNotify = useCallback(
    (notification: ReminderNotification) => addNotification(notification),
    [addNotification]
  );

  useReminders({ tasks, onNotify: handleNotify });

  const handleOpenAdd = () => { setEditTask(null); setShowForm(true); };
  const handleEdit = (task: Task) => { setEditTask(task); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditTask(null); };

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

  const dashboard = (
    <Dashboard
      onEdit={handleEdit}
      view={view}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      onFocus={() => setShowFocus(true)}
    />
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar
        onAddTask={handleOpenAdd}
        notificationCount={notifications.length}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <div className="hidden md:flex">
        <Sidebar currentView={view} onViewChange={handleViewChange} />
        <main className="ml-64 mt-16 flex-1 p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-4xl mx-auto">{dashboard}</div>
        </main>
      </div>

      <div className="md:hidden mt-16">
        <main className="p-4">{dashboard}</main>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-16 bottom-0 w-64 max-w-[85vw] shadow-2xl">
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
