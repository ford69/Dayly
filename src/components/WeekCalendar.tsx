import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../lib/types';
import { useTaskContext } from '../context/TaskContext';
import { weekDates, addDays, formatShortDate, formatTime, startOfWeek, detectOverlaps } from '../lib/utils';

interface WeekCalendarProps {
  selectedDate: string;
  onDateChange: (d: string) => void;
  onEdit: (task: Task) => void;
}

export function WeekCalendar({ selectedDate, onDateChange, onEdit }: WeekCalendarProps) {
  const { state, updateTask, fetchTasks } = useTaskContext();
  const { tasks, darkMode } = state;
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate));
  const [dragging, setDragging] = useState<string | null>(null);

  const days = weekDates(weekStart);
  const from = days[0];
  const to = days[6];

  const weekTasks = tasks.filter((t) => t.date >= from && t.date <= to);
  const overlaps = detectOverlaps(weekTasks);

  const handleDragStart = (taskId: string) => setDragging(taskId);
  const handleDrop = async (date: string) => {
    if (!dragging) return;
    const task = tasks.find((t) => t.id === dragging);
    if (task && task.date !== date) {
      await updateTask(task.id, { date });
      await fetchTasks({ from, to });
    }
    setDragging(null);
  };

  const priorityBg = (p: string) =>
    p === 'high' ? 'bg-red-500/80' : p === 'medium' ? 'bg-amber-500/80' : 'bg-emerald-500/80';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {formatShortDate(from)} – {formatShortDate(to)}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const dayTasks = weekTasks.filter((t) => t.date === date);
          const isSelected = date === selectedDate;
          return (
            <div
              key={date}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(date)}
              onClick={() => onDateChange(date)}
              className={`min-h-[200px] rounded-2xl border p-2 transition-colors cursor-pointer ${
                isSelected
                  ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                  : darkMode ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <p className={`text-xs font-bold mb-2 text-center ${isSelected ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatShortDate(date).split(',')[0]}
              </p>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className={`text-xs px-2 py-1 rounded-lg text-white truncate cursor-grab active:cursor-grabbing ${priorityBg(task.priority)} ${task.status === 'completed' ? 'opacity-50 line-through' : ''} ${overlaps.has(task.id) ? 'ring-2 ring-amber-400' : ''}`}
                    title={`${task.title} (${formatTime(task.start_time)})`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
