import { useCallback, useEffect, useState } from 'react';
import {
  Flame,
  Target,
  AlertTriangle,
  CalendarClock,
  History,
  Mail,
  Share2,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { TodaySummary as TodaySummaryData, Task } from '../lib/types';
import { formatDate, formatTime } from '../lib/utils';
import { ShareDayPlan } from './ShareDayPlan';

interface TodaySummaryProps {
  darkMode: boolean;
  refreshKey: number;
  todayTasks: Task[];
  onEdit: (task: Task) => void;
  emailRemindersEnabled?: boolean;
}

function Section({
  title,
  icon: Icon,
  empty,
  darkMode,
  children,
}: {
  title: string;
  icon: typeof Target;
  empty: string;
  darkMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </h3>
      </div>
      {children ? children : (
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{empty}</p>
      )}
    </div>
  );
}

export function TodaySummary({
  darkMode,
  refreshKey,
  todayTasks,
  onEdit,
  emailRemindersEnabled = false,
}: TodaySummaryProps) {
  const [summary, setSummary] = useState<TodaySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(emailRemindersEnabled);
  const [savingEmail, setSavingEmail] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ summary: TodaySummaryData }>('/api/today/summary');
      setSummary(data.summary);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  useEffect(() => {
    setEmailEnabled(emailRemindersEnabled);
  }, [emailRemindersEnabled]);

  const toggleEmailReminders = async () => {
    setSavingEmail(true);
    try {
      const next = !emailEnabled;
      await apiFetch('/api/today/preferences', {
        method: 'PUT',
        json: { email_reminders_enabled: next },
      });
      setEmailEnabled(next);
    } catch {
      // keep previous state
    } finally {
      setSavingEmail(false);
    }
  };

  const taskById = (id: string) => todayTasks.find((t) => t.id === id);

  if (loading && !summary) {
    return (
      <div
        className={`rounded-2xl border p-6 flex items-center justify-center gap-2 ${
          darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
        }`}
      >
        <Loader2 className={`w-5 h-5 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading today&apos;s summary…</span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <>
      {showShare && (
        <ShareDayPlan
          summary={summary}
          tasks={todayTasks}
          darkMode={darkMode}
          onClose={() => setShowShare(false)}
        />
      )}

      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
        }`}
      >
        <div
          className={`px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${
            darkMode ? 'border-gray-700 bg-gradient-to-r from-blue-950/40 to-purple-950/30' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Today Summary
            </p>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDate(summary.date)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-gray-900/60' : 'bg-white/80'}`}>
              <Flame className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {summary.streak} day{summary.streak === 1 ? '' : 's'}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-gray-900/60' : 'bg-white/80'}`}>
              <Target className="w-4 h-4 text-teal-500" />
              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {summary.productivity_score}%
              </span>
            </div>
            <button
              onClick={() => setShowShare(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        <div className="p-5 grid md:grid-cols-3 gap-6">
          <Section title="What do I do today?" icon={CalendarClock} empty="Nothing scheduled — add a task!" darkMode={darkMode}>
            {summary.do_today.length > 0 && (
              <ul className="space-y-2">
                {summary.do_today.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        const t = taskById(item.id);
                        if (t) onEdit(t);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        darkMode ? 'hover:bg-gray-700/60 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className={`ml-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTime(item.start_time)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="What's urgent?" icon={AlertTriangle} empty="No high-priority tasks today." darkMode={darkMode}>
            {summary.urgent.length > 0 && (
              <ul className="space-y-2">
                {summary.urgent.map((item) => (
                  <li
                    key={item.id}
                    className={`px-3 py-2 rounded-xl text-sm border ${
                      darkMode ? 'border-red-900/50 bg-red-950/20 text-red-200' : 'border-red-100 bg-red-50 text-red-800'
                    }`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className={`ml-2 text-xs opacity-70`}>{formatTime(item.start_time)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="What did I miss?" icon={History} empty="You're all caught up!" darkMode={darkMode}>
            {summary.missed.length > 0 && (
              <ul className="space-y-2">
                {summary.missed.map((item) => (
                  <li
                    key={item.id}
                    className={`px-3 py-2 rounded-xl text-sm ${
                      darkMode ? 'bg-amber-950/20 text-amber-200' : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className={`block text-xs mt-0.5 ${darkMode ? 'text-amber-400/70' : 'text-amber-700/70'}`}>
                      {formatDate(item.date)} · {formatTime(item.start_time)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div
          className={`px-5 py-3 border-t flex items-center justify-between flex-wrap gap-3 ${
            darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'
          }`}
        >
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {summary.tasks_completed}/{summary.tasks_total} tasks done today
          </p>
          <label className={`flex items-center gap-2 text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <Mail className="w-4 h-4" />
            <span>Email reminders</span>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              disabled={savingEmail}
              onClick={() => void toggleEmailReminders()}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                emailEnabled ? 'bg-blue-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  emailEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </>
  );
}
