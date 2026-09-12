import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useTaskContext } from '../context/TaskContext';
import { apiFetch } from '../lib/api';
import { HabitTemplateGroup } from '../lib/types';

const STEPS = ['welcome', 'timezone', 'template', 'done'] as const;
type Step = (typeof STEPS)[number];

function storageKey(userId: string) {
  return `dayly_onboarded_${userId}`;
}

export function OnboardingFlow() {
  const { user, refresh } = useAuth();
  const { applyTemplate, fetchTemplates } = useHabits();
  const { state } = useTaskContext();
  const { darkMode } = state;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [templates, setTemplates] = useState<HabitTemplateGroup[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(storageKey(user.id))) return;
    setOpen(true);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    void fetchTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, [open, fetchTemplates]);

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return [timezone, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
    }
  }, [timezone]);

  if (!open || !user) return null;

  const finish = () => {
    localStorage.setItem(storageKey(user.id), '1');
    setOpen(false);
  };

  const saveTimezone = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/today/preferences', {
        method: 'PUT',
        json: { timezone },
      });
      await refresh();
      setStep('template');
    } finally {
      setSaving(false);
    }
  };

  const applyAndContinue = async () => {
    if (selectedTemplate) {
      setSaving(true);
      try {
        await applyTemplate(selectedTemplate);
      } finally {
        setSaving(false);
      }
    }
    setStep('done');
  };

  const panel = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl p-6 ${panel}`}>
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                STEPS.indexOf(s) <= STEPS.indexOf(step)
                  ? 'bg-blue-500'
                  : darkMode
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 'welcome' && (
          <div className="space-y-4">
            <img src="/dayly.png" alt="Dayly" className="h-10 w-auto object-contain" />
            <h2 className="text-2xl font-bold">Welcome to Dayly</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Plan tasks, build habits, and review your day — let’s set up your workspace in under a minute.
            </p>
            <button
              onClick={() => setStep('timezone')}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              Get started <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'timezone' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your timezone</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Used for morning briefings and email reminders.
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <button
              onClick={() => void saveTimezone()}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'template' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Start with habits</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pick a template or skip — you can add habits anytime.
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                    selectedTemplate === t.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : darkMode
                        ? 'border-gray-700'
                        : 'border-gray-200'
                  }`}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className={`block text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t.habits.length} habits
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('done')}
                className={`flex-1 py-3 rounded-xl border font-semibold text-sm ${
                  darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'
                }`}
              >
                Skip
              </button>
              <button
                onClick={() => void applyAndContinue()}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">You’re ready</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add a task, check in on habits, or open Focus when it’s time to deep work.
            </p>
            <button onClick={finish} className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold">
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
