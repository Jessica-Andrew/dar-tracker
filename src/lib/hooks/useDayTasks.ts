import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NewTask, Task } from '@/lib/types';

/**
 * Load and mutate the current user's tasks for a specific ISO date.
 * RLS on the tasks table ensures we only see our own rows.
 *
 * Every task now carries its own `date` (set by the form, defaulting
 * to whichever day is currently being viewed) — the hook no longer
 * silently injects the loaded date, since a task can be planted
 * directly onto a different day than the one you're viewing.
 */
export type AddTaskInput = NewTask;

export function useDayTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });
    if (error) setError(error);
    else {
      // Supabase reports `source` as a plain string (it's a text column,
      // not a Postgres enum). We know our own writes only ever use one
      // of the three TaskSource values, so this narrows it back.
      setTasks((data ?? []) as Task[]);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTask = async (partial: AddTaskInput) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) throw new Error('not_signed_in');

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...partial, user_id })
      .select()
      .single();
    if (error) throw error;

    const inserted = data as Task;
    // Only show it in this list if it was actually planted on the
    // day currently loaded — it may have been planted directly onto
    // a different date.
    if (inserted.date === date) {
      setTasks((prev) => [...prev, inserted]);
    }
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const updated = data as Task;
    setTasks((prev) => {
      // If the edit moved this task off the currently loaded date,
      // it no longer belongs in this list — drop it rather than
      // showing a task whose date doesn't match the view.
      if (updated.date !== date) {
        return prev.filter((t) => t.id !== id);
      }
      return prev.map((t) => (t.id === id ? updated : t));
    });
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, error, addTask, updateTask, deleteTask, reload: load };
}