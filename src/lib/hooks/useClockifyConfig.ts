import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ClockifyConfig } from '@/lib/database.types';

export function useClockifyConfig() {
  const [config, setConfig] = useState<ClockifyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('clockify_config')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();
      if (!cancelled) {
        setConfig(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveConfig = async (patch: Partial<ClockifyConfig>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) throw new Error('not_signed_in');
    const { data, error } = await supabase
      .from('clockify_config')
      .upsert({ user_id, ...patch, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    setConfig(data);
  };

  return { config, loading, saveConfig };
}
