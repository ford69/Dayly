import { Task } from '../lib/types';
import { TaskCard } from './TaskCard';
import { useTaskContext } from '../context/TaskContext';
import { formatDate } from '../lib/utils';

interface AgendaViewProps {
  selectedDate: string;
  onEdit: (task: Task) => void;
}

export function AgendaView({ selectedDate, onEdit }: AgendaViewProps) {
  const { state } = useTaskContext();
  const { tasks, darkMode } = state;

  const grouped = tasks
    .filter((t) => t.date >= selectedDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .reduce<Record<string, Task[]>>((acc, t) => {
      (acc[t.date] ??= []).push(t);
      return acc;
    }, {});

  const dates = Object.keys(grouped).slice(0, 14);

  if (dates.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed p-10 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No upcoming tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <h3 className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(date)}</h3>
          <div className="space-y-2">
            {grouped[date].map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
