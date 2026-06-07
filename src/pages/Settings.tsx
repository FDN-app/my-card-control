import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import CurrencySelector from '@/components/CurrencySelector';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { cards, updateCard, alertThreshold, setAlertThreshold, subscriptionAlertDays, setSubscriptionAlertDays } = useApp();
  const { toast } = useToast();
  const { rates, setRates } = useCurrency();
  const { permission, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [profile, setProfile] = useState({ name: 'Tomas Cook', email: 'tomas@cuotactrl.com' });
  const [rateForm, setRateForm] = useState({ USD: String(rates.USD), EUR: String(rates.EUR) });

  const handleBudgetChange = (cardId: string, budget: number) => {
    const card = cards.find(c => c.id === cardId);
    if (card) updateCard({ ...card, budget });
  };

  const handleSaveRates = () => {
    const usd = parseFloat(rateForm.USD);
    const eur = parseFloat(rateForm.EUR);
    if (isNaN(usd) || usd <= 0 || isNaN(eur) || eur <= 0) {
      toast({ title: 'Tasas inválidas', description: 'Ingresá valores numéricos positivos.', variant: 'destructive' });
      return;
    }
    setRates({ ARS: 1, USD: usd, EUR: eur });
    toast({ title: 'Tasas actualizadas', description: `USD: ${usd} • EUR: ${eur}` });
  };

  const handleSave = () => {
    toast({ title: 'Configuración guardada', description: 'Tus preferencias se actualizaron correctamente.' });
  };

  const handlePushToggle = async () => {
    if (subscribed) {
      await unsubscribe();
      toast({ title: 'Notificaciones desactivadas' });
    } else {
      await subscribe();
      if (permission === 'granted') {
        toast({ title: 'Notificaciones activadas', description: 'Recibirás alertas de presupuesto y cuotas.' });
      }
    }
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

      {/* Currency */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Moneda</h3>
        <p className="text-muted-foreground text-sm">Elegí en qué moneda ver los montos de la app.</p>
        <CurrencySelector />
      </div>

      {/* Exchange rates */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Tasas de Cambio</h3>
        <p className="text-muted-foreground text-sm">
          Definí cuántos pesos argentinos equivalen a 1 USD o 1 EUR. Los montos base siempre están en ARS.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>1 USD = ? ARS</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={rateForm.USD}
              onChange={e => setRateForm(f => ({ ...f, USD: e.target.value }))}
            />
          </div>
          <div>
            <Label>1 EUR = ? ARS</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={rateForm.EUR}
              onChange={e => setRateForm(f => ({ ...f, EUR: e.target.value }))}
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSaveRates}>Guardar tasas</Button>
      </div>

      {/* Push notifications */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Notificaciones Push</h3>
        <p className="text-muted-foreground text-sm">
          Recibí alertas cuando tu presupuesto supere el 80% o cuando una suscripción esté por cobrar.
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {subscribed ? <Bell size={20} className="text-primary" /> : <BellOff size={20} className="text-muted-foreground" />}
            <div>
              <p className="text-foreground text-sm font-medium">
                {subscribed ? 'Notificaciones activas' : 'Notificaciones inactivas'}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-destructive">Permiso denegado. Habilitalo en la configuración del navegador.</p>
              )}
            </div>
          </div>
          {pushLoading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={subscribed}
              onCheckedChange={handlePushToggle}
              disabled={permission === 'denied'}
            />
          )}
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

      {/* Subscription alert */}
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
