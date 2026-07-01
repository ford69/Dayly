export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function occursOnDate(rule: RecurrenceRule, anchorDate: string, checkDate: string): boolean {
  if (rule === 'none') return anchorDate === checkDate;
  if (checkDate < anchorDate) return false;

  const anchor = new Date(anchorDate + 'T00:00:00');
  const check = new Date(checkDate + 'T00:00:00');
  const dayOfWeek = check.getDay();

  switch (rule) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return dayOfWeek === anchor.getDay();
    case 'monthly':
      return check.getDate() === anchor.getDate();
    default:
      return false;
  }
}

export function generateInstanceDates(
  rule: RecurrenceRule,
  startDate: string,
  recurrenceEnd: string | null,
  horizonDays = 90
): string[] {
  if (rule === 'none') return [startDate];

  const rangeEnd = addDays(startDate, horizonDays);
  const end = recurrenceEnd && recurrenceEnd < rangeEnd ? recurrenceEnd : rangeEnd;
  const dates: string[] = [];
  let current = startDate;

  while (current <= end) {
    if (occursOnDate(rule, startDate, current)) dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function suggestNextSlot(
  date: string,
  startTime: string,
  endTime: string,
  busyTasks: { date: string; start_time: string; end_time: string }[]
): { date: string; start_time: string; end_time: string } {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const dayBusy = busyTasks
    .filter((t) => t.date === date)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let slotStart = 9 * 60;
  for (const block of dayBusy) {
    const blockStart = timeToMinutes(block.start_time);
    const blockEnd = timeToMinutes(block.end_time);
    if (slotStart + duration <= blockStart) break;
    slotStart = Math.max(slotStart, blockEnd + 15);
  }

  if (slotStart + duration > 18 * 60) {
    const nextDate = addDays(date, 1);
    return { date: nextDate, start_time: '09:00', end_time: minutesToTime(9 * 60 + duration) };
  }

  return {
    date,
    start_time: minutesToTime(slotStart),
    end_time: minutesToTime(slotStart + duration),
  };
}
