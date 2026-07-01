import { useState, useMemo, useEffect } from 'react';
import { Zap, Clock, CheckCircle2, TrendingUp, CalendarDays, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { TaskCard } from '../components/TaskCard';
import { Timeline } from '../components/Timeline';
import { SearchFilter } from '../components/SearchFilter';
import { WeekCalendar } from '../components/WeekCalendar';
import { MonthCalendar } from '../components/MonthCalendar';
import { AgendaView } from '../components/AgendaView';
import { HabitsPanel } from '../components/HabitsPanel';
import { PlanMyDay } from '../components/PlanMyDay';
import { TodaySummary } from '../components/TodaySummary';
import { Task, ViewMode, Priority, Status } from '../lib/types';
import { todayString, formatDate, isTaskActive, getCurrentTimeMinutes, timeToMinutes, weekDates, startOfWeek } from '../lib/utils';

interface DashboardProps {
  onEdit: (task: Task) => void;
  view: ViewMode;
  selectedDate: string;
  onDateChange: (d: string) => void;
  onFocus: () => void;
}

function StatCard({ label, value, icon: Icon, color, darkMode }: {
  label: string; value: number | string; icon: typeof Zap; color: string; darkMode: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10`}>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      </div>
    </div>
  );
}

export function Dashboard({ onEdit, view, selectedDate, onDateChange, onFocus }: DashboardProps) {
  const { state, fetchTasks, clearPlan } = useTaskContext();
  const { user } = useAuth();
  const { tasks, loading, darkMode, smartReminder } = state;
  const [showPlan, setShowPlan] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  const today = todayString();

  useEffect(() => {
    if (view === 'week') {
      const days = weekDates(startOfWeek(selectedDate));
      fetchTasks({ from: days[0], to: days[6] });
    } else if (view === 'month' || view === 'agenda') {
      fetchTasks();
    }
  }, [view, selectedDate, fetchTasks]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === today), [tasks, today]);
  const activeTask = useMemo(() => todayTasks.find(isTaskActive), [todayTasks]);
  const upcomingTasks = useMemo(() => {
    const now = getCurrentTimeMinutes();
    return todayTasks
      .filter((t) => t.status === 'pending' && timeToMinutes(t.start_time) > now)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
      .slice(0, 3);
  }, [todayTasks]);

  const selectedTasks = useMemo(() => tasks.filter((t) => t.date === selectedDate), [tasks, selectedDate]);

  const allFilteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  }, [tasks, search, priorityFilter, statusFilter]);

  const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
  const progress = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  if (view === 'habits') return <HabitsPanel />;

  if (view === 'week') {
    return (
      <div className="space-y-4">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Week View</h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drag tasks between days to reschedule</p>
        <WeekCalendar selectedDate={selectedDate} onDateChange={onDateChange} onEdit={onEdit} />
      </div>
    );
  }

  if (view === 'month') {
    return (
      <div className="space-y-4">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Month View</h1>
        <MonthCalendar selectedDate={selectedDate} onDateChange={onDateChange} />
        {selectedTasks.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(selectedDate)}</h3>
            {selectedTasks.map((t) => <TaskCard key={t.id} task={t} onEdit={onEdit} />)}
          </div>
        )}
      </div>
    );
  }

  if (view === 'agenda') {
    return (
      <div className="space-y-4">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Agenda</h1>
        <AgendaView selectedDate={selectedDate} onEdit={onEdit} />
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        {showPlan && <PlanMyDay date={today} onClose={() => setShowPlan(false)} />}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} 👋
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(today)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { clearPlan(); setShowPlan(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90">
              <Sparkles className="w-4 h-4" />Plan my day
            </button>
            <button onClick={onFocus} className="px-4 py-2 rounded-xl border text-sm font-semibold border-blue-500 text-blue-500 hover:bg-blue-500/10">
              Focus
            </button>
            <button onClick={() => fetchTasks()} className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
              <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {smartReminder && (
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${darkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className={`text-sm ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{smartReminder}</p>
          </div>
        )}

        <TodaySummary
          darkMode={darkMode}
          refreshKey={completedToday}
          todayTasks={todayTasks}
          onEdit={onEdit}
          emailRemindersEnabled={user?.emailRemindersEnabled}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Today's Tasks" value={todayTasks.length} icon={CalendarDays} color="blue" darkMode={darkMode} />
          <StatCard label="Completed" value={completedToday} icon={CheckCircle2} color="emerald" darkMode={darkMode} />
          <StatCard label="In Progress" value={activeTask ? 1 : 0} icon={Zap} color="amber" darkMode={darkMode} />
          <StatCard label="Completion" value={`${progress}%`} icon={TrendingUp} color="teal" darkMode={darkMode} />
        </div>

        <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Daily Progress</span>
            <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{progress}%</span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-teal-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {activeTask && (
          <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Currently Active</span>
            </div>
            <TaskCard task={activeTask} onEdit={onEdit} />
          </div>
        )}

        {upcomingTasks.length > 0 && (
          <div>
            <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upcoming Today</h2>
            <div className="space-y-2.5">
              {upcomingTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} compact />)}
            </div>
          </div>
        )}

        <div>
          <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>All Tasks Today</h2>
          {loading ? (
            <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className={`h-20 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}</div>
          ) : todayTasks.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CalendarDays className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No tasks for today</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'timeline') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Timeline</h1>
          <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className={`px-3.5 py-2 rounded-xl border text-sm outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(selectedDate)}</p>
        {selectedTasks.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Clock className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No tasks for this date</p>
          </div>
        ) : (
          <Timeline tasks={selectedTasks} onEdit={onEdit} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Tasks</h1>
      <SearchFilter search={search} onSearchChange={setSearch} priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter} statusFilter={statusFilter} onStatusChange={setStatusFilter} />
      {loading ? (
        <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className={`h-20 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}</div>
      ) : allFilteredTasks.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <ChevronRight className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No tasks match your filters</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allFilteredTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
}
