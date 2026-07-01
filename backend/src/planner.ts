import type { TaskPriority, TaskRow } from './models';
import { minutesToTime, timeToMinutes } from './recurrence';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

export type PlanSuggestion = {
  task_id: string;
  title: string;
  priority: TaskPriority;
  suggested_date: string;
  suggested_start_time: string;
  suggested_end_time: string;
  reason: string;
};

export function planDay(tasks: TaskRow[], date: string): { suggestions: PlanSuggestion[]; summary: string } {
  const pending = tasks
    .filter((t) => t.date === date && t.status === 'pending')
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.start_time.localeCompare(b.start_time));

  const highCount = pending.filter((t) => t.priority === 'high').length;
  const suggestions: PlanSuggestion[] = [];
  let slotStart = 9 * 60;
  const workEnd = 18 * 60;

  for (const task of pending) {
    const duration = Math.max(timeToMinutes(task.end_time) - timeToMinutes(task.start_time), 30);

    for (const existing of suggestions) {
      const existingEnd = timeToMinutes(existing.suggested_end_time);
      const existingStart = timeToMinutes(existing.suggested_start_time);
      if (slotStart < existingEnd && slotStart + duration > existingStart) {
        slotStart = existingEnd + 15;
      }
    }

    if (slotStart + duration > workEnd) {
      suggestions.push({
        task_id: task.id,
        title: task.title,
        priority: task.priority,
        suggested_date: date,
        suggested_start_time: task.start_time,
        suggested_end_time: task.end_time,
        reason: 'No free slot left today — keeping your original time',
      });
      continue;
    }

    const reason =
      task.priority === 'high'
        ? 'Scheduled early — high priority'
        : slotStart < 12 * 60
          ? 'Morning slot for focus work'
          : 'Afternoon slot';

    suggestions.push({
      task_id: task.id,
      title: task.title,
      priority: task.priority,
      suggested_date: date,
      suggested_start_time: minutesToTime(slotStart),
      suggested_end_time: minutesToTime(slotStart + duration),
      reason,
    });

    slotStart += duration + 15;
  }

  const summary =
    pending.length === 0
      ? 'No pending tasks for this day.'
      : highCount > 0
        ? `You have ${pending.length} task${pending.length === 1 ? '' : 's'} today — ${highCount} high priority. Start with the most urgent.`
        : `You have ${pending.length} task${pending.length === 1 ? '' : 's'} today — I spaced them across your morning and afternoon.`;

  return { suggestions, summary };
}

export function smartReminderMessage(tasks: TaskRow[], date: string): string | null {
  const todayTasks = tasks.filter((t) => t.date === date && t.status === 'pending');
  if (todayTasks.length === 0) return null;

  const high = todayTasks.filter((t) => t.priority === 'high').length;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const morningTasks = todayTasks.filter((t) => timeToMinutes(t.start_time) < 12 * 60);
  if (high >= 3 && nowMins < 10 * 60) {
    return `You have ${high} high-priority tasks today — start early to stay on track.`;
  }
  if (morningTasks.length >= 2 && nowMins < 9 * 60) {
    return 'You usually do better with deep work in the morning — tackle your first task before 10am.';
  }
  if (todayTasks.length >= 5) {
    return `${todayTasks.length} tasks on your plate today. Use "Plan my day" to schedule them.`;
  }
  return null;
}
