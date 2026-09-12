import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { type BeforeInstallPromptEvent, isStandaloneDisplay } from '../lib/pwa';

const DISMISS_KEY = 'dayly_install_dismissed_at';
const DISMISS_DAYS = 14;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    else dismiss();
  };

  return (
    <div className="fixed z-50 left-3 right-3 sm:left-auto sm:right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl p-4 text-slate-900">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm">Install Dayly</h3>
              <button type="button" onClick={dismiss} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Faster access, reminders, and offline use — Dayly works like an app on your home screen.
            </p>
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Install Dayly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
