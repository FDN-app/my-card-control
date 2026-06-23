import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_POLL_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

export function useTelegram() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // undefined = cargando, null = no vinculado, string = chat_id vinculado
  const [chatIdVinculado, setChatIdVinculado] = useState<string | null | undefined>(undefined);
  const [codigoActivo, setCodigoActivo] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartRef = useRef<number>(0);

  const verificarVinculacion = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('configuracion_usuario')
      .select('telegram_chat_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.telegram_chat_id ?? null;
  }, [user]);

  // Carga inicial del estado de vinculación
  useEffect(() => {
    if (!user) { setChatIdVinculado(null); return; }
    verificarVinculacion().then(chatId => setChatIdVinculado(chatId));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const detenerPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    setCodigoActivo(null);
  }, []);

  const generarCodigoVinculacion = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('No autenticado');
    const codigo = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    const { error } = await supabase
      .from('telegram_vinculaciones')
      .insert({ user_id: user.id, codigo });
    if (error) throw error;
    setCodigoActivo(codigo);
    return codigo;
  }, [user]);

  const iniciarPolling = useCallback((onVinculado: (chatId: string) => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingStartRef.current = Date.now();
    setPolling(true);

    pollingRef.current = setInterval(async () => {
      if (Date.now() - pollingStartRef.current >= MAX_POLL_MS) {
        detenerPolling();
        return;
      }
      const chatId = await verificarVinculacion();
      if (chatId) {
        setChatIdVinculado(chatId);
        queryClient.invalidateQueries({ queryKey: ['configuracion', user?.id] });
        detenerPolling();
        onVinculado(chatId);
      }
    }, POLL_INTERVAL_MS);
  }, [verificarVinculacion, detenerPolling, queryClient, user?.id]);

  const desvincularTelegram = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('configuracion_usuario')
      .update({ telegram_chat_id: null })
      .eq('user_id', user.id);
    if (error) throw error;
    setChatIdVinculado(null);
    queryClient.invalidateQueries({ queryKey: ['configuracion', user?.id] });
  }, [user, queryClient]);

  // Limpiar el intervalo al desmontar el componente
  useEffect(() => () => detenerPolling(), [detenerPolling]);

  return {
    chatIdVinculado,
    codigoActivo,
    polling,
    generarCodigoVinculacion,
    iniciarPolling,
    detenerPolling,
    desvincularTelegram,
  };
}
