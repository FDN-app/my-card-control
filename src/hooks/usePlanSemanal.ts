import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export interface DiaSemana {
  id: string;
  user_id: string;
  dia_semana: number; // 0=Dom … 6=Sáb
  uber_horas: number | null;
  uber_facturacion_objetivo: number | null;
  gym_activo: boolean;
  gym_tipo: string | null;
  gym_horas: number | null;
  estudio_horas: number | null;
  estudio_tema: string | null;
  dieta_calorias_objetivo: number | null;
  apps_horas: number | null;
  created_at: string;
  updated_at: string;
}

export type DiaSemanaInput = Omit<DiaSemana, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function usePlanSemanal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plan = [], isLoading } = useQuery({
    queryKey: ['plan_semanal', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_semanal')
        .select('*')
        .eq('user_id', user!.id)
        .order('dia_semana', { ascending: true });
      if (error) throw error;
      return data as DiaSemana[];
    },
    enabled: !!user,
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['plan_semanal', user?.id] });

  const getDia = (dia_semana: number) =>
    plan.find(d => d.dia_semana === dia_semana) ?? null;

  const upsertDia = useMutation({
    mutationFn: async (input: DiaSemanaInput) => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('plan_semanal')
        .upsert([{ ...input, user_id: authUser.id }], { onConflict: 'user_id,dia_semana' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  return {
    plan,
    isLoading,
    getDia,
    upsertDia: upsertDia.mutateAsync,
  };
}
