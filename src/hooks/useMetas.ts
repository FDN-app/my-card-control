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
  dieta_calorias_objetivo: number | null;
  dieta_realizado: boolean;
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
      if (error) throw error;
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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('metas_diarias')
        .upsert([{ ...input, user_id: authUser.id }], { onConflict: 'user_id,fecha' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateMeta = useMutation({
    mutationFn: async ({ id, ...input }: Partial<MetaDiariaInput> & { id: string }) => {
      const { error } = await supabase
        .from('metas_diarias')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleRealizado = useMutation({
    mutationFn: async ({
      id,
      campo,
      valor,
    }: { id: string; campo: 'uber_realizado' | 'gym_realizado' | 'estudio_realizado' | 'dieta_realizado'; valor: boolean }) => {
      const { error } = await supabase
        .from('metas_diarias')
        .update({ [campo]: valor, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMeta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_diarias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
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
