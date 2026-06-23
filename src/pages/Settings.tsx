import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import CurrencySelector from '@/components/CurrencySelector';
import { useTelegramAlert } from '@/hooks/useTelegramAlert';
import { useTelegram } from '@/hooks/useTelegram';
import { useFinanzas, CATEGORIAS_GASTOS, type Presupuesto, type ReglaCategoria } from '@/hooks/useFinanzas';
import { Send, Loader2, Plus, Trash2, Pencil, Check, X, MessageCircle, LinkIcon } from 'lucide-react';

const ALL_CATEGORIES = [
  'Supermercado', 'Alimentos', 'Comida', 'Transporte', 'Servicios',
  'Hogar', 'Entretenimiento', 'Salud', 'Educación', 'Ropa',
  'Tecnología', 'Viajes', 'Transferencia', 'Ahorro', 'Otros',
];

export default function SettingsPage() {
  const { cards, updateCard, alertThreshold, setAlertThreshold, subscriptionAlertDays, setSubscriptionAlertDays } = useApp();
  const { toast } = useToast();
  const { rates, setRates } = useCurrency();
  const { sending, sendAlert } = useTelegramAlert();
  const {
    chatIdVinculado,
    codigoActivo,
    polling,
    generarCodigoVinculacion,
    iniciarPolling,
    detenerPolling,
    desvincularTelegram,
  } = useTelegram();
  const {
    presupuestos, gastadoPorCategoria,
    addPresupuesto, updatePresupuesto, deletePresupuesto,
    reglas, addRegla, updateRegla, deleteRegla,
  } = useFinanzas();

  const [profile, setProfile] = useState({ name: 'Tomas Cook', email: 'tomas@cuotactrl.com' });
  const [rateForm, setRateForm] = useState({ USD: String(rates.USD), EUR: String(rates.EUR) });

  // ── Estado: Vinculación Telegram ─────────────────────────────────────────
  const [modalTelegram, setModalTelegram] = useState(false);
  const [vinculacionExitosa, setVinculacionExitosa] = useState(false);

  // ── Estado: Presupuestos ─────────────────────────────────────────────────
  const [newPresupuesto, setNewPresupuesto] = useState({ categoria: ALL_CATEGORIES[0], limite_mensual: '' });
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [editPresupuestoForm, setEditPresupuestoForm] = useState({ limite_mensual: '' });
  const [savingPresupuesto, setSavingPresupuesto] = useState(false);

  // ── Estado: Reglas de categoría ──────────────────────────────────────────
  const [newRegla, setNewRegla] = useState({ patron: '', categoria: ALL_CATEGORIES[0] });
  const [editingRegla, setEditingRegla] = useState<ReglaCategoria | null>(null);
  const [editReglaForm, setEditReglaForm] = useState({ patron: '', categoria: ALL_CATEGORIES[0] });
  const [savingRegla, setSavingRegla] = useState(false);

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

  const handleTestNotification = async () => {
    try {
      const enviado = await sendAlert('🔔 Notificación de prueba', 'Si ves este mensaje en Telegram, las alertas de CuotaCtrl están funcionando correctamente.');
      if (enviado) {
        toast({ title: 'Notificación enviada', description: 'Revisá tu chat de Telegram.' });
      } else {
        toast({ title: 'Telegram no vinculado', description: 'Vinculá tu Telegram primero desde la sección de arriba.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error al enviar', description: e?.message || 'No se pudo contactar al bot de Telegram.', variant: 'destructive' });
    }
  };

  // ── Handlers: Vinculación Telegram ───────────────────────────────────────
  const handleAbrirModalTelegram = async () => {
    setVinculacionExitosa(false);
    setModalTelegram(true);
    try {
      await generarCodigoVinculacion();
      iniciarPolling(() => {
        setVinculacionExitosa(true);
        setTimeout(() => setModalTelegram(false), 2500);
      });
    } catch (e: any) {
      toast({ title: 'Error al generar código', description: e?.message, variant: 'destructive' });
      setModalTelegram(false);
    }
  };

  const handleCerrarModalTelegram = () => {
    detenerPolling();
    setModalTelegram(false);
  };

  const handleDesvincularTelegram = async () => {
    try {
      await desvincularTelegram();
      toast({ title: 'Telegram desvinculado' });
    } catch (e: any) {
      toast({ title: 'Error al desvincular', description: e?.message, variant: 'destructive' });
    }
  };

  // ── Handlers: Presupuestos ───────────────────────────────────────────────
  const handleAddPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    const limite = Number(newPresupuesto.limite_mensual);
    if (!limite || limite <= 0) return;
    const yaExiste = presupuestos.some(p => p.categoria === newPresupuesto.categoria);
    if (yaExiste) {
      toast({ title: 'Ya existe', description: `Ya tenés presupuesto para ${newPresupuesto.categoria}.`, variant: 'destructive' });
      return;
    }
    try {
      await addPresupuesto({ categoria: newPresupuesto.categoria, limite_mensual: limite, moneda: 'ARS' });
      setNewPresupuesto({ categoria: ALL_CATEGORIES[0], limite_mensual: '' });
      toast({ title: 'Presupuesto creado' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleSavePresupuesto = async () => {
    if (!editingPresupuesto) return;
    const limite = Number(editPresupuestoForm.limite_mensual);
    if (!limite || limite <= 0) return;
    setSavingPresupuesto(true);
    try {
      await updatePresupuesto({ ...editingPresupuesto, limite_mensual: limite });
      setEditingPresupuesto(null);
      toast({ title: 'Presupuesto actualizado' });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    } finally {
      setSavingPresupuesto(false);
    }
  };

  const handleDeletePresupuesto = async (id: string) => {
    try {
      await deletePresupuesto(id);
      toast({ title: 'Presupuesto eliminado' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  // ── Handlers: Reglas ─────────────────────────────────────────────────────
  const handleAddRegla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegla.patron.trim()) return;
    try {
      await addRegla({ patron: newRegla.patron.trim(), categoria: newRegla.categoria });
      setNewRegla({ patron: '', categoria: ALL_CATEGORIES[0] });
      toast({ title: 'Regla creada' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleSaveRegla = async () => {
    if (!editingRegla || !editReglaForm.patron.trim()) return;
    setSavingRegla(true);
    try {
      await updateRegla({ ...editingRegla, patron: editReglaForm.patron.trim(), categoria: editReglaForm.categoria });
      setEditingRegla(null);
      toast({ title: 'Regla actualizada' });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    } finally {
      setSavingRegla(false);
    }
  };

  const handleDeleteRegla = async (id: string) => {
    try {
      await deleteRegla(id);
      toast({ title: 'Regla eliminada' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm mb-1">Preferencias</p>
        <h2 className="text-3xl font-bold tracking-display text-foreground">Configuración</h2>
      </div>

      {/* Perfil */}
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

      {/* Moneda */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Moneda</h3>
        <p className="text-muted-foreground text-sm">Elegí en qué moneda ver los montos de la app.</p>
        <CurrencySelector />
      </div>

      {/* Tasas de Cambio */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Tasas de Cambio</h3>
        <p className="text-muted-foreground text-sm">
          Definí cuántos pesos argentinos equivalen a 1 USD o 1 EUR. Los montos base siempre están en ARS.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>1 USD = ? ARS</Label>
            <Input type="number" min="0" step="any" value={rateForm.USD} onChange={e => setRateForm(f => ({ ...f, USD: e.target.value }))} />
          </div>
          <div>
            <Label>1 EUR = ? ARS</Label>
            <Input type="number" min="0" step="any" value={rateForm.EUR} onChange={e => setRateForm(f => ({ ...f, EUR: e.target.value }))} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSaveRates}>Guardar tasas</Button>
      </div>

      {/* Vincular Telegram */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Vincular Telegram</h3>
        {chatIdVinculado === undefined ? (
          <p className="text-muted-foreground text-sm">Cargando estado de vinculación...</p>
        ) : chatIdVinculado ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500 text-base">✅</span>
              <span className="text-foreground font-medium">Telegram vinculado correctamente</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDesvincularTelegram}>
              Desvincular
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Vinculá tu cuenta de Telegram para recibir alertas personalizadas de gastos y presupuestos.
            </p>
            <Button variant="outline" size="sm" onClick={handleAbrirModalTelegram} className="gap-2">
              <MessageCircle size={15} />
              Vincular Telegram
            </Button>
          </div>
        )}
      </div>

      {/* Modal de vinculación */}
      <Dialog open={modalTelegram} onOpenChange={open => { if (!open) handleCerrarModalTelegram(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vinculá tu Telegram</DialogTitle>
            <DialogDescription>
              Enviá este código al bot y la vinculación se completa sola.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {vinculacionExitosa ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-5xl">✅</p>
                <p className="font-semibold text-foreground">Telegram vinculado correctamente</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-xl px-10 py-5">
                    <span className="text-3xl font-bold tracking-widest text-primary font-mono">
                      {codigoActivo ?? '···'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open('https://t.me/cardcontrol_alertas_bot', '_blank')}
                  >
                    <LinkIcon size={14} />
                    Abrir bot en Telegram
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm text-center">
                  Pegá este código en el bot y mandalo. La vinculación se completa sola.
                </p>
                {polling && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Esperando vinculación...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notificaciones por Telegram */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Notificaciones por Telegram</h3>
        <p className="text-muted-foreground text-sm">
          CuotaCtrl te avisa por Telegram cuando un gasto supera los $50.000 ARS o una categoría
          alcanza el umbral de su presupuesto. Probá la conexión con tu bot:
        </p>
        <Button variant="outline" size="sm" onClick={handleTestNotification} disabled={sending || !chatIdVinculado} className="gap-2">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? 'Enviando...' : 'Test notificación'}
        </Button>
      </div>

      {/* Umbral de Alerta */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Umbral de Alerta</h3>
        <p className="text-muted-foreground text-sm">
          Recibí una alerta cuando el uso de presupuesto supere este porcentaje.
        </p>
        <div className="flex items-center gap-6">
          <Slider value={[alertThreshold]} onValueChange={v => setAlertThreshold(v[0])} min={50} max={95} step={5} className="flex-1" />
          <span className="text-2xl font-bold tracking-display text-primary w-16 text-right">{alertThreshold}%</span>
        </div>
      </div>

      {/* Alerta de Suscripciones */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Alerta de Suscripciones</h3>
        <p className="text-muted-foreground text-sm">Avisarme cuando una suscripción activa se cobre en los próximos días.</p>
        <div className="flex items-center gap-6">
          <Slider value={[subscriptionAlertDays]} onValueChange={v => setSubscriptionAlertDays(v[0])} min={1} max={7} step={1} className="flex-1" />
          <span className="text-2xl font-bold tracking-display text-primary w-16 text-right">{subscriptionAlertDays} d</span>
        </div>
      </div>

      {/* Presupuesto por Tarjeta */}
      <div className="surface-elevated rounded-2xl p-6 space-y-4">
        <h3 className="text-foreground font-bold text-lg">Presupuesto por Tarjeta</h3>
        {cards.map(card => (
          <div key={card.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded bg-gradient-to-br ${card.gradient}`} />
              <span className="text-foreground text-sm font-medium">{card.bank} — {card.name}</span>
            </div>
            <Input type="number" className="w-40 text-right" value={card.budget} onChange={e => handleBudgetChange(card.id, Number(e.target.value))} />
          </div>
        ))}
      </div>

      {/* ── FASE 1: Presupuestos por Categoría ────────────────────────────────── */}
      <div className="surface-elevated rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-foreground font-bold text-lg">Presupuestos por Categoría</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Definí un límite mensual para cada categoría de gastos diarios. Recibirás alertas al acercarte al límite.
          </p>
        </div>

        {/* Formulario para agregar */}
        <form onSubmit={handleAddPresupuesto} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Categoría</Label>
            <select
              className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={newPresupuesto.categoria}
              onChange={e => setNewPresupuesto(f => ({ ...f, categoria: e.target.value }))}
            >
              {ALL_CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
            </select>
          </div>
          <div className="w-36">
            <Label className="text-xs">Límite mensual (ARS)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ej: 50000"
              className="mt-1"
              value={newPresupuesto.limite_mensual}
              onChange={e => setNewPresupuesto(f => ({ ...f, limite_mensual: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="gap-1 shrink-0">
            <Plus size={14} /> Agregar
          </Button>
        </form>

        {/* Lista de presupuestos */}
        {gastadoPorCategoria.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Aún no definiste presupuestos por categoría.</p>
        ) : (
          <div className="space-y-3">
            {gastadoPorCategoria.map(p => (
              <div key={p.id}>
                {editingPresupuesto?.id === p.id ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <span className="text-sm font-medium text-foreground flex-1">{p.categoria}</span>
                    <Input
                      type="number"
                      className="w-36"
                      value={editPresupuestoForm.limite_mensual}
                      onChange={e => setEditPresupuestoForm({ limite_mensual: e.target.value })}
                    />
                    <button onClick={handleSavePresupuesto} disabled={savingPresupuesto} className="text-success hover:text-success/80 p-1">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingPresupuesto(null)} className="text-muted-foreground hover:text-foreground p-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{p.categoria}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.porcentaje >= 100 ? 'bg-destructive/20 text-destructive' :
                          p.porcentaje >= 80  ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-primary/10 text-primary'
                        }`}>
                          {p.porcentaje}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                          {fmt.format(p.gastado)} / {fmt.format(p.limite_mensual)}
                        </span>
                        <div className="flex gap-1 text-muted-foreground">
                          <button onClick={() => { setEditingPresupuesto(p); setEditPresupuestoForm({ limite_mensual: String(p.limite_mensual) }); }} className="hover:text-primary p-1 rounded"><Pencil size={13} /></button>
                          <button onClick={() => handleDeletePresupuesto(p.id)} className="hover:text-destructive p-1 rounded"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.porcentaje >= 100 ? 'bg-destructive' :
                          p.porcentaje >= 80  ? 'bg-orange-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FASE 2: Reglas de Categorización Automática ───────────────────────── */}
      <div className="surface-elevated rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-foreground font-bold text-lg">Categorización Automática</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Si la descripción de un gasto contiene el patrón (sin importar mayúsculas), se asigna automáticamente la categoría.
          </p>
        </div>

        {/* Formulario para agregar */}
        <form onSubmit={handleAddRegla} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Patrón de texto</Label>
            <Input
              className="mt-1"
              placeholder="Ej: uber, disco, farmacity"
              value={newRegla.patron}
              onChange={e => setNewRegla(f => ({ ...f, patron: e.target.value }))}
            />
          </div>
          <div className="w-40">
            <Label className="text-xs">Categoría</Label>
            <select
              className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={newRegla.categoria}
              onChange={e => setNewRegla(f => ({ ...f, categoria: e.target.value }))}
            >
              {ALL_CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
            </select>
          </div>
          <Button type="submit" size="sm" variant="outline" className="gap-1 shrink-0">
            <Plus size={14} /> Agregar
          </Button>
        </form>

        {/* Lista de reglas */}
        {reglas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Aún no definiste reglas de categorización.</p>
        ) : (
          <div className="space-y-2">
            {reglas.map(r => (
              <div key={r.id}>
                {editingRegla?.id === r.id ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <Input
                      className="flex-1"
                      value={editReglaForm.patron}
                      onChange={e => setEditReglaForm(f => ({ ...f, patron: e.target.value }))}
                    />
                    <select
                      className="w-40 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      value={editReglaForm.categoria}
                      onChange={e => setEditReglaForm(f => ({ ...f, categoria: e.target.value }))}
                    >
                      {ALL_CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
                    </select>
                    <button onClick={handleSaveRegla} disabled={savingRegla} className="text-success hover:text-success/80 p-1"><Check size={16} /></button>
                    <button onClick={() => setEditingRegla(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-secondary/30 border border-border/50 rounded-xl group">
                    <div className="flex items-center gap-3 text-sm">
                      <code className="bg-secondary px-2 py-0.5 rounded text-xs text-primary border border-primary/20">{r.patron}</code>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{r.categoria}</span>
                    </div>
                    <div className="flex gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingRegla(r); setEditReglaForm({ patron: r.patron, categoria: r.categoria }); }} className="hover:text-primary p-1 rounded"><Pencil size={13} /></button>
                      <button onClick={() => handleDeleteRegla(r.id)} className="hover:text-destructive p-1 rounded"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button className="w-full" size="lg" onClick={handleSave}>
        Guardar Configuración
      </Button>
    </div>
  );
}
