import { Task, Priority } from './types';

export function formatTime(time: string): string {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

export function weekDates(dateStr: string): string[] {
  const start = startOfWeek(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthDates(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = Array(first.getDay()).fill(null);

  for (let day = 1; day <= last.getDate(); day++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    week.push(ds);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
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

export function priorityColor(priority: Priority): string {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'amber';
    case 'low': return 'emerald';
  }
}

export function priorityBadge(priority: Priority): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700 border border-red-200';
    case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'low': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }
}

export function priorityBadgeDark(priority: Priority): string {
  switch (priority) {
    case 'high': return 'bg-red-900/40 text-red-400 border border-red-800';
    case 'medium': return 'bg-amber-900/40 text-amber-400 border border-amber-800';
    case 'low': return 'bg-emerald-900/40 text-emerald-400 border border-emerald-800';
  }
}

export function isTaskActive(task: Task): boolean {
  if (task.date !== todayString()) return false;
  const now = getCurrentTimeMinutes();
  const start = timeToMinutes(task.start_time);
  const end = timeToMinutes(task.end_time);
  return now >= start && now <= end;
}

export function detectOverlaps(tasks: Task[]): Set<string> {
  const overlapping = new Set<string>();
  const sorted = [...tasks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const aEnd = timeToMinutes(sorted[i].end_time);
      const bStart = timeToMinutes(sorted[j].start_time);
      if (bStart < aEnd) {
        overlapping.add(sorted[i].id);
        overlapping.add(sorted[j].id);
      } else {
        break;
      }
    }
  }

  return overlapping;
}

export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  weekdays: 'Every weekday',
  monthly: 'Every month',
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HABIT_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};
