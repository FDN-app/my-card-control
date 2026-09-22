import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getHoyArgentina } from '@/lib/dateAR';

export type AlimentacionDiaria = {
  id: string;
  user_id: string;
  fecha: string;
  menu: 1 | 2 | 3;
  comidas_completadas: number[];
  created_at: string;
  updated_at: string;
};

export function useAlimentacion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fecha = getHoyArgentina();
  const queryKey = ['alimentacion_diaria', user?.id, fecha];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('alimentacion_diaria')
        .select('*')
        .eq('user_id', user!.id)
        .eq('fecha', fecha)
        .maybeSingle();
      if (error) throw error;
      return row as AlimentacionDiaria | null;
    },
    enabled: !!user,
  });

  const guardar = useMutation({
    mutationFn: async ({ menu, comidas }: { menu: 1 | 2 | 3; comidas: number[] }) => {
      if (!user) throw new Error('No autenticado');
      const comidasOrdenadas = [...new Set(comidas)].sort((a, b) => a - b);
      const dietaCompleta = comidasOrdenadas.length === 5;

      const [alimentacionResult, metaResult] = await Promise.all([
        supabase.from('alimentacion_diaria').upsert({
          user_id: user.id,
          fecha,
          menu,
          comidas_completadas: comidasOrdenadas,
        }, { onConflict: 'user_id,fecha' }),
        supabase.from('metas_diarias').upsert({
          user_id: user.id,
          fecha,
          dieta_calorias_objetivo: 1800,
          dieta_realizado: dietaCompleta,
        }, { onConflict: 'user_id,fecha' }),
      ]);

      if (alimentacionResult.error) throw alimentacionResult.error;
      if (metaResult.error) throw metaResult.error;
      return { menu, comidas: comidasOrdenadas, dietaCompleta };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['metas_diarias', user?.id] }),
      ]);
    },
  });

  return {
    fecha,
    registro: data,
    isLoading,
    isSaving: guardar.isPending,
    guardar: guardar.mutateAsync,
  };
}
