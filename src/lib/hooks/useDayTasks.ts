import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NewTask, Task } from '@/lib/database.types';

/**
 * Load and mutate the current user's tasks for a specific ISO date.
 * RLS on the tasks table ensures we only see our own rows.
 */
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
    else setTasks(data ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTask = async (partial: Omit<NewTask, 'date'>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) throw new Error('not_signed_in');

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...partial, date, user_id })
      .select()
      .single();
    if (error) throw error;
    setTasks((prev) => [...prev, data]);
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, error, addTask, updateTask, deleteTask, reload: load };
}
