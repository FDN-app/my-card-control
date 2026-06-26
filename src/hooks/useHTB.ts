import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getHoyArDate, formatYMD } from '@/lib/dateAR';

export interface HTBMaquina {
  id: string;
  user_id: string;
  nombre: string;
  dificultad: 'Easy' | 'Medium' | 'Hard' | 'Insane';
  sistema_operativo: 'Linux' | 'Windows';
  tecnicas: string | null;
  writeup_url: string | null;
  ip: string | null;
  notas: string | null;
  fecha_resolucion: string;
  created_at?: string;
}

export type HTBMaquinaInput = Omit<HTBMaquina, 'id' | 'user_id' | 'created_at'>;

export interface HTBConfig {
  id: string;
  user_id: string;
  maquinas_objetivo_semanal: number;
}

function getInicioFinSemanaAR(): { inicio: string; fin: string } {
  const hoy = getHoyArDate();
  const dia = hoy.getDay(); // 0=Dom … 6=Sáb
  const diasDesdeElLunes = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diasDesdeElLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: formatYMD(lunes), fin: formatYMD(domingo) };
}

export function useHTB() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ── Máquinas ─────────────────────────────────────────────────────────── */

  const { data: maquinas = [], isLoading: loadingMaquinas } = useQuery({
    queryKey: ['htb_maquinas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('htb_maquinas')
        .select('*')
        .eq('user_id', user!.id)
        .order('fecha_resolucion', { ascending: false });
      if (error) throw error;
      return data as HTBMaquina[];
    },
    enabled: !!user,
    retry: 1,
  });

  /* ── Config ───────────────────────────────────────────────────────────── */

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['htb_config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('htb_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as HTBConfig | null;
    },
    enabled: !!user,
    retry: 1,
  });

  const invalidateMaquinas = () =>
    queryClient.invalidateQueries({ queryKey: ['htb_maquinas', user?.id] });

  const invalidateConfig = () =>
    queryClient.invalidateQueries({ queryKey: ['htb_config', user?.id] });

  /* ── Conteo semanal (Argentina) ───────────────────────────────────────── */

  const { inicio, fin } = getInicioFinSemanaAR();
  const maquinasEstaSemana = maquinas.filter(
    m => m.fecha_resolucion >= inicio && m.fecha_resolucion <= fin,
  );

  /* ── Mutations ────────────────────────────────────────────────────────── */

  const crearMaquina = useMutation({
    mutationFn: async (input: HTBMaquinaInput) => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');
      const { data, error } = await supabase
        .from('htb_maquinas')
        .insert([{ ...input, user_id: authUser.id }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateMaquinas,
  });

  const actualizarMaquina = useMutation({
    mutationFn: async ({ id, ...input }: Partial<HTBMaquinaInput> & { id: string }) => {
      const { error } = await supabase
        .from('htb_maquinas')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateMaquinas,
  });

  const eliminarMaquina = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('htb_maquinas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateMaquinas,
  });

  const upsertConfig = useMutation({
    mutationFn: async (updates: { maquinas_objetivo_semanal: number }) => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');
      const { error } = await supabase
        .from('htb_config')
        .upsert({ user_id: authUser.id, ...updates }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: invalidateConfig,
  });

  return {
    maquinas,
    maquinasEstaSemana,
    config,
    loadingMaquinas,
    loadingConfig,
    crearMaquina: crearMaquina.mutateAsync,
    actualizarMaquina: actualizarMaquina.mutateAsync,
    eliminarMaquina: eliminarMaquina.mutateAsync,
    upsertConfig: upsertConfig.mutateAsync,
  };
}
