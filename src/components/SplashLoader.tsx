interface SplashLoaderProps {
  label?: string;
}

export function SplashLoader({ label = 'Loading…' }: SplashLoaderProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/60 to-rose-50/50"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(129,140,248,0.14),transparent_55%)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="splash-logo-wrap">
          <img
            src="/dayly.png"
            alt="Dayly"
            className="h-14 sm:h-16 w-auto max-w-[240px] object-contain splash-logo"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="splash-bar" aria-hidden />
          <p className="text-xs font-medium tracking-wide text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
