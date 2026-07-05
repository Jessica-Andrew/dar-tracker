import { useEffect, useState } from 'react';
import { startTimer, stopTimer, ClockifyError } from '@/lib/clockify';
import type { Task } from '@/lib/types';

interface Options {
  tasks: Task[];
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  workspaceId: string | null;
  clockifyUserId: string | null;
}

export function useTaskTimer({ tasks, updateTask, workspaceId, clockifyUserId }: Options) {
  const running = tasks.find((t) => !!t.active_entry_id) ?? null;
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Tick once a second while something is running, so elapsed time
  // updates live without polling Clockify.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running?.id]);

  const elapsedSeconds = running?.timer_started_at
    ? Math.max(0, Math.floor((now - new Date(running.timer_started_at).getTime()) / 1000))
    : 0;

  // Stop the clock and fold this session's time into the task's
  // accumulated hours. Does NOT change status — pausing keeps a task
  // as a seedling, resumable at any time.
  const pause = async (task: Task) => {
    if (!workspaceId || !clockifyUserId) throw new ClockifyError('not_signed_in');
    const { hours: sessionHours } = await stopTimer(workspaceId, clockifyUserId);
    const totalHours = Math.round((task.hours + sessionHours) * 100) / 100;
    await updateTask(task.id, {
      hours: totalHours,
      active_entry_id: null,
      timer_started_at: null,
    });
  };

  const start = async (task: Task) => {
    if (!workspaceId) {
      setError('clockify_not_configured');
      return;
    }
    setError(null);
    setPending(true);
    try {
      // Clockify only allows one running timer per account. Pause
      // whatever's currently running first so our records and
      // Clockify's stay in sync.
      if (running && running.id !== task.id) {
        await pause(running);
      }
      const { id } = await startTimer(workspaceId, task.description);
      await updateTask(task.id, {
        active_entry_id: id,
        timer_started_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof ClockifyError ? e.code : 'unknown_error');
    } finally {
      setPending(false);
    }
  };

  const toggle = (task: Task) => {
    setError(null);
    if (task.active_entry_id) {
      setPending(true);
      void pause(task)
        .catch((e) => setError(e instanceof ClockifyError ? e.code : 'unknown_error'))
        .finally(() => setPending(false));
    } else {
      void start(task);
    }
  };

  // Mark a task done using whatever hours it's accumulated. If it's
  // currently running, pause it first to capture that last session.
  const finish = async (task: Task) => {
    setError(null);
    setPending(true);
    try {
      if (task.active_entry_id) {
        await pause(task);
      }
      await updateTask(task.id, { status: 'done' });
    } catch (e) {
      setError(e instanceof ClockifyError ? e.code : 'unknown_error');
    } finally {
      setPending(false);
    }
  };

  return {
    runningTaskId: running?.id ?? null,
    elapsedSeconds,
    toggle,
    finish,
    pending,
    error,
  };
}