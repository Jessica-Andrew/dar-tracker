import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActionPlan, Note, Task } from '@/lib/types';

interface MonthData {
  tasks: Task[];
  notes: Note[];
  plans: ActionPlan[];
}

/**
 * Finished tasks, notes (including plan updates), and all action plans
 * for a date range. Only fetches while `enabled`, and refetches each
 * time it turns on, so the digest is always fresh when you open it.
 */
export function useMonthData(startKey: string, endKey: string, enabled: boolean) {
  const [data, setData] = useState<MonthData>({ tasks: [], notes: [], plans: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [tasksRes, notesRes, plansRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('status', 'done')
          .gte('date', startKey)
          .lte('date', endKey),
        supabase
          .from('notes')
          .select('*')
          .gte('date', startKey)
          .lte('date', endKey)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('action_plans')
          .select('*')
          .order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setData({
        tasks: (tasksRes.data ?? []) as Task[],
        notes: (notesRes.data ?? []) as Note[],
        plans: (plansRes.data ?? []) as ActionPlan[],
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [startKey, endKey, enabled]);

  return { ...data, loading };
}