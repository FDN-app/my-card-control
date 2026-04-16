import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Subscription, formatCurrency } from '@/lib/data';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { CheckCircle2, PauseCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentOptionsModal({ subscription, open, onOpenChange }: Props) {
  const { updateSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!subscription) return null;

  const handleRenew = async () => {
    setIsSubmitting(true);
    try {
      const currentDate = new Date(subscription.fecha_proximo_cobro + 'T00:00:00');
      const nextDate = new Date(currentDate);
      
      if (subscription.periodicidad === 'Mensual') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      const formattedDate = nextDate.toISOString().split('T')[0];

      await updateSubscription.mutateAsync({
        ...subscription,
        fecha_proximo_cobro: formattedDate,
        estado: 'Activa'
      });

      toast.success(`✅ Renovado hasta ${nextDate.toLocaleDateString('es-AR')}`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al renovar la suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = async () => {
    setIsSubmitting(true);
    try {
      await updateSubscription.mutateAsync({
        ...subscription,
        estado: 'Pausada'
      });
      toast.success('⏸ Suscripción pausada');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al pausar la suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta suscripción? Dejarás de recibir alertas.')) return;
    
    setIsSubmitting(true);
    try {
      await updateSubscription.mutateAsync({
        ...subscription,
        estado: 'Cancelada'
      });
      toast.success('❌ Suscripción cancelada');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-none text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">Gestionar Suscripción</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {subscription.nombre} — {formatCurrency(subscription.monto)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          <button
            onClick={handleRenew}
            disabled={isSubmitting}
            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left interactive-press group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="font-bold text-emerald-500">Pagué y quiero renovar</p>
              <p className="text-xs text-emerald-500/70">Extiende la fecha {subscription.periodicidad === 'Mensual' ? 'un mes' : 'un año'}</p>
            </div>
          </button>

          <button
            onClick={handlePause}
            disabled={isSubmitting}
            className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all text-left interactive-press group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <PauseCircle size={28} />
            </div>
            <div>
              <p className="font-bold text-orange-500">Pausar suscripción</p>
              <p className="text-xs text-orange-500/70">Mantiene la fecha pero sin alertas</p>
            </div>
          </button>

          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all text-left interactive-press group"
          >
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
              <XCircle size={28} />
            </div>
            <div>
              <p className="font-bold text-destructive">Cancelar servicio</p>
              <p className="text-xs text-destructive/70">Marcar como finalizado/cancelado</p>
            </div>
          </button>
        </div>

        {isSubmitting && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
