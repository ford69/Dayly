import { useEffect, useRef, useState } from 'react';
import { Task } from '../lib/types';
import { formatTime, timeToMinutes, detectOverlaps, getCurrentTimeMinutes } from '../lib/utils';
import { useTaskContext } from '../context/TaskContext';

interface TimelineProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

function timeToY(time: string): number {
  const mins = timeToMinutes(time);
  const startMins = START_HOUR * 60;
  return ((mins - startMins) / 60) * HOUR_HEIGHT;
}

function durationToHeight(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max((diff / 60) * HOUR_HEIGHT, 28);
}

interface TimelineTaskProps {
  task: Task;
  hasOverlap: boolean;
  onEdit: (task: Task) => void;
  darkMode: boolean;
}

function TimelineTask({ task, hasOverlap, onEdit, darkMode }: TimelineTaskProps) {
  const top = timeToY(task.start_time);
  const height = durationToHeight(task.start_time, task.end_time);
  const completed = task.status === 'completed';

  const priorityLeft = task.priority === 'high' ? 'border-l-red-500' : task.priority === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500';

  return (
    <div
      className={`absolute left-0 right-2 rounded-r-xl border-l-4 px-2.5 py-1.5 cursor-pointer group transition-all duration-200 overflow-hidden
        ${priorityLeft}
        ${completed
          ? darkMode ? 'bg-gray-700/50 opacity-50' : 'bg-gray-100 opacity-50'
          : hasOverlap
          ? darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'
          : darkMode ? 'bg-gray-700/80 border border-gray-600 hover:bg-gray-700' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
        }
        hover:-translate-x-px
      `}
      style={{ top, height, minHeight: 28 }}
      onClick={() => onEdit(task)}
    >
      <p className={`text-xs font-semibold leading-tight truncate ${
        completed ? (darkMode ? 'text-gray-500 line-through' : 'text-gray-400 line-through') : darkMode ? 'text-white' : 'text-gray-800'
      }`}>
        {task.title}
      </p>
      {height > 40 && (
        <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {formatTime(task.start_time)} – {formatTime(task.end_time)}
        </p>
      )}
    </div>
  );
}

export function Timeline({ tasks, onEdit }: TimelineProps) {
  const { state } = useTaskContext();
  const { darkMode } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentY, setCurrentY] = useState<number>(0);
  const overlaps = detectOverlaps(tasks);

  useEffect(() => {
    const update = () => {
      const now = getCurrentTimeMinutes();
      const startMins = START_HOUR * 60;
      if (now >= startMins) {
        setCurrentY(((now - startMins) / 60) * HOUR_HEIGHT);
      }
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (containerRef.current && currentY > 0) {
      containerRef.current.scrollTo({ top: currentY - 200, behavior: 'smooth' });
    }
  }, [currentY]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto rounded-2xl border ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
      }`}
      style={{ height: '100%', maxHeight: '75vh' }}
    >
      <div
        className="relative"
        style={{ height: HOUR_HEIGHT * HOURS.length + 32, minWidth: 300 }}
      >
        {HOURS.map((hour) => {
          const y = (hour - START_HOUR) * HOUR_HEIGHT;
          const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top: y }}>
              <div className="flex items-center gap-3 pl-3 pr-4">
                <span className={`text-xs font-medium w-12 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {label}
                </span>
                <div className={`flex-1 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`} />
              </div>
            </div>
          );
        })}

        {currentY > 0 && (
          <div
            className="absolute left-0 right-0 z-10 flex items-center gap-2 pl-2"
            style={{ top: currentY }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-md shadow-blue-500/50" />
            <div className="flex-1 border-t-2 border-blue-500 border-dashed" />
          </div>
        )}

        <div className="absolute left-16 right-0 top-0 bottom-0">
          {tasks.map((task) => (
            <TimelineTask
              key={task.id}
              task={task}
              hasOverlap={overlaps.has(task.id)}
              onEdit={onEdit}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
