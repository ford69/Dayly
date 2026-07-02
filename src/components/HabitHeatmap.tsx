import { useEffect, useState } from 'react';
import { HabitHeatmapCell } from '../lib/types';
import { addDays, todayString } from '../lib/utils';

const LEVEL_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const LEVEL_COLORS_DARK = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

interface HabitHeatmapProps {
  cells: HabitHeatmapCell[];
  darkMode: boolean;
}

export function HabitHeatmap({ cells, darkMode }: HabitHeatmapProps) {
  const colors = darkMode ? LEVEL_COLORS_DARK : LEVEL_COLORS;
  const weeks: HabitHeatmapCell[][] = [];
  let week: HabitHeatmapCell[] = [];

  for (const cell of cells) {
    week.push(cell);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.value}${cell.scheduled ? '' : ' (rest)'}`}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: cell.scheduled ? colors[cell.level] : colors[0], opacity: cell.scheduled ? 1 : 0.3 }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Last {cells.length} days — darker = more progress
      </p>
    </div>
  );
}

interface HabitHeatmapLoaderProps {
  habitId: string;
  darkMode: boolean;
  fetchHeatmap: (id: string, from?: string, to?: string) => Promise<HabitHeatmapCell[]>;
}

export function HabitHeatmapLoader({ habitId, darkMode, fetchHeatmap }: HabitHeatmapLoaderProps) {
  const [cells, setCells] = useState<HabitHeatmapCell[]>([]);

  useEffect(() => {
    const to = todayString();
    const from = addDays(to, -84);
    void fetchHeatmap(habitId, from, to).then(setCells);
  }, [habitId, fetchHeatmap]);

  if (cells.length === 0) return null;
  return <HabitHeatmap cells={cells} darkMode={darkMode} />;
}
