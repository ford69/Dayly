import { useRef, useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { TodaySummary, Task } from '../lib/types';
import { formatDate, formatTime } from '../lib/utils';

interface ShareDayPlanProps {
  summary: TodaySummary;
  tasks: Task[];
  darkMode: boolean;
  onClose: () => void;
}

function buildShareText(summary: TodaySummary, tasks: Task[]): string {
  const lines = [
    `📅 My Dayly plan — ${formatDate(summary.date)}`,
    '',
    `🔥 ${summary.streak}-day streak · ${summary.productivity_score}% productivity`,
    `${summary.tasks_completed}/${summary.tasks_total} tasks done`,
    '',
    'Today:',
    ...tasks.map((t) => `• ${formatTime(t.start_time)} ${t.title}${t.priority === 'high' ? ' ⚡' : ''}`),
    '',
    'Plan your day at Dayly',
  ];
  return lines.join('\n');
}

export function ShareDayPlan({ summary, tasks, darkMode, onClose }: ShareDayPlanProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(summary, tasks);

  const copyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    const el = cardRef.current;
    if (!el) return;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, { backgroundColor: darkMode ? '#111827' : '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `dayly-${summary.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      await copyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
          <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Share your day plan</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            ref={cardRef}
            className={`rounded-2xl p-5 border ${
              darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Dayly
            </p>
            <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDate(summary.date)}
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              🔥 {summary.streak}-day streak · {summary.productivity_score}% score
            </p>
            <ul className="mt-4 space-y-2">
              {tasks.slice(0, 8).map((t) => (
                <li key={t.id} className={`text-sm flex gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  <span className={`shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(t.start_time)}
                  </span>
                  <span>{t.title}</span>
                  {t.priority === 'high' && <span>⚡</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void copyText()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${
                darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
            <button
              onClick={() => void downloadImage()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Download className="w-4 h-4" />
              Save image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
