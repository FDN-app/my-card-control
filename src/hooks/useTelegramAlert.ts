import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTelegramAlert() {
  const [sending, setSending] = useState(false);

  const sendAlert = useCallback(async (tipo: string, detalle: string) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-telegram', {
        body: { tipo, detalle },
      });
      if (error) throw error;
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendAlert };
}
