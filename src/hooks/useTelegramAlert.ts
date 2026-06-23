import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTelegramAlert() {
  const [sending, setSending] = useState(false);

  // Devuelve true si el mensaje se envió, false si Telegram no está vinculado, lanza si hay error de red.
  const sendAlert = useCallback(async (tipo: string, detalle: string): Promise<boolean> => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('dynamic-action', {
        body: { tipo, detalle },
      });
      if (error) throw error;
      return data?.ok === true;
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendAlert };
}
