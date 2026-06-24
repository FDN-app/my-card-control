import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export interface ObjetivoMensual {
  id: string;
  user_id: string;
  mes: string; // 'YYYY-MM'
  apps_objetivo: number | null;
  apps_completadas: number;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export type ObjetivoInput = Omit<ObjetivoMensual, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

const mesActual = () => new Date().toISOString().slice(0, 7);

export function useObjetivos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: objetivo, isLoading } = useQuery({
    queryKey: ['objetivos_mensuales', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objetivos_mensuales')
        .select('*')
        .eq('user_id', user!.id)
        .eq('mes', mesActual())
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
        .upsert([{ mes: mesActual(), apps_completadas: 0, ...input, user_id: authUser.id }], { onConflict: 'user_id,mes' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const incrementarApp = useMutation({
    mutationFn: async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');

      const nuevasApps = (objetivo?.apps_completadas ?? 0) + 1;

      const { data, error } = await supabase
        .from('objetivos_mensuales')
        .upsert([{
          user_id: authUser.id,
          mes: mesActual(),
          apps_completadas: nuevasApps,
          apps_objetivo: objetivo?.apps_objetivo ?? null,
          descripcion: objetivo?.descripcion ?? null,
        }], { onConflict: 'user_id,mes' })
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
    incrementarApp: incrementarApp.mutateAsync,
    isPendingIncrement: incrementarApp.isPending,
  };
}
