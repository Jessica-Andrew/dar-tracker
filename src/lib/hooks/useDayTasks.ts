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
      .order('position', { ascending: true });
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

    // Slot the new task at the end of its status group (seedlings or
    // harvested) rather than always at position 0, so newly planted
    // or imported tasks land after whatever's already there.
    const sameGroup = tasks.filter(
      (t) => t.date === (partial.date ?? date) && t.status === partial.status,
    );
    const nextPosition =
      sameGroup.length > 0 ? Math.max(...sameGroup.map((t) => t.position)) + 1 : 0;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...partial, user_id, position: nextPosition })
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

  /**
   * Persist a new drag order for one status group (seedlings or
   * harvested). `orderedIds` is the full list of task ids in that
   * group, in their new order — each gets its array index as its
   * new position.
   *
   * Updates local state immediately (the drag library already shows
   * the new order optimistically), then writes each new position to
   * Supabase. If a write fails partway, we reload from the server to
   * recover a consistent state rather than leaving things half-synced.
   */
  const reorderTasks = async (orderedIds: string[]) => {
    setTasks((prev) => {
      const positionById = new Map(orderedIds.map((id, i) => [id, i]));
      return prev
        .map((t) =>
          positionById.has(t.id) ? { ...t, position: positionById.get(t.id)! } : t,
        )
        .sort((a, b) => a.position - b.position);
    });

    try {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('tasks').update({ position: i }).eq('id', id),
        ),
      );
    } catch {
      void load();
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    reload: load,
  };
}