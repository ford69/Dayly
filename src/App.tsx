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
import { LegalPage } from './pages/LegalPage';
import { SplashLoader } from './components/SplashLoader';
import { ReminderToast } from './components/ReminderToast';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DayBriefing } from './components/DayBriefing';
import { QuickAddFab } from './components/QuickAddFab';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';
import { useReminders } from './hooks/useReminders';
import { Task, TaskFormData, ViewMode, ReminderNotification } from './lib/types';
import { todayString } from './lib/utils';

function legalPath(): 'privacy' | 'terms' | null {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return null;
}

function readLaunchIntent(): {
  action?: string;
  draft?: Partial<TaskFormData>;
} {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const action = params.get('action') ?? undefined;

  if (path === '/share' || params.has('title') || params.has('text') || params.has('url')) {
    const title = params.get('title')?.trim() || 'Shared item';
    const text = params.get('text')?.trim() || '';
    const url = params.get('url')?.trim() || '';
    const description = [text, url].filter(Boolean).join('\n\n');
    return {
      action: 'add-task',
      draft: {
        title: title.slice(0, 120),
        description: description.slice(0, 2000),
        date: todayString(),
        priority: 'medium',
        status: 'pending',
      },
    };
  }

  return { action };
}

function clearLaunchParams() {
  const url = new URL(window.location.href);
  if (url.pathname === '/share') url.pathname = '/';
  ['action', 'title', 'text', 'url', 'source', 'replan'].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState({}, '', url.pathname + url.search);
}

function AppContent() {
  const { state, addNotification, clearPlan } = useTaskContext();
  const { tasks, notifications, darkMode } = state;

  const [showForm, setShowForm] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskDraft, setTaskDraft] = useState<Partial<TaskFormData> | undefined>();
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openHabitForm, setOpenHabitForm] = useState(false);

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

  const handleOpenAdd = (draft?: Partial<TaskFormData>) => {
    setEditTask(null);
    setTaskDraft(draft);
    setShowForm(true);
  };
  const handleEdit = (task: Task) => {
    setEditTask(task);
    setTaskDraft(undefined);
    setShowForm(true);
  };
  const handleClose = () => {
    setShowForm(false);
    setEditTask(null);
    setTaskDraft(undefined);
  };
  const handleOpenHabit = () => {
    setOpenHabitForm(true);
    setView('habits');
  };

  const handleNotificationTaskClick = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) handleEdit(task);
    },
    [tasks]
  );

  useEffect(() => {
    const intent = readLaunchIntent();
    if (!intent.action && !intent.draft) return;

    if (intent.action === 'add-task' || intent.draft) {
      handleOpenAdd(intent.draft);
    } else if (intent.action === 'today') {
      goToDashboard();
      if (new URLSearchParams(window.location.search).get('replan') === '1') clearPlan();
    } else if (intent.action === 'focus') {
      setShowFocus(true);
    } else if (intent.action === 'habits') {
      handleOpenHabit();
    }

    clearLaunchParams();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'DAYLY_NOTIFICATION_CLICK' || !event.data.url) return;
      const url = new URL(event.data.url, window.location.origin);
      window.history.replaceState({}, '', url.pathname + url.search);
      const intent = readLaunchIntent();
      if (intent.action === 'focus') setShowFocus(true);
      else if (intent.action === 'habits') handleOpenHabit();
      else goToDashboard();
      clearLaunchParams();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [goToDashboard]);

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
        onAddTask={() => handleOpenAdd()}
        onNavigateHome={goToDashboard}
        onNotificationTaskClick={handleNotificationTaskClick}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <OfflineBanner />

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
              openHabitForm={openHabitForm}
              onHabitFormOpened={() => setOpenHabitForm(false)}
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

      <QuickAddFab darkMode={darkMode} onAddTask={() => handleOpenAdd()} onAddHabit={handleOpenHabit} />
      <InstallPrompt />

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

      {showForm && <TaskForm onClose={handleClose} editTask={editTask} initialDraft={taskDraft} />}
      {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
      <OnboardingFlow />
      <DayBriefing />
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
  const legal = legalPath();

  if (legal) return <LegalPage kind={legal} />;

  if (loading) return <SplashLoader />;

  if (!user) return <AuthPage />;

  return (
    <TaskProvider>
      <HabitProvider>
        <AppContent />
      </HabitProvider>
    </TaskProvider>
  );
}
