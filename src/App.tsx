import { useState, useCallback, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TaskForm } from './components/TaskForm';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { ReminderToast } from './components/ReminderToast';
import { useReminders } from './hooks/useReminders';
import { Task, ViewMode, ReminderNotification } from './lib/types';
import { todayString } from './lib/utils';

function AppContent() {
  const { state, addNotification, fetchTasks } = useTaskContext();
  const { tasks, notifications, darkMode } = state;

  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayString());

  const handleNotify = useCallback(
    (notification: ReminderNotification) => {
      addNotification(notification);
    },
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
    fetchTasks();
  }, [fetchTasks]);

  const mobileNavItems: { id: ViewMode; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'all', label: 'All Tasks' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar onAddTask={handleOpenAdd} notificationCount={notifications.length} />

      <div className="hidden md:flex">
        <Sidebar currentView={view} onViewChange={setView} />
        <main className="ml-64 mt-16 flex-1 p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-3xl mx-auto">
            <Dashboard
              onEdit={handleEdit}
              view={view}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </main>
      </div>

      <div className="md:hidden mt-16">
        <div className={`flex border-b sticky top-16 z-30 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          {mobileNavItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 ${
                view === id
                  ? darkMode
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-500'
                  : darkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <main className="p-4">
          <Dashboard
            onEdit={handleEdit}
            view={view}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </main>
      </div>

      {showForm && <TaskForm onClose={handleClose} editTask={editTask} />}
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
      <AppContent />
    </TaskProvider>
  );
}
