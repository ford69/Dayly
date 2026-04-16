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

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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
