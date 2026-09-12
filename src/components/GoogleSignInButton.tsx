import { useEffect, useRef, useState } from 'react';
import { getGoogleClientId, loadGoogleIdentityScript } from '../lib/googleAuth';

type Props = {
  mode: 'login' | 'signup';
  onCredential: (credential: string) => Promise<void>;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ mode, onCredential, onError }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || !hostRef.current) return;
    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            setBusy(true);
            try {
              await onCredential(response.credential);
            } catch (err) {
              onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
            } finally {
              setBusy(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        hostRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hostRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: mode === 'login' ? 'signin_with' : 'signup_with',
          width: Math.min(360, hostRef.current.parentElement?.clientWidth ?? 360),
          logo_alignment: 'left',
        });
        setReady(true);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Google sign-in unavailable');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, mode, onCredential, onError]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Google sign-in needs <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and{' '}
        <code className="font-mono">GOOGLE_CLIENT_ID</code> in your environment.
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center min-h-[44px]">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
          Loading Google…
        </div>
      )}
      <div
        ref={hostRef}
        className={`w-full flex justify-center ${busy ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={busy}
      />
    </div>
  );
}
