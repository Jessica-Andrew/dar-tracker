import { useEffect, useState } from 'react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { ActionPlan, Feedback, Note, Task, TeamLogEntry } from '@/lib/types';

interface MonthData {
  tasks: Task[];
  notes: Note[];
  plans: ActionPlan[];
  feedback: Feedback[];
  teamLog: TeamLogEntry[];
}

/**
 * Finished tasks, notes (including plan updates), all action plans,
 * review feedback, and team log entries for a month. Feedback also
 * includes the month before, since that review is what the current
 * month's work responds to. Only fetches while `enabled`, and refetches
 * each time it turns on.
 */
export function useMonthData(startKey: string, endKey: string, enabled: boolean) {
  const [data, setData] = useState<MonthData>({
    tasks: [],
    notes: [],
    plans: [],
    feedback: [],
    teamLog: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    const prevMonthKey = format(startOfMonth(subMonths(parseISO(startKey), 1)), 'yyyy-MM-dd');
    (async () => {
      const [tasksRes, notesRes, plansRes, feedbackRes, teamRes] = await Promise.all([
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
        supabase
          .from('feedback')
          .select('*')
          .gte('review_month', prevMonthKey)
          .lte('review_month', endKey)
          .order('created_at', { ascending: true }),
        supabase
          .from('team_log')
          .select('*')
          .gte('date', startKey)
          .lte('date', endKey)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setData({
        tasks: (tasksRes.data ?? []) as Task[],
        notes: (notesRes.data ?? []) as Note[],
        plans: (plansRes.data ?? []) as ActionPlan[],
        feedback: (feedbackRes.data ?? []) as Feedback[],
        teamLog: (teamRes.data ?? []) as TeamLogEntry[],
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [startKey, endKey, enabled]);

  return { ...data, loading };
}