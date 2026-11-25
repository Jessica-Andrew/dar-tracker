import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActionPlan, Note } from '@/lib/types';

/** Active action plans plus every progress update linked to them. */
export function useActionPlans() {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [progress, setProgress] = useState<Note[]>([]);

  const load = useCallback(async () => {
    const { data: planData, error: planError } = await supabase
      .from('action_plans')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true });
    if (planError) return;

    const list = (planData ?? []) as ActionPlan[];
    setPlans(list);
    if (list.length === 0) {
      setProgress([]);
      return;
    }

    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .in('action_plan_id', list.map((p) => p.id))
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!noteError) setProgress((noteData ?? []) as Note[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPlan = async (title: string) => {
    const { data, error } = await supabase
      .from('action_plans')
      .insert({ title })
      .select()
      .single();
    if (error) throw error;
    setPlans((prev) => [...prev, data as ActionPlan]);
  };

  const archivePlan = async (id: string) => {
    const { error } = await supabase
      .from('action_plans')
      .update({ archived: true })
      .eq('id', id);
    if (error) throw error;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setProgress((prev) => prev.filter((n) => n.action_plan_id !== id));
  };

  const addProgress = async (planId: string, date: string, text: string) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ text, date, action_plan_id: planId })
      .select()
      .single();
    if (error) throw error;
    setProgress((prev) => [data as Note, ...prev]);
  };

  const deleteProgress = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    setProgress((prev) => prev.filter((n) => n.id !== id));
  };

  return { plans, progress, addPlan, archivePlan, addProgress, deleteProgress };
}