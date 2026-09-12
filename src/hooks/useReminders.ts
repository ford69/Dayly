import { useEffect, useRef, useCallback } from 'react';
import { Task, ReminderNotification } from '../lib/types';
import { todayString } from '../lib/utils';

interface UseRemindersOptions {
  tasks: Task[];
  onNotify: (notification: ReminderNotification) => void;
}

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function useReminders({ tasks, onNotify }: UseRemindersOptions) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notifiedRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback(
    (title: string, body: string, options?: { actions?: NotificationAction[]; data?: Record<string, string> }) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      if ('serviceWorker' in navigator) {
        void navigator.serviceWorker.ready.then((reg) => {
          void reg.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: options?.data ?? { url: '/?action=today' },
            // actions supported in SW-shown notifications
            actions: options?.actions,
          });
        });
        return;
      }

      new Notification(title, { body, icon: '/icons/icon-192.png' });
    },
    []
  );

  useEffect(() => {
    void requestPermission();
    void import('../lib/push').then(({ subscribeToPush }) => subscribeToPush()).catch(() => undefined);
  }, [requestPermission]);

  useEffect(() => {
    const existingTimers = timersRef.current;
    existingTimers.forEach((timer) => clearTimeout(timer));
    existingTimers.clear();

    const now = new Date();
    const today = todayString();
    const todayTasks = tasks.filter((t) => t.date === today);
    const pending = todayTasks.filter((t) => t.status === 'pending');
    const completed = todayTasks.filter((t) => t.status === 'completed');

    // Midday progress nudge (once)
    const progressKey = `progress-${today}`;
    if (!notifiedRef.current.has(progressKey) && completed.length >= 5 && pending.length > 0) {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      const delay = noon.getTime() - now.getTime();
      if (delay > 0 && delay < 12 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          notifiedRef.current.add(progressKey);
          const n: ReminderNotification = {
            id: crypto.randomUUID(),
            taskId: pending[0].id,
            title: `You've completed ${completed.length} tasks today 🔥`,
            message: `${pending.length} important task${pending.length === 1 ? '' : 's'} remain. View today's plan.`,
            type: 'smart',
          };
          onNotify(n);
          sendBrowserNotification(n.title, n.message, {
            actions: [
              { action: 'plan', title: "View today's plan" },
              { action: 'focus', title: 'Start Focus' },
            ],
            data: { url: '/?action=today' },
          });
        }, delay);
        existingTimers.set(progressKey, timer);
      }
    }

    // End-of-day review nudge
    const eodKey = `eod-${today}`;
    if (!notifiedRef.current.has(eodKey)) {
      const eod = new Date();
      eod.setHours(20, 0, 0, 0);
      const delay = eod.getTime() - now.getTime();
      if (delay > 0) {
        const timer = setTimeout(() => {
          notifiedRef.current.add(eodKey);
          const left = pending.length;
          const n: ReminderNotification = {
            id: crypto.randomUUID(),
            taskId: pending[0]?.id ?? '',
            title: 'End-of-day review',
            message:
              left > 0
                ? `${left} task${left === 1 ? '' : 's'} still open. Review your day in Dayly.`
                : 'Nice work — all tasks done. Open Dayly for your review.',
            type: 'smart',
          };
          onNotify(n);
          sendBrowserNotification(n.title, n.message, {
            actions: [{ action: 'plan', title: 'Review today' }],
            data: { url: '/?action=today' },
          });
        }, delay);
        existingTimers.set(eodKey, timer);
      }
    }

    pending.forEach((task) => {
      const [startHour, startMin] = task.start_time.split(':').map(Number);
      const taskStart = new Date();
      taskStart.setHours(startHour, startMin, 0, 0);

      const fifteenMinBefore = new Date(taskStart.getTime() - 15 * 60 * 1000);
      const tenMinBefore = new Date(taskStart.getTime() - 10 * 60 * 1000);
      const overdueCheck = new Date(taskStart.getTime() + 15 * 60 * 1000);
      const duration = durationLabel(task.start_time, task.end_time);

      const schedule = (
        triggerTime: Date,
        keySuffix: string,
        type: ReminderNotification['type'],
        title: string,
        message: string,
        actions?: NotificationAction[]
      ) => {
        const key = `${task.id}-${keySuffix}`;
        if (notifiedRef.current.has(key)) return;
        const delay = triggerTime.getTime() - now.getTime();
        if (delay <= 0) return;

        const timer = setTimeout(() => {
          notifiedRef.current.add(key);
          const notification: ReminderNotification = {
            id: crypto.randomUUID(),
            taskId: task.id,
            title,
            message,
            type,
          };
          onNotify(notification);
          sendBrowserNotification(title, message, {
            actions,
            data: { url: `/?action=today` },
          });
        }, delay);

        existingTimers.set(key, timer);
      };

      schedule(
        fifteenMinBefore,
        'upcoming-15',
        'upcoming',
        'Your next task starts in 15 minutes',
        `${task.title}${duration ? ` · ${duration}` : ''}`,
        [
          { action: 'focus', title: 'Start Focus' },
          { action: 'plan', title: "View plan" },
        ]
      );

      schedule(
        tenMinBefore,
        'upcoming-10',
        'upcoming',
        'Your next task starts in 10 minutes',
        `${task.title}${duration ? ` · ${duration}` : ''}`,
        [{ action: 'focus', title: 'Start Focus' }]
      );

      schedule(
        taskStart,
        'starting',
        'starting',
        'Task starting now',
        `${task.title} — time to begin.`,
        [{ action: 'focus', title: 'Start Focus' }]
      );

      if (task.priority === 'high') {
        schedule(
          overdueCheck,
          'behind',
          'smart',
          "You're falling behind",
          `Your ${task.start_time} task “${task.title}” hasn't been completed.`,
          [{ action: 'replan', title: 'Replan my day' }]
        );
      }
    });

    return () => {
      existingTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [tasks, onNotify, sendBrowserNotification]);
}
