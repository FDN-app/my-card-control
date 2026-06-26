import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getHoyArDate } from '@/lib/dateAR';

export interface ObjetivoMensual {
  id: string;
  user_id: string;
  mes: number;   // 1-12
  anio: number;  // e.g. 2026
  apps_objetivo: number | null;
  apps_completadas: number;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export type ObjetivoInput = Omit<ObjetivoMensual, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

const getMesAnioActual = () => {
  const arNow = getHoyArDate();
  return { mes: arNow.getMonth() + 1, anio: arNow.getFullYear() };
};

export function useObjetivos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { mes, anio } = getMesAnioActual();

  const { data: objetivo, isLoading } = useQuery({
    queryKey: ['objetivos_mensuales', user?.id, mes, anio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objetivos_mensuales')
        .select('*')
        .eq('user_id', user!.id)
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();
      if (error) throw error;
      return data as ObjetivoMensual | null;
    },
    enabled: !!user,
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['objetivos_mensuales', user?.id] });

  const upsertObjetivo = useMutation({
    mutationFn: async (input: Partial<ObjetivoInput>) => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('objetivos_mensuales')
        .upsert(
          [{ mes, anio, apps_completadas: 0, ...input, user_id: authUser.id }],
          { onConflict: 'user_id,mes,anio' },
        )
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  return {
    objetivo,
    isLoading,
    upsertObjetivo: upsertObjetivo.mutateAsync,
  };
}
