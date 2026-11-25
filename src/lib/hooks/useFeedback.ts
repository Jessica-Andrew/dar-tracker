import { useEffect, useState } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Feedback, FeedbackArea, FeedbackSource } from '@/lib/types';

export interface NewFeedback {
  source: FeedbackSource;
  area: FeedbackArea;
  subject: string | null;
  comment: string;
  rating: string | null;
  needs_action: boolean;
}

/**
 * Feedback for the selected month (`entries`) plus the five months before
 * it (`history`), which feeds the rating trend table.
 */
export function useFeedback(month: Date) {
  const monthKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const windowStart = format(startOfMonth(subMonths(month, 5)), 'yyyy-MM-dd');
  const [history, setHistory] = useState<Feedback[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .gte('review_month', windowStart)
        .lte('review_month', monthKey)
        .order('created_at', { ascending: true });
      if (!cancelled && !error) setHistory((data ?? []) as Feedback[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [windowStart, monthKey]);

  const entries = history.filter((f) => f.review_month === monthKey);

  const addFeedback = async (input: NewFeedback) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert({ ...input, review_month: monthKey })
      .select()
      .single();
    if (error) throw error;
    setHistory((prev) => [...prev, data as Feedback]);
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (error) throw error;
    setHistory((prev) => prev.filter((f) => f.id !== id));
  };

  /** Turn a feedback entry into an action plan and link the two. */
  const createPlanFrom = async (f: Feedback) => {
    const title = f.comment.length > 140 ? `${f.comment.slice(0, 137)}...` : f.comment;
    const { data: plan, error } = await supabase
      .from('action_plans')
      .insert({ title })
      .select()
      .single();
    if (error) throw error;
    const { error: linkError } = await supabase
      .from('feedback')
      .update({ action_plan_id: plan.id })
      .eq('id', f.id);
    if (linkError) throw linkError;
    setHistory((prev) =>
      prev.map((x) => (x.id === f.id ? { ...x, action_plan_id: plan.id } : x)),
    );
  };

  return { history, entries, addFeedback, deleteFeedback, createPlanFrom };
}