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

  const saveConfig = async (patch: Partial<Omit<ClockifyConfig, 'user_id' | 'updated_at'>>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) throw new Error('not_signed_in');
    const payload: ClockifyConfig = {
      user_id,
      workspace_id: patch.workspace_id ?? null,
      clockify_user_id: patch.clockify_user_id ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('clockify_config')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    setConfig(data);
  };

  return { config, loading, saveConfig };
}