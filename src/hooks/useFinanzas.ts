import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useTelegramAlert } from '@/hooks/useTelegramAlert';

export interface Ingreso {
  id: string;
  user_id: string;
  fecha: string;
  monto: number;
  tipo: 'fijo' | 'variable';
  descripcion: string | null;
}

export interface GastoDiario {
  id: string;
  user_id: string;
  fecha: string;
  monto: number;
  categoria: string;
  descripcion: string | null;
  medio_pago: 'efectivo' | 'transferencia' | 'otro';
}

export function useFinanzas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendAlert } = useTelegramAlert();

  const { data: configuracion, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracion', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_usuario')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || { salario_mensual: 0 };
    },
    enabled: !!user,
  });

  const { data: ingresos = [], isLoading: loadingIngresos } = useQuery({
    queryKey: ['ingresos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as Ingreso[];
    },
    enabled: !!user,
  });

  const { data: gastosDiarios = [], isLoading: loadingGastos } = useQuery({
    queryKey: ['gastos_diarios', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_diarios')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as GastoDiario[];
    },
    enabled: !!user,
  });

  const setSalario = useMutation({
    mutationFn: async (salario_mensual: number) => {
      const { error } = await supabase
        .from('configuracion_usuario')
        .upsert({ user_id: user!.id, salario_mensual, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion', user?.id] }),
  });

  const addIngreso = useMutation({
    mutationFn: async (ingreso: Omit<Ingreso, 'id' | 'user_id'>) => {
      const { error } = await supabase
        .from('ingresos')
        .insert([{ ...ingreso, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  const addGastoDiario = useMutation({
    mutationFn: async (gasto: Omit<GastoDiario, 'id' | 'user_id'>) => {
      const { error } = await supabase
        .from('gastos_diarios')
        .insert([{ ...gasto, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: (_data, gasto) => {
      queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] });
      if (gasto.monto > 50000) {
        sendAlert('💸 Gasto grande', `$${gasto.monto} ARS en ${gasto.categoria}`);
      }
      // Note: no per-category budget limit exists in the schema yet, so the
      // "presupuesto al límite" alert (>= 80% of category budget) can't be wired up.
    },
  });
  
  const deleteGastoDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos_diarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] }),
  });

  const updateIngreso = useMutation({
    mutationFn: async (ingreso: Ingreso) => {
      const { id, user_id, ...updateData } = ingreso;
      const { error } = await supabase.from('ingresos').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  const updateGastoDiario = useMutation({
    mutationFn: async (gasto: GastoDiario) => {
      const { id, user_id, ...updateData } = gasto;
      const { error } = await supabase.from('gastos_diarios').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] }),
  });

  const deleteIngreso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingresos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  return {
    configuracion,
    ingresos,
    gastosDiarios,
    loading: loadingConfig || loadingIngresos || loadingGastos,
    setSalario: setSalario.mutateAsync,
    addIngreso: addIngreso.mutateAsync,
    updateIngreso: updateIngreso.mutateAsync,
    addGastoDiario: addGastoDiario.mutateAsync,
    updateGastoDiario: updateGastoDiario.mutateAsync,
    deleteGastoDiario: deleteGastoDiario.mutateAsync,
    deleteIngreso: deleteIngreso.mutateAsync,
  };
}
