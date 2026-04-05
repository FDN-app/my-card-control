import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] }),
  });
  
  const deleteGastoDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos_diarios').delete().eq('id', id);
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
    addGastoDiario: addGastoDiario.mutateAsync,
    deleteGastoDiario: deleteGastoDiario.mutateAsync,
    deleteIngreso: deleteIngreso.mutateAsync,
  };
}
