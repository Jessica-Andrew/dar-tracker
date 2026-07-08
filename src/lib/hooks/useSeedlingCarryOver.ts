import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

/**
 * Once per app load, roll any unstarted seedlings from past days
 * forward onto today's date. A seedling that's currently running
 * (has an active Clockify entry) is left alone — its clock is
 * ticking against a specific day and shouldn't be silently moved
 * out from under it.
 *
 * This is idempotent: once a seedling's date is today, it no longer
 * matches the "date < today" filter, so running this on every app
 * load is harmless — it only ever does work the first time each day.
 */
export function useSeedlingCarryOver(onCarriedOver: () => void) {
  // Keep the latest callback without making it a dependency — this
  // effect should run exactly once per app load, not every time the
  // caller's callback identity changes.
  const callbackRef = useRef(onCarriedOver);
  useEffect(() => {
    callbackRef.current = onCarriedOver;
  }, [onCarriedOver]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) return;

      const todayKey = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('tasks')
        .update({ date: todayKey })
        .eq('user_id', user_id)
        .eq('status', 'planned')
        .is('active_entry_id', null)
        .lt('date', todayKey)
        .select('id');

      if (!error && data && data.length > 0) {
        callbackRef.current();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}