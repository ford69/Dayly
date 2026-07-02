export function getLocalHour(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
}

export function getLocalDateString(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
