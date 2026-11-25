import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CompetencyKey, Note } from '@/lib/types';

interface NewNote {
  text: string;
  competency: CompetencyKey | null;
  is_key_result: boolean;
}

/**
 * Regular notes for one day. Action plan progress updates are stored in
 * the same table but belong to their plan card, so they are excluded here.
 */
export function useNotes(date: string) {
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('date', date)
      .is('action_plan_id', null)
      .order('created_at', { ascending: true });
    if (!error) setNotes((data ?? []) as Note[]);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const addNote = async (input: NewNote) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...input, date })
      .select()
      .single();
    if (error) throw error;
    setNotes((prev) => [...prev, data as Note]);
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, addNote, deleteNote };
}