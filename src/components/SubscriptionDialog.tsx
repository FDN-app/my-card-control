import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/lib/store';
import { type Subscription } from '@/lib/data';

const subscriptionSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  amount: z.coerce.number().min(1, "El monto debe ser numérico y mayor a 0"),
  cardId: z.string().min(1, "Selecciona una tarjeta"),
  nextBillingDate: z.string().min(1, "Selecciona la fecha"),
  periodicity: z.enum(['Mensual', 'Anual']),
  status: z.enum(['Activa', 'Cancelada']),
});

type SubscriptionFormVals = z.infer<typeof subscriptionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionToEdit?: Subscription;
}

export default function SubscriptionDialog({ open, onOpenChange, subscriptionToEdit }: Props) {
  const { cards, addSubscription, updateSubscription } = useApp();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SubscriptionFormVals>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      periodicity: 'Mensual',
      status: 'Activa',
      nextBillingDate: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (open) {
      if (subscriptionToEdit) {
        reset({
          name: subscriptionToEdit.name,
          amount: subscriptionToEdit.amount,
          cardId: subscriptionToEdit.cardId,
          nextBillingDate: subscriptionToEdit.nextBillingDate,
          periodicity: subscriptionToEdit.periodicity,
          status: subscriptionToEdit.status,
        });
      } else {
        reset({
          name: '',
          amount: 0,
          cardId: cards[0]?.id || '',
          nextBillingDate: new Date().toISOString().split('T')[0],
          periodicity: 'Mensual',
          status: 'Activa',
        });
      }
    }
  }, [open, subscriptionToEdit, reset, cards]);

  const onSubmit = (data: SubscriptionFormVals) => {
    if (subscriptionToEdit) {
      updateSubscription({ ...(data as Subscription), id: subscriptionToEdit.id });
    } else {
      addSubscription(data as Omit<Subscription, 'id'>);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-none text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {subscriptionToEdit ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nombre del Servicio</label>
            <input
              {...register('name')}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Ej: Netflix, Gym, etc."
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monto</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <input
                  type="number"
                  {...register('amount')}
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 pl-7 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tarjeta</label>
              <select
                {...register('cardId')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">{c.bank} - {c.lastDigits}</option>
                ))}
              </select>
              {errors.cardId && <p className="text-red-500 text-xs mt-1">{errors.cardId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Próximo Cobro</label>
              <input
                type="date"
                {...register('nextBillingDate')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
              />
              {errors.nextBillingDate && <p className="text-red-500 text-xs mt-1">{errors.nextBillingDate.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Periodicidad</label>
              <select
                {...register('periodicity')}
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 mt-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="Mensual" className="bg-card">Mensual</option>
                <option value="Anual" className="bg-card">Anual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Estado</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Activa" {...register('status')} className="accent-primary w-4 h-4" />
                <span className="text-sm font-medium text-foreground">Activa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Cancelada" {...register('status')} className="accent-primary w-4 h-4" />
                <span className="text-sm font-medium text-foreground">Cancelada</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-6"
          >
            {subscriptionToEdit ? 'Guardar Cambios' : 'Crear Suscripción'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
