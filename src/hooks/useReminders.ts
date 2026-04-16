import { useEffect, useRef, useCallback } from 'react';
import { Task, ReminderNotification } from '../lib/types';

interface UseRemindersOptions {
  tasks: Task[];
  onNotify: (notification: ReminderNotification) => void;
}

export function useReminders({ tasks, onNotify }: UseRemindersOptions) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notifiedRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const existingTimers = timersRef.current;
    existingTimers.forEach((timer) => clearTimeout(timer));
    existingTimers.clear();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    tasks.forEach((task) => {
      if (task.status === 'completed' || task.date !== today) return;

      const [startHour, startMin] = task.start_time.split(':').map(Number);
      const taskStart = new Date();
      taskStart.setHours(startHour, startMin, 0, 0);

      const fiveMinBefore = new Date(taskStart.getTime() - 5 * 60 * 1000);
      const tenMinBefore = new Date(taskStart.getTime() - 10 * 60 * 1000);

      const schedule = (triggerTime: Date, label: string, type: 'upcoming' | 'starting') => {
        const key = `${task.id}-${type}`;
        if (notifiedRef.current.has(key)) return;
        const delay = triggerTime.getTime() - now.getTime();
        if (delay <= 0) return;

        const timer = setTimeout(() => {
          notifiedRef.current.add(key);
          const notification: ReminderNotification = {
            id: crypto.randomUUID(),
            taskId: task.id,
            title: type === 'starting' ? 'Task Starting Soon!' : 'Upcoming Task',
            message: `"${task.title}" ${label}`,
            type,
          };
          onNotify(notification);
          sendBrowserNotification(notification.title, notification.message);
        }, delay);

        existingTimers.set(key, timer);
      };

      schedule(tenMinBefore, 'starts in 10 minutes', 'upcoming');
      schedule(fiveMinBefore, 'starts in 5 minutes', 'upcoming');
      schedule(taskStart, 'is starting now!', 'starting');
    });

    return () => {
      existingTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [tasks, onNotify, sendBrowserNotification]);
}
