import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';

/**
 * Done tasks between two ISO dates (inclusive). `refreshKey` is any
 * value that changes when the underlying data may have changed, so
 * the rollup refetches after you finish, edit, or move a task.
 */
export function useWeekTasks(startKey: string, endKey: string, refreshKey: unknown) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done')
        .gte('date', startKey)
        .lte('date', endKey);
      if (!cancelled && !error) setTasks((data ?? []) as Task[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [startKey, endKey, refreshKey]);

  return tasks;
}