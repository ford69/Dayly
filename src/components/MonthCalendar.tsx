import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { monthDates, todayString } from '../lib/utils';

interface MonthCalendarProps {
  selectedDate: string;
  onDateChange: (d: string) => void;
}

export function MonthCalendar({ selectedDate, onDateChange }: MonthCalendarProps) {
  const { state } = useTaskContext();
  const { tasks, darkMode } = state;

  const [year, month] = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return [y, m - 1];
  }, [selectedDate]);

  const weeks = monthDates(year, month);
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onDateChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onDateChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const taskCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.date, (map.get(t.date) ?? 0) + 1);
    return map;
  }, [tasks]);

  const today = todayString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100'}`}><ChevronLeft className="w-5 h-5" /></button>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{monthLabel}</h2>
        <button onClick={nextMonth} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100'}`}><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className={`text-xs font-semibold py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{d}</div>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const count = taskCountByDate.get(date) ?? 0;
          const isSelected = date === selectedDate;
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`aspect-square rounded-xl text-sm font-medium transition-colors flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? 'bg-blue-500 text-white'
                  : isToday
                  ? darkMode ? 'bg-gray-800 text-blue-400 ring-1 ring-blue-500' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-300'
                  : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>{Number(date.split('-')[2])}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-blue-500/20 text-blue-500'}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
