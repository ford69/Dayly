import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'signup';

function AppBadge({ label }: { label: string }) {
  return (
    <div className="h-10 px-3 rounded-lg border border-white/15 bg-white/5 flex items-center gap-2">
      <div className="h-6 w-6 rounded-md bg-white/10" />
      <div className="leading-tight">
        <div className="text-[10px] text-white/60">Download on</div>
        <div className="text-xs font-semibold text-white">{label}</div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Welcome'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'login' ? 'Enter your email to start planning' : 'Create your account to start planning'),
    [mode]
  );

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
    <div className="min-h-screen bg-[#0b0b10] text-white">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f7efe8] via-[#c6d7ea] to-[#f2a3a1]" />
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_45%),radial-gradient(circle_at_85%_35%,rgba(255,255,255,0.75),transparent_55%),radial-gradient(circle_at_40%_85%,rgba(255,255,255,0.7),transparent_55%)]" />

          <div className="absolute left-10 top-10 w-[520px] max-w-[calc(100%-5rem)] rounded-3xl bg-white/55 backdrop-blur border border-white/50 shadow-2xl p-6">
            <div className="h-8 w-36 rounded-lg bg-black/10" />
            <div className="mt-5 grid grid-cols-7 gap-3">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-12 rounded-xl ${
                    i % 9 === 0 ? 'bg-emerald-200/70' : i % 11 === 0 ? 'bg-sky-200/70' : 'bg-white/65'
                  } border border-black/5`}
                />
              ))}
            </div>
          </div>

          <div className="absolute left-24 bottom-14 w-[300px] rounded-2xl bg-white/55 backdrop-blur border border-white/50 shadow-xl p-4">
            <div className="h-4 w-36 rounded bg-black/10" />
            <div className="mt-3 space-y-2">
              <div className="h-10 rounded-xl bg-white/70 border border-black/5" />
              <div className="h-10 rounded-xl bg-white/70 border border-black/5" />
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-6 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_55%)]" />

          <div className="relative w-full max-w-md">
            <div className="flex items-center justify-center gap-3 mb-10">
              <img
                src="/dayly.png"
                alt="Dayly"
                className="h-20 w-20 object-contain"
              />
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="h-10 w-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-white/60 rotate-12" />
              </div>
            </div>

            <h1 className="text-center text-3xl font-semibold">{title}</h1>
            <p className="text-center text-white/60 mt-2">{subtitle}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Your email address"
                  autoComplete="email"
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Your password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-white/20"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="text-sm text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Please wait…' : mode === 'login' ? 'Get Started' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-white/60">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button className="text-white/90 underline underline-offset-4" onClick={() => setMode('signup')}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button className="text-white/90 underline underline-offset-4" onClick={() => setMode('login')}>
                    Log in
                  </button>
                </>
              )}
            </div>

            <div className="mt-10 text-center text-xs text-white/50">
              By continuing, you&apos;re signing up to My Daily Planner.
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <AppBadge label="Google Play" />
              <AppBadge label="App Store" />
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-white/50">
              <button className="hover:text-white/80 transition" type="button">
                Privacy Policy
              </button>
              <span className="text-white/20">|</span>
              <button className="hover:text-white/80 transition" type="button">
                Terms of Service
              </button>
              <span className="text-white/20">|</span>
              <button className="hover:text-white/80 transition" type="button">
                Data Processing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

