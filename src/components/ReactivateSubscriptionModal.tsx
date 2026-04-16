import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Subscription } from '@/lib/data';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReactivateSubscriptionModal({ subscription, open, onOpenChange }: Props) {
  const { updateSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    if (open && subscription) {
      // Default to today if current date is passed
      const today = new Date().toISOString().split('T')[0];
      setNewDate(subscription.fecha_proximo_cobro > today ? subscription.fecha_proximo_cobro : today);
    }
  }, [open, subscription]);

  if (!subscription) return null;

  const handleReactivate = async () => {
    if (!newDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSubscription.mutateAsync({
        ...subscription,
        fecha_proximo_cobro: newDate,
        estado: 'Activa'
      });

      toast.success('🚀 Suscripción reactivada');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al reactivar la suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-none text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Calendar className="text-primary" /> Reactivar Servicio
          </DialogTitle>
          <DialogDescription>
            {subscription.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nueva fecha de próximo cobro</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
            />
          </div>

          <button
            onClick={handleReactivate}
            disabled={isSubmitting || !newDate}
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-2 flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : 'Reactivar Ahora'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
