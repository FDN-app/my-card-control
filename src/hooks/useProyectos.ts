import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getHoyArgentina } from '@/lib/dateAR';

export type EstadoProyecto = 'Idea' | 'En progreso' | 'Terminada' | 'Mejorando';

export interface Proyecto {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

export type ProyectoInput = {
  nombre: string;
  descripcion?: string | null;
  estado: EstadoProyecto;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
};

export function useProyectos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proyectos = [], isLoading } = useQuery({
    queryKey: ['proyectos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Proyecto[];
    },
    enabled: !!user,
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['proyectos', user?.id] });

  const crearProyecto = useMutation({
    mutationFn: async (input: ProyectoInput) => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('proyectos')
        .insert([{ ...input, user_id: authUser.id }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const actualizarProyecto = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ProyectoInput> & { id: string }) => {
      const { error } = await supabase
        .from('proyectos')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoProyecto }) => {
      const extra = estado === 'Terminada' ? { fecha_fin: getHoyArgentina() } : {};
      const { error } = await supabase
        .from('proyectos')
        .update({ estado, ...extra, updated_at: now })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const eliminarProyecto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    proyectos,
    isLoading,
    crearProyecto: crearProyecto.mutateAsync,
    actualizarProyecto: actualizarProyecto.mutateAsync,
    cambiarEstado: cambiarEstado.mutateAsync,
    eliminarProyecto: eliminarProyecto.mutateAsync,
  };
}
