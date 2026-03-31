import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/lib/store';
import { type Subscription } from '@/lib/data';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const subscriptionSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  monto: z.coerce.number().min(1, "El monto debe ser numérico y mayor a 0"),
  tarjeta_id: z.string().min(1, "Selecciona una tarjeta"),
  fecha_proximo_cobro: z.string().min(1, "Selecciona la fecha"),
  periodicidad: z.enum(['Mensual', 'Anual']),
  estado: z.enum(['Activa', 'Cancelada']),
  notas: z.string().optional().nullable(),
});

type SubscriptionFormVals = z.infer<typeof subscriptionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionToEdit?: Subscription;
}

export default function SubscriptionDialog({ open, onOpenChange, subscriptionToEdit }: Props) {
  const { cards } = useApp();
  const { addSubscription, updateSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubscriptionFormVals>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      periodicidad: 'Mensual',
      estado: 'Activa',
      fecha_proximo_cobro: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (open) {
      if (subscriptionToEdit) {
        reset({
          nombre: subscriptionToEdit.nombre,
          monto: subscriptionToEdit.monto,
          tarjeta_id: subscriptionToEdit.tarjeta_id || cards[0]?.id || '',
          fecha_proximo_cobro: subscriptionToEdit.fecha_proximo_cobro,
          periodicidad: subscriptionToEdit.periodicidad,
          estado: subscriptionToEdit.estado,
          notas: subscriptionToEdit.notas || '',
        });
      } else {
        reset({
          nombre: '',
          monto: 0,
          tarjeta_id: cards[0]?.id || '',
          fecha_proximo_cobro: new Date().toISOString().split('T')[0],
          periodicidad: 'Mensual',
          estado: 'Activa',
          notas: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscriptionToEdit, reset]);

  const onSubmit = async (data: SubscriptionFormVals) => {
    setIsSubmitting(true);
    try {
      if (subscriptionToEdit) {
        await updateSubscription.mutateAsync({ 
          ...subscriptionToEdit, 
          ...data 
        });
      } else {
        await addSubscription.mutateAsync({
          ...data,
          tarjeta_id: data.tarjeta_id || null,
        } as Omit<Subscription, 'id' | 'user_id' | 'created_at'>);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save subscription", error);
      toast.error('Error al guardar. Verifica los datos o tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-none text-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {subscriptionToEdit ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nombre del Servicio</label>
            <input
              {...register('nombre')}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Ej: Netflix, Gym, etc."
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monto</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <input
                  type="number"
                  {...register('monto')}
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 pl-7 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tarjeta</label>
              <select
                {...register('tarjeta_id')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="" disabled className="bg-card text-muted-foreground">Selecciona una tarjeta</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">{c.bank} - {c.lastDigits || ''}</option>
                ))}
              </select>
              {errors.tarjeta_id && <p className="text-red-500 text-xs mt-1">{errors.tarjeta_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Próximo Cobro</label>
              <input
                type="date"
                {...register('fecha_proximo_cobro')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
              />
              {errors.fecha_proximo_cobro && <p className="text-red-500 text-xs mt-1">{errors.fecha_proximo_cobro.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Periodicidad</label>
              <select
                {...register('periodicidad')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="Mensual" className="bg-card">Mensual</option>
                <option value="Anual" className="bg-card">Anual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Notas (Opcional)</label>
            <input
              {...register('notas')}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Algún detalle importante..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Estado</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Activa" {...register('estado')} className="accent-primary w-4 h-4" />
                <span className="text-sm font-medium text-foreground">Activa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Cancelada" {...register('estado')} className="accent-primary w-4 h-4" />
                <span className="text-sm font-medium text-foreground">Cancelada</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-6 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
               <><Loader2 className="animate-spin" size={20} /> Procesando...</>
            ) : subscriptionToEdit ? 'Guardar Cambios' : 'Crear Suscripción'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
