import { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { cards, updateCard, alertThreshold, setAlertThreshold, subscriptionAlertDays, setSubscriptionAlertDays } = useApp();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: 'Tomas Cook', email: 'tomas@cuotactrl.com' });

  const handleBudgetChange = (cardId: string, budget: number) => {
    const card = cards.find(c => c.id === cardId);
    if (card) updateCard({ ...card, budget });
  };

  const handleSave = () => {
    toast({ title: 'Configuración guardada', description: 'Tus preferencias se actualizaron correctamente.' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm mb-1">Preferencias</p>
        <h2 className="text-3xl font-bold tracking-display text-foreground">Configuración</h2>
      </div>

      {/* Profile */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Perfil</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Alert threshold */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Umbral de Alerta</h3>
        <p className="text-muted-foreground text-sm">
          Recibí una alerta cuando el uso de presupuesto supere este porcentaje.
        </p>
        <div className="flex items-center gap-6">
          <Slider
            value={[alertThreshold]}
            onValueChange={v => setAlertThreshold(v[0])}
            min={50}
            max={95}
            step={5}
            className="flex-1"
          />
          <span className="text-2xl font-bold tracking-display text-primary w-16 text-right">{alertThreshold}%</span>
        </div>
      </div>

      {/* Subscription Alert threshold */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Alerta de Suscripciones</h3>
        <p className="text-muted-foreground text-sm">
          Avisarme cuando una suscripción activa se cobre en los próximos días.
        </p>
        <div className="flex items-center gap-6">
          <Slider
            value={[subscriptionAlertDays]}
            onValueChange={v => setSubscriptionAlertDays(v[0])}
            min={1}
            max={7}
            step={1}
            className="flex-1"
          />
          <span className="text-2xl font-bold tracking-display text-primary w-16 text-right">{subscriptionAlertDays} d</span>
        </div>
      </div>

      {/* Card budgets */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Presupuesto por Tarjeta</h3>
        {cards.map(card => (
          <div key={card.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded bg-gradient-to-br ${card.gradient}`} />
              <span className="text-foreground text-sm font-medium">{card.bank} — {card.name}</span>
            </div>
            <Input
              type="number"
              className="w-40 text-right"
              value={card.budget}
              onChange={e => handleBudgetChange(card.id, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={handleSave}>
        Guardar Configuración
      </Button>
    </div>
  );
}
