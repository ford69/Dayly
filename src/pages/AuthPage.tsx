import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'signup';

function AppBadge({ label }: { label: string }) {
  return (
    <div className="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2 shadow-sm">
      <div className="h-6 w-6 rounded-md bg-slate-100" />
      <div className="leading-tight">
        <div className="text-[10px] text-slate-500">Download on</div>
        <div className="text-xs font-semibold text-slate-700">{label}</div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Welcome'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'login' ? 'Enter your email to start planning' : 'Create your account to start planning'),
    [mode]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;
    type GoogleApi = {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
    const google = (window as Window & { google?: GoogleApi }).google;

    const loadAndRender = () => {
      const currentGoogle = (window as Window & { google?: GoogleApi }).google;
      if (!currentGoogle?.accounts?.id || !googleButtonRef.current) return;

      currentGoogle.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return;
          try {
            await loginWithGoogle(response.credential);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-in failed');
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      currentGoogle.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: mode === 'login' ? 'signin_with' : 'signup_with',
        width: 360,
      });
    };

    if (google?.accounts?.id) {
      loadAndRender();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = loadAndRender;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [mode, loginWithGoogle]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-rose-50/40 text-slate-900">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="relative hidden lg:block overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/login-bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-white/58" />
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.95),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.75),transparent_55%),radial-gradient(circle_at_40%_85%,rgba(255,255,255,0.8),transparent_55%)]" />

          <div className="absolute left-10 top-10 w-[520px] max-w-[calc(100%-5rem)] rounded-3xl bg-white/75 backdrop-blur border border-white shadow-2xl p-6">
            <div className="h-8 w-40 rounded-lg bg-slate-100" />
            <div className="mt-5 grid grid-cols-7 gap-3">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-12 rounded-xl ${
                    i % 9 === 0 ? 'bg-emerald-100' : i % 11 === 0 ? 'bg-sky-100' : 'bg-white'
                  } border border-slate-100`}
                />
              ))}
            </div>
          </div>

          <div className="absolute left-24 bottom-14 w-[300px] rounded-2xl bg-white/80 backdrop-blur border border-white shadow-xl p-4">
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-10 rounded-xl bg-white border border-slate-100" />
              <div className="h-10 rounded-xl bg-white border border-slate-100" />
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-6 py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-indigo-50/70 to-rose-50/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(129,140,248,0.12),transparent_55%)]" />

          <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl shadow-xl p-8 sm:p-10">
            <div className="flex items-center justify-center gap-3 mb-10">
              <img
                src="/dayly.png"
                alt="Dayly"
                className="h-20 w-20 object-contain"
              />
            </div>

            <h1 className="text-center text-3xl font-semibold">{title}</h1>
            <p className="text-center text-slate-500 mt-2">{subtitle}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Your email address"
                  autoComplete="email"
                  className="w-full h-11 rounded-xl bg-white border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Your password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full h-11 rounded-xl bg-white border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Please wait…' : mode === 'login' ? 'Get Started' : 'Create Account'}
              </button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="mt-4 mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">or continue with</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="flex justify-center">
                  <div ref={googleButtonRef} />
                </div>
              </>
            )}

            <div className="mt-5 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button className="text-slate-900 underline underline-offset-4" onClick={() => setMode('signup')}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button className="text-slate-900 underline underline-offset-4" onClick={() => setMode('login')}>
                    Log in
                  </button>
                </>
              )}
            </div>

            <div className="mt-10 text-center text-xs text-slate-500">
              By continuing, you&apos;re signing up to My Daily Planner.
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <AppBadge label="Google Play" />
              <AppBadge label="App Store" />
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
              <button className="hover:text-slate-700 transition" type="button">
                Privacy Policy
              </button>
              <span className="text-slate-300">|</span>
              <button className="hover:text-slate-700 transition" type="button">
                Terms of Service
              </button>
              <span className="text-slate-300">|</span>
              <button className="hover:text-slate-700 transition" type="button">
                Data Processing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

