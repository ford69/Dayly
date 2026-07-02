import type { HabitRow } from '../models';
import { addDays, todayString } from '../recurrence';

export type HabitTimeStatus = 'off_day' | 'upcoming' | 'active' | 'completed' | 'missed';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isHabitScheduledOnDate(habit: Pick<HabitRow, 'target_days'>, date: string): boolean {
  const day = new Date(date + 'T00:00:00').getDay();
  return habit.target_days.includes(day);
}

export function getHabitTimeStatus(
  habit: Pick<HabitRow, 'start_time' | 'end_time' | 'target_days'>,
  completedToday: boolean,
  date: string,
  now = new Date()
): HabitTimeStatus {
  if (!isHabitScheduledOnDate(habit, date)) return 'off_day';
  if (completedToday) return 'completed';

  const today = todayString();
  if (date !== today) return 'upcoming';

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(habit.start_time);
  const end = timeToMinutes(habit.end_time);

  if (nowMin < start) return 'upcoming';
  if (nowMin >= start && nowMin <= end) return 'active';
  return 'missed';
}

export function computeHabitStreak(
  habit: Pick<HabitRow, 'target_days'>,
  completedDates: string[],
  fromDate: string
): number {
  const completed = new Set(completedDates);
  let streak = 0;
  let check = fromDate;

  if (isHabitScheduledOnDate(habit, check) && !completed.has(check)) {
    check = addDays(check, -1);
  }

  for (let i = 0; i < 365; i++) {
    const day = new Date(check + 'T00:00:00').getDay();
    if (habit.target_days.includes(day)) {
      if (!completed.has(check)) break;
      streak++;
    }
    check = addDays(check, -1);
  }

  return streak;
}
