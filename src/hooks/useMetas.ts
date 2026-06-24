import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export interface MetaDiaria {
  id: string;
  user_id: string;
  fecha: string;
  uber_horas_objetivo: number | null;
  uber_facturacion_minima: number | null;
  uber_realizado: boolean;
  gym_horas: number | null;
  gym_tipo: string | null;
  gym_realizado: boolean;
  estudio_horas: number | null;
  estudio_tema: string | null;
  estudio_realizado: boolean;
  energia_nivel: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type MetaDiariaInput = Omit<MetaDiaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useMetas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ['metas_diarias', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_diarias')
        .select('*')
        .eq('user_id', user!.id)
        .order('fecha', { ascending: false });
      if (error) {
        console.error('[useMetas] Error Supabase query:', error);
        throw error;
      }
      console.log('[useMetas] query ok, rows:', data?.length);
      return data as MetaDiaria[];
    },
    enabled: !!user,
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['metas_diarias', user?.id] });

  const getMeta = (fecha: string) => metas.find(m => m.fecha === fecha) ?? null;

  const createMeta = useMutation({
    mutationFn: async (input: MetaDiariaInput) => {
      console.log('[useMetas] Starting createMeta mutation');
      console.log('[useMetas] hook user:', user?.id ?? 'NULL — consultando supabase.auth.getUser()');

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('[useMetas] getUser failed:', authError);
        throw new Error('No authenticated user');
      }
      console.log('[useMetas] authUser.id:', authUser.id);

      const payload = { ...input, user_id: authUser.id };
      console.log('[useMetas] payload to upsert (check column names match table):', payload);

      const { data, error } = await supabase
        .from('metas_diarias')
        .upsert([payload], { onConflict: 'user_id,fecha' })
        .select();
      if (error) {
        console.error('[useMetas] Error Supabase createMeta:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('[useMetas] Upsert response:', data);
      invalidate();
    },
    onError: (error: any) => {
      console.error('[useMetas] Mutation error:', error.message, error.code);
    },
  });

  const updateMeta = useMutation({
    mutationFn: async ({ id, ...input }: Partial<MetaDiariaInput> & { id: string }) => {
      console.log('[useMetas] updateMeta id:', id, 'input:', input);
      const { error } = await supabase
        .from('metas_diarias')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error('[useMetas] Error Supabase updateMeta:', error);
        throw error;
      }
    },
    onSuccess: invalidate,
    onError: (err) => {
      console.error('[useMetas] updateMeta onError:', err);
    },
  });

  const toggleRealizado = useMutation({
    mutationFn: async ({
      id,
      campo,
      valor,
    }: { id: string; campo: 'uber_realizado' | 'gym_realizado' | 'estudio_realizado'; valor: boolean }) => {
      const { error } = await supabase
        .from('metas_diarias')
        .update({ [campo]: valor, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error('[useMetas] Error Supabase toggleRealizado:', error);
        throw error;
      }
    },
    onSuccess: invalidate,
    onError: (err) => {
      console.error('[useMetas] toggleRealizado onError:', err);
    },
  });

  const deleteMeta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_diarias').delete().eq('id', id);
      if (error) {
        console.error('[useMetas] Error Supabase deleteMeta:', error);
        throw error;
      }
    },
    onSuccess: invalidate,
    onError: (err) => {
      console.error('[useMetas] deleteMeta onError:', err);
    },
  });

  return {
    metas,
    isLoading,
    getMeta,
    createMeta: createMeta.mutateAsync,
    updateMeta: updateMeta.mutateAsync,
    toggleRealizado: toggleRealizado.mutateAsync,
    deleteMeta: deleteMeta.mutateAsync,
  };
}
