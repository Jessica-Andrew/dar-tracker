import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

/**
 * Distinct task descriptions from the last 90 days, most recent first.
 * Fetched fresh each time the form opens, so a name you used yesterday
 * is already in the list today.
 */
export function useDescriptionSuggestions(enabled: boolean) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const since = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('tasks')
        .select('description, date')
        .gte('date', since)
        .order('date', { ascending: false })
        .limit(500);
      if (cancelled || error || !data) return;

      const seen = new Set<string>();
      const list: string[] = [];
      for (const row of data) {
        const name = row.description.trim();
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);
        list.push(name);
      }
      setSuggestions(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return suggestions;
}