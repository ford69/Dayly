import type { HabitLogRow, HabitRow } from './models';
import { addDays, todayString } from './recurrence';
import { HABIT_MILESTONES } from './habitTemplates';

export type HabitFrequency =
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'every_n_days'
  | 'every_n_weeks'
  | 'monthly'
  | 'custom';

export type FrequencyConfig = {
  days?: number[];
  day?: number;
  interval?: number;
};

export type HabitTimeStatus = 'off_day' | 'upcoming' | 'active' | 'completed' | 'missed';

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function weeksBetween(from: string, to: string): number {
  return Math.floor(daysBetween(from, to) / 7);
}

export function parseFrequencyConfig(raw: unknown): FrequencyConfig {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  return {
    days: Array.isArray(o.days) ? o.days.map(Number) : undefined,
    day: typeof o.day === 'number' ? o.day : undefined,
    interval: typeof o.interval === 'number' ? o.interval : undefined,
  };
}

export function isGoalMet(habit: Pick<HabitRow, 'goal_type' | 'target'>, value: number): boolean {
  if (habit.goal_type === 'checkbox') return value >= 1;
  return value >= Number(habit.target);
}

export function progressPercent(habit: Pick<HabitRow, 'target'>, value: number): number {
  const target = Number(habit.target) || 1;
  return Math.min(100, Math.round((value / target) * 100));
}

export function isHabitScheduledOnDate(habit: HabitRow, date: string): boolean {
  if (habit.status !== 'active') return false;
  if (date < habit.start_date) return false;
  if (habit.end_date && date > habit.end_date) return false;

  const dow = new Date(date + 'T00:00:00').getDay();
  if (habit.rest_days?.includes(dow)) return false;

  const cfg = parseFrequencyConfig(habit.frequency_config);
  const freq = habit.frequency as HabitFrequency;

  switch (freq) {
    case 'daily':
      return true;
    case 'weekdays':
      return dow >= 1 && dow <= 5;
    case 'weekends':
      return dow === 0 || dow === 6;
    case 'weekly':
      return dow === (cfg.day ?? 1);
    case 'every_n_days': {
      const interval = cfg.interval ?? 2;
      const elapsed = daysBetween(habit.start_date, date);
      return elapsed >= 0 && elapsed % interval === 0;
    }
    case 'every_n_weeks': {
      const interval = cfg.interval ?? 2;
      const elapsed = weeksBetween(habit.start_date, date);
      return elapsed >= 0 && elapsed % interval === 0 && dow === (cfg.day ?? 1);
    }
    case 'monthly': {
      const dom = new Date(date + 'T00:00:00').getDate();
      return dom === (cfg.day ?? 1);
    }
    case 'custom': {
      const days = cfg.days ?? habit.target_days ?? [0, 1, 2, 3, 4, 5, 6];
      return days.includes(dow);
    }
    default:
      return true;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function getHabitTimeStatus(
  habit: HabitRow,
  goalMet: boolean,
  date: string,
  now = new Date()
): HabitTimeStatus {
  if (!isHabitScheduledOnDate(habit, date)) return 'off_day';
  if (goalMet) return 'completed';

  const today = todayString();
  if (date !== today) return 'upcoming';

  const start = habit.start_time ?? '09:00';
  const end = habit.end_time ?? '09:30';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  if (nowMin < startMin) return 'upcoming';
  if (nowMin >= startMin && nowMin <= endMin) return 'active';
  return 'missed';
}

type DayOutcome = 'success' | 'frozen' | 'skipped' | 'failed' | 'unscheduled';

function dayOutcome(
  habit: HabitRow,
  date: string,
  logsByDate: Map<string, HabitLogRow>,
  freezes: Set<string>
): DayOutcome {
  if (!isHabitScheduledOnDate(habit, date)) return 'unscheduled';
  if (freezes.has(date)) return 'frozen';

  const log = logsByDate.get(date);
  if (log && isGoalMet(habit, Number(log.value))) return 'success';
  return 'failed';
}

export function computeStreaks(
  habit: HabitRow,
  logs: HabitLogRow[],
  freezes: string[],
  fromDate: string
): { current: number; best: number } {
  const logsByDate = new Map(logs.map((l) => [l.date, l]));
  const freezeSet = new Set(freezes);

  let current = 0;
  let check = fromDate;
  if (dayOutcome(habit, check, logsByDate, freezeSet) === 'failed') {
    check = addDays(check, -1);
  }

  for (let i = 0; i < 730; i++) {
    const outcome = dayOutcome(habit, check, logsByDate, freezeSet);
    if (outcome === 'unscheduled') {
      check = addDays(check, -1);
      continue;
    }
    if (outcome === 'success' || outcome === 'frozen') {
      current++;
      check = addDays(check, -1);
    } else break;
  }

  let best = 0;
  let run = 0;
  const start = addDays(fromDate, -730);
  let d = start;
  while (d <= fromDate) {
    const outcome = dayOutcome(habit, d, logsByDate, freezeSet);
    if (outcome === 'success' || outcome === 'frozen') {
      run++;
      best = Math.max(best, run);
    } else if (outcome === 'failed') {
      run = 0;
    }
    d = addDays(d, 1);
  }

  return { current, best };
}

export function achievedMilestones(streak: number): number[] {
  return HABIT_MILESTONES.filter((m) => streak >= m);
}

export function suggestReminderTime(logs: HabitLogRow[]): string | null {
  const hours = logs
    .filter((l) => l.completed_at)
    .map((l) => new Date(l.completed_at!).getHours());

  if (hours.length < 3) return null;

  const counts = new Map<number, number>();
  for (const h of hours) counts.set(h, (counts.get(h) ?? 0) + 1);
  let bestHour = hours[0];
  let bestCount = 0;
  for (const [h, c] of counts) {
    if (c > bestCount) {
      bestCount = c;
      bestHour = h;
    }
  }

  const reminderHour = Math.max(0, bestHour);
  const reminderMin = 45;
  return `${String(reminderHour).padStart(2, '0')}:${String(reminderMin).padStart(2, '0')}`;
}

export function buildHeatmap(
  habit: HabitRow,
  logs: HabitLogRow[],
  from: string,
  to: string
): { date: string; value: number; level: number; scheduled: boolean }[] {
  const logsByDate = new Map(logs.map((l) => [l.date, l]));
  const cells: { date: string; value: number; level: number; scheduled: boolean }[] = [];
  let d = from;
  while (d <= to) {
    const scheduled = isHabitScheduledOnDate(habit, d);
    const log = logsByDate.get(d);
    const value = log ? Number(log.value) : 0;
    const met = log ? isGoalMet(habit, value) : false;
    let level = 0;
    if (scheduled && value > 0) {
      level = met ? 4 : Math.min(3, Math.max(1, Math.ceil(progressPercent(habit, value) / 33)));
    }
    cells.push({ date: d, value, level, scheduled });
    d = addDays(d, 1);
  }
  return cells;
}

export function computeInsights(
  habit: HabitRow,
  logs: HabitLogRow[],
  fromDate: string,
  toDate: string
): {
  completion_rate: number;
  scheduled_days: number;
  completed_days: number;
  best_hour: number | null;
  missed_weekday: string | null;
} {
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const logsByDate = new Map(logs.map((l) => [l.date, l]));
  let scheduled = 0;
  let completed = 0;
  const missedByDow = new Map<number, number>();
  const hourCounts = new Map<number, number>();

  let d = fromDate;
  while (d <= toDate) {
    if (isHabitScheduledOnDate(habit, d)) {
      scheduled++;
      const log = logsByDate.get(d);
      if (log && isGoalMet(habit, Number(log.value))) {
        completed++;
        if (log.completed_at) {
          const h = new Date(log.completed_at).getHours();
          hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
        }
      } else {
        const dow = new Date(d + 'T00:00:00').getDay();
        missedByDow.set(dow, (missedByDow.get(dow) ?? 0) + 1);
      }
    }
    d = addDays(d, 1);
  }

  let bestHour: number | null = null;
  let bestHourCount = 0;
  for (const [h, c] of hourCounts) {
    if (c > bestHourCount) {
      bestHourCount = c;
      bestHour = h;
    }
  }

  let missedWeekday: string | null = null;
  let missedMax = 0;
  for (const [dow, c] of missedByDow) {
    if (c > missedMax) {
      missedMax = c;
      missedWeekday = weekdayNames[dow];
    }
  }

  return {
    completion_rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    scheduled_days: scheduled,
    completed_days: completed,
    best_hour: bestHour,
    missed_weekday: missedMax > 0 ? missedWeekday : null,
  };
}

export function computeWeeklyStats(
  habits: HabitRow[],
  allLogs: HabitLogRow[],
  weekStart: string,
  weekEnd: string
) {
  const logsByHabit = new Map<string, HabitLogRow[]>();
  for (const log of allLogs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  let scheduledTotal = 0;
  let completedTotal = 0;
  let longestStreak = 0;
  let currentStreakSum = 0;
  const missed: { habit_id: string; title: string; date: string }[] = [];

  for (const habit of habits) {
    if (habit.status !== 'active') continue;
    const logs = logsByHabit.get(habit.id) ?? [];
    const logsByDate = new Map(logs.map((l) => [l.date, l]));

    let d = weekStart;
    while (d <= weekEnd) {
      if (isHabitScheduledOnDate(habit, d)) {
        scheduledTotal++;
        const log = logsByDate.get(d);
        if (log && isGoalMet(habit, Number(log.value))) {
          completedTotal++;
        } else if (d < todayString()) {
          missed.push({ habit_id: habit.id, title: habit.title, date: d });
        }
      }
      d = addDays(d, 1);
    }

    const { current, best } = computeStreaks(habit, logs, [], todayString());
    currentStreakSum += current;
    longestStreak = Math.max(longestStreak, best);
  }

  const activeHabits = habits.filter((h) => h.status === 'active').length;

  return {
    completion_rate: scheduledTotal > 0 ? Math.round((completedTotal / scheduledTotal) * 100) : 0,
    completed: completedTotal,
    scheduled: scheduledTotal,
    longest_streak: longestStreak,
    average_current_streak: activeHabits > 0 ? Math.round(currentStreakSum / activeHabits) : 0,
    missed,
  };
}
