import { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Task } from '../lib/types';
import { useTaskContext } from '../context/TaskContext';

interface FocusModeProps {
  onClose: () => void;
}

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function FocusMode({ onClose }: FocusModeProps) {
  const { state, logFocusSession, toggleStatus } = useTaskContext();
  const { tasks } = state;
  const pendingToday = tasks.filter((t) => t.status === 'pending' && !t.blocked);

  const [selectedTask, setSelectedTask] = useState<Task | null>(pendingToday[0] ?? null);
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          if (!onBreak) {
            setSessionsCompleted((c) => c + 1);
            if (selectedTask) logFocusSession(selectedTask.id, WORK_SECONDS);
            setOnBreak(true);
            return BREAK_SECONDS;
          }
          setOnBreak(false);
          return WORK_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, onBreak, selectedTask, logFocusSession]);

  const reset = useCallback(() => {
    setRunning(false);
    setOnBreak(false);
    setSecondsLeft(WORK_SECONDS);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = onBreak
    ? ((BREAK_SECONDS - secondsLeft) / BREAK_SECONDS) * 100
    : ((WORK_SECONDS - secondsLeft) / WORK_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white">
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <p className="text-white/50 text-sm uppercase tracking-widest font-semibold">
            {onBreak ? 'Break Time' : 'Focus Mode'}
          </p>
          <h2 className="text-white text-2xl font-bold mt-2">
            {selectedTask ? selectedTask.title : 'Select a task'}
          </h2>
        </div>

        <div className="relative w-56 h-56 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={onBreak ? '#34d399' : '#3b82f6'}
              strokeWidth="4"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-mono font-bold text-white">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRunning(!running)}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          {selectedTask && (
            <button
              onClick={() => { toggleStatus(selectedTask); onClose(); }}
              className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-emerald-500/30"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-white/40 text-sm">{sessionsCompleted} pomodoro{sessionsCompleted !== 1 ? 's' : ''} completed</p>

        {pendingToday.length > 1 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingToday.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${
                  selectedTask?.id === t.id ? 'bg-blue-500/30 text-blue-300' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
