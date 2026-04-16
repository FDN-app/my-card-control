import { useState, useMemo } from 'react';
import { Bell, Plus, CreditCard as CardIcon, Loader2, Trash2, CheckCircle2, Play } from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatCurrency, type Subscription } from '@/lib/data';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import PaymentOptionsModal from '@/components/PaymentOptionsModal';
import ReactivateSubscriptionModal from '@/components/ReactivateSubscriptionModal';

export default function Subscriptions() {
  const { cards } = useApp();
  const { subscriptions, isLoading, updateSubscription, deleteSubscription } = useSubscriptions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>(undefined);
  const [filter, setFilter] = useState<'Todas' | 'Activas' | 'Pausadas' | 'Canceladas'>('Todas');
  
  // Modales de gestión de estado
  const [selectedSubForPayment, setSelectedSubForPayment] = useState<Subscription | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSubForReactivation, setSelectedSubForReactivation] = useState<Subscription | null>(null);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);

  const subMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let monthlyTotal = 0;
    
    // Calcular el total mensual SIEMPRE sobre todas las activas, independientemente del filtro
    subscriptions.forEach(s => {
      if (s.estado === 'Activa' && s.periodicidad === 'Mensual') {
        monthlyTotal += Number(s.monto) || 0;
      }
    });

    const items = subscriptions
      .filter(s => {
        if (filter === 'Activas') return s.estado === 'Activa';
        if (filter === 'Pausadas') return s.estado === 'Pausada';
        if (filter === 'Canceladas') return s.estado === 'Cancelada';
        return true;
      })
      .map(s => {
        const billingDate = new Date(s.fecha_proximo_cobro + 'T00:00:00');
        const diffTime = billingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...s, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
      
    return { items, monthlyTotal };
  }, [subscriptions, filter]);

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSub(undefined);
    setIsDialogOpen(true);
  };

  const handlePayClick = (sub: Subscription) => {
    setSelectedSubForPayment(sub);
    setIsPaymentModalOpen(true);
  };

  const handleReactivateClick = (sub: Subscription) => {
    setSelectedSubForReactivation(sub);
    setIsReactivateModalOpen(true);
  };

  const handleDelete = async (sub: Subscription) => {
    if (!confirm('¿Seguro que deseas eliminar esta suscripción?')) return;
    try {
      await deleteSubscription.mutateAsync(sub.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-widest pl-1">Resumen del Mes</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-display text-foreground">
            {formatCurrency(subMetrics.monthlyTotal)}
            <span className="text-lg text-muted-foreground/60 font-medium ml-3 lowercase">/ mes en suscripciones activas</span>
          </h2>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 interactive-press"
        >
          <Plus size={20} />
          Nueva Suscripción
        </button>
      </header>

      <div className="flex justify-start gap-2 border-b border-border pb-4 overflow-x-auto">
         {(['Todas', 'Activas', 'Pausadas', 'Canceladas'] as const).map((f) => (
           <button 
             key={f}
             onClick={() => setFilter(f)} 
             className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
           >
             {f}
           </button>
         ))}
      </div>

      <div className="space-y-4 relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : subMetrics.items.length === 0 ? (
          <div className="surface-elevated p-10 rounded-2xl border border-dashed border-border flex flex-col items-center text-center opacity-70">
            <Bell size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">No hay suscripciones</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              {filter === 'Todas' 
                ? 'Agrega tus suscripciones como Netflix, Spotify o membresias para llevar un mejor control mensual.'
                : `No se encontraron suscripciones con el estado: ${filter}`}
            </p>
          </div>
        ) : (
          subMetrics.items.map(sub => {
            const card = cards.find(c => c.id === sub.tarjeta_id);
            
            // Badge color logic
            let badgeClass = "bg-secondary text-secondary-foreground border border-border";
            let badgeText = "";
            
            if (sub.estado === 'Cancelada') {
              badgeClass = "bg-destructive/10 text-destructive border border-destructive/20";
              badgeText = "❌ Cancelada";
            } else if (sub.estado === 'Pausada') {
              badgeClass = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
              badgeText = "⏸ Pausada";
            } else {
              // Activa
              if (sub.diffDays < 0) {
                 badgeClass = "bg-secondary text-secondary-foreground border border-border";
                 badgeText = "Cobrado recientemente";
              } else if (sub.diffDays === 0) {
                badgeClass = "bg-destructive/20 text-destructive border border-destructive/30";
                badgeText = "Se cobra HOY";
              } else if (sub.diffDays <= 3) {
                badgeClass = "bg-destructive/10 text-destructive border border-destructive/20";
                badgeText = `Faltan ${sub.diffDays} días`;
              } else if (sub.diffDays <= 7) {
                badgeClass = "bg-warning/20 text-warning border border-warning/30";
                badgeText = `Faltan ${sub.diffDays} días`;
              } else {
                badgeClass = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                badgeText = `Faltan ${sub.diffDays} días`;
              }
            }

            return (
              <div key={sub.id} className={`surface-elevated p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${sub.estado !== 'Activa' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner border border-border shrink-0 ${sub.estado === 'Activa' ? 'bg-secondary' : 'bg-muted opacity-50'}`}>
                    {sub.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-foreground font-bold text-lg flex items-center gap-2 flex-wrap">
                      <span className="truncate">{sub.nombre}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </h3>
                    <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 shrink-0"><CardIcon size={14} /> {card?.bank || 'Tarjeta Borrada'}</span>
                      <span className="opacity-50 hidden sm:inline">•</span>
                      <span className="shrink-0">Próximo: {new Date(sub.fecha_proximo_cobro + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                      <span className="opacity-50 hidden sm:inline">•</span>
                      <span className="shrink-0">{sub.periodicidad}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 border-t border-border md:border-0 pt-4 md:pt-0 shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-foreground">
                      {formatCurrency(sub.monto)}
                    </p>
                    {sub.notas && <p className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={sub.notas}>{sub.notas}</p>}
                  </div>
                  
                  <div className="flex gap-2">
                    {sub.estado === 'Activa' && (
                      <button
                        onClick={() => handlePayClick(sub)}
                        className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold interactive-press flex items-center gap-1"
                      >
                        <CheckCircle2 size={16} />
                        Pagué
                      </button>
                    )}

                    {sub.estado === 'Pausada' && (
                      <button
                        onClick={() => handleReactivateClick(sub)}
                        className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold interactive-press flex items-center gap-1"
                      >
                        <Play size={16} fill="currentColor" />
                        Reactivar
                      </button>
                    )}

                    <button
                      onClick={() => handleEdit(sub)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold interactive-press bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleDelete(sub)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold interactive-press bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SubscriptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subscriptionToEdit={editingSub}
      />

      <PaymentOptionsModal
        subscription={selectedSubForPayment}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
      />

      <ReactivateSubscriptionModal
        subscription={selectedSubForReactivation}
        open={isReactivateModalOpen}
        onOpenChange={setIsReactivateModalOpen}
      />
    </div>
  );
}

