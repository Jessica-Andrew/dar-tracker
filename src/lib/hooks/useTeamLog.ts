import { useEffect, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { TeamLogEntry, TeamLogKind } from '@/lib/types';

export interface NewTeamLogEntry {
  date: string;
  kind: TeamLogKind;
  title: string;
  detail: string | null;
}

/** Team log entries for one month, newest first. */
export function useTeamLog(month: Date) {
  const startKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const endKey = format(endOfMonth(month), 'yyyy-MM-dd');
  const [entries, setEntries] = useState<TeamLogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('team_log')
        .select('*')
        .gte('date', startKey)
        .lte('date', endKey)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!cancelled && !error) setEntries((data ?? []) as TeamLogEntry[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [startKey, endKey]);

  const addEntry = async (input: NewTeamLogEntry) => {
    const { data, error } = await supabase
      .from('team_log')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    const created = data as TeamLogEntry;
    // An entry dated outside the viewed month shows up once you go there.
    if (created.date >= startKey && created.date <= endKey) {
      setEntries((prev) =>
        [...prev, created].sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
        ),
      );
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('team_log').delete().eq('id', id);
    if (error) throw error;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, addEntry, deleteEntry };
}