import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { type Subscription } from '@/lib/data';
import { toast } from 'sonner';

export const useSubscriptions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_proximo_cobro', { ascending: true });
        
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!user,
  });

  // Add subscription
  const addSubscription = useMutation({
    mutationFn: async (newSub: Omit<Subscription, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('suscripciones')
        .insert([{ ...newSub, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Suscripción agregada exitosamente');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al agregar suscripción');
    }
  });

  // Update subscription
  const updateSubscription = useMutation({
    mutationFn: async (updatedSub: Subscription) => {
      const { id, user_id, created_at, ...updateData } = updatedSub;
      
      const { data, error } = await supabase
        .from('suscripciones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Suscripción actualizada exitosamente');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al actualizar suscripción');
    }
  });

  // Delete subscription
  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suscripciones')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Suscripción eliminada exitosamente');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al eliminar suscripción');
    }
  });

  return {
    subscriptions,
    isLoading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription
  };
};
