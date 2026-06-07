import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trash2,
  ChevronDown, ChevronUp, CheckCircle2, Circle, PartyPopper,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/store';
import { formatCurrency, type Expense, CATEGORIES } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

/* ── helpers ─────────────────────────────────────────────── */

type Cuota = {
  numero: number;
  fecha: Date;
  monto: number;
  eliminada: boolean;
  nota: string;
  estado: 'Pagada' | 'Actual' | 'Pendiente';
};

const generateInstallments = (exp: Expense): Cuota[] => {
  const arr: Cuota[] = [];
  const start = new Date(exp.date);
  if (isNaN(start.getTime())) start.setTime(Date.now());
  start.setHours(0, 0, 0, 0);

  for (let i = 1; i <= exp.installments; i++) {
    let d = new Date(start);
    if (exp.periodicidad === 'semanal')   d.setDate(d.getDate() + (i - 1) * 7);
    else if (exp.periodicidad === 'quincenal') d.setDate(d.getDate() + (i - 1) * 15);
    else d.setMonth(d.getMonth() + (i - 1));

    let baseMonto = exp.installmentAmount || Math.round(exp.total / exp.installments);
    let eliminada = false;
    let nota = '';

    const mod = exp.modificaciones_cuotas?.[i];
    if (mod) {
      if (mod.monto !== undefined) baseMonto = mod.monto;
      if (mod.fecha) d = new Date(mod.fecha);
      if (mod.nota)  nota = mod.nota;
      if (mod.eliminada) eliminada = true;
    }

    // Estado: pagada explícitamente en mods, o ya avanzado por current, o actual/pendiente
    let estado: Cuota['estado'] = 'Pendiente';
    if (mod?.pagada || i < exp.current) {
      estado = 'Pagada';
    } else if (i === exp.current) {
      const now = new Date();
      estado =
        d.getFullYear() > now.getFullYear() ||
        (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())
          ? 'Pendiente'
          : 'Actual';
    }

    arr.push({ numero: i, fecha: d, monto: baseMonto, eliminada, nota, estado });
  }

  return arr.filter(c => !c.eliminada);
};

/* ── component ───────────────────────────────────────────── */

export default function CardDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { cards, expenses, deleteExpense, updateExpense, getCardExpenses } = useApp();
  const { toast }   = useToast();

  const [editingExpense,     setEditingExpense]     = useState<Expense | null>(null);
  const [expandedExpense,    setExpandedExpense]     = useState<string | number | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<{
    exp: Expense; num: number; monto: number; fecha: string; nota: string;
  } | null>(null);
  const [loadingAction,      setLoadingAction]      = useState(false);
  // id del gasto cuyas cuotas acaban de quedar todas pagas → muestra dialog
  const [completedExpenseId, setCompletedExpenseId] = useState<string | number | null>(null);

  const card         = cards.find(c => c.id === id);
  const cardExpenses = useMemo(() => getCardExpenses(id || ''), [getCardExpenses, id]);

  const projected = useMemo(() =>
    cardExpenses.reduce((acc, exp) => {
      const cuotas    = generateInstallments(exp);
      const remaining = cuotas.filter(c => c.numero >= exp.current);
      return acc + (remaining.length > 0 ? remaining[0].monto : 0);
    }, 0),
  [cardExpenses]);

  const projectionData = useMemo(() => {
    const data = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return { name: d.toLocaleString('es-AR', { month: 'short' }).toUpperCase(), year: d.getFullYear(), month: d.getMonth(), total: 0 };
    });
    cardExpenses.forEach(exp => {
      generateInstallments(exp)
        .filter(c => c.numero >= exp.current)
        .forEach(c => {
          const target = data.find(d => d.year === c.fecha.getFullYear() && d.month === c.fecha.getMonth());
          if (target) target.total += c.monto;
        });
    });
    return data;
  }, [cardExpenses]);

  if (!card) return <div className="text-foreground p-8">Tarjeta no encontrada.</div>;

  /* ── cuota handlers ──────────────────────────────────────── */

  const handleEditCuota = (exp: Expense, c: Cuota) => {
    setEditingInstallment({ exp, num: c.numero, monto: c.monto, fecha: c.fecha.toISOString().slice(0, 10), nota: c.nota || '' });
  };

  const handleSaveCuota = async () => {
    if (!editingInstallment) return;
    setLoadingAction(true);
    const { exp, num, monto, fecha, nota } = editingInstallment;
    const mods = { ...(exp.modificaciones_cuotas || {}) };
    mods[num] = { ...(mods[num] || {}), monto, fecha, nota };
    try {
      await updateExpense({ ...exp, modificaciones_cuotas: mods });
      setEditingInstallment(null);
      toast({ title: 'Cuota actualizada' });
    } catch {
      toast({ title: 'Error al actualizar cuota', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTogglePaid = async (exp: Expense, cuotaNum: number, currentlyPaid: boolean) => {
    setLoadingAction(true);
    const mods = { ...(exp.modificaciones_cuotas || {}) };

    if (currentlyPaid) {
      // DESMARCAR: materializar primero el estado del puntero para no perder cuotas implícitas
      for (let i = 1; i < exp.current; i++) {
        if (!mods[i]?.eliminada) {
          mods[i] = { ...(mods[i] || {}), pagada: true };
        }
      }
      mods[cuotaNum] = { ...(mods[cuotaNum] || {}), pagada: false };
    } else {
      // MARCAR COMO PAGADA
      mods[cuotaNum] = { ...(mods[cuotaNum] || {}), pagada: true };
    }

    // Recalcular current: primer índice sin pagar ni eliminar (usando solo mods, ya materializados)
    let newCurrent = exp.installments + 1;
    for (let i = 1; i <= exp.installments; i++) {
      if (mods[i]?.eliminada) continue;
      if (mods[i]?.pagada)    continue;
      newCurrent = i;
      break;
    }

    try {
      await updateExpense({ ...exp, modificaciones_cuotas: mods, current: newCurrent });

      if (!currentlyPaid && newCurrent > exp.installments) {
        setCompletedExpenseId(exp.id);
        toast({ title: '🎉 ¡Todas las cuotas pagadas!' });
      } else if (currentlyPaid) {
        if (completedExpenseId === exp.id) setCompletedExpenseId(null);
        toast({ title: 'Cuota marcada como pendiente' });
      } else {
        toast({ title: '✅ Cuota marcada como pagada' });
      }
    } catch {
      toast({ title: 'Error al actualizar cuota', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteExpense = async (expId: string | number) => {
    setLoadingAction(true);
    try {
      await deleteExpense(expId);
      setCompletedExpenseId(null);
      toast({ title: 'Gasto eliminado' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  /* ── render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-8 animate-slide-in-right">
      <button
        onClick={() => navigate('/tarjetas')}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm interactive-press"
      >
        <ArrowLeft size={16} /> Medios de Pago
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ──────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          <CreditCardVisual card={card} projected={projected} />
          <div className="surface-elevated p-6 rounded-2xl space-y-4">
            <h4 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Métricas</h4>
            {[
              { label: 'Presupuesto',     value: formatCurrency(card.budget), color: '' },
              { label: 'Disponible',      value: formatCurrency(card.budget - projected), color: card.budget - projected < 0 ? 'text-destructive' : 'text-success' },
              { label: 'Gastos activos',  value: String(cardExpenses.length), color: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className={`font-medium ${color || 'text-foreground'}`}>{value}</span>
              </div>
            ))}
          </div>
          <Button className="w-full gap-2" onClick={() => navigate('/gastos/nuevo')}>
            <Plus size={16} /> Agregar Gasto
          </Button>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projection chart */}
          <div className="surface-elevated rounded-2xl p-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto] mb-6">
              Proyección de Deuda (6 meses)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 14%)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    cursor={{ fill: 'hsl(217 33% 14%)' }}
                    contentStyle={{ backgroundColor: 'hsl(222 47% 7%)', border: '1px solid hsl(217 33% 14%)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total" fill="hsl(153 100% 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses list */}
          <div className="surface-elevated rounded-2xl overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 bg-secondary text-muted-foreground text-[10px] uppercase tracking-widest font-semibold">
              <span>Gasto</span>
              <span className="text-right">Vr. Cuota</span>
              <span className="text-right">Interés</span>
              <span className="text-center">Progreso</span>
              <span className="text-right">Total Orig.</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-border">
              {cardExpenses.map(exp => {
                const cuotas     = generateInstallments(exp);
                const pagadas    = cuotas.filter(c => c.estado === 'Pagada');
                const pendientes = cuotas.filter(c => c.estado !== 'Pagada');
                const totalPagado    = pagadas.reduce((a, c) => a + c.monto, 0);
                const totalPendiente = pendientes.reduce((a, c) => a + c.monto, 0);
                const isExpanded = expandedExpense === exp.id;

                return (
                  <React.Fragment key={exp.id}>
                    {/* Expense row — responsive: stack on mobile, grid on desktop */}
                    <div className="px-4 md:px-6 py-4 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        {/* Description + meta */}
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground font-medium text-sm truncate">{exp.desc}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-muted-foreground text-xs">{exp.category}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border
                              ${exp.periodicidad === 'semanal' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                exp.periodicidad === 'quincenal' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                              {(exp.periodicidad ?? 'mensual').charAt(0).toUpperCase() + (exp.periodicidad ?? 'mensual').slice(1)}
                            </span>
                          </div>
                          {/* Mobile-only stats */}
                          <div className="flex items-center gap-3 mt-2 md:hidden">
                            <span className="text-foreground font-bold text-sm">
                              {formatCurrency(pendientes.length > 0 ? pendientes[0].monto : exp.installmentAmount || Math.round(exp.total / exp.installments))}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {exp.current}/{exp.installments} cuotas
                            </span>
                            <div className="flex-1 bg-secondary h-1 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${(pagadas.length / (cuotas.length || 1)) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Desktop-only columns */}
                        <div className="hidden md:flex items-center gap-6 shrink-0">
                          <span className="text-foreground font-bold text-sm w-20 text-right">
                            {formatCurrency(pendientes.length > 0 ? pendientes[0].monto : exp.installmentAmount || Math.round(exp.total / exp.installments))}
                          </span>
                          <span className="text-warning text-xs w-16 text-right">
                            {((exp.installmentAmount * exp.installments) - exp.total) > 0
                              ? `+${formatCurrency((exp.installmentAmount * exp.installments) - exp.total)}`
                              : '$0'}
                          </span>
                          <div className="flex flex-col items-center gap-1 w-24">
                            <span className="text-[10px] text-muted-foreground">{pendientes.length} rest ({exp.current}/{exp.installments})</span>
                            <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${(pagadas.length / (cuotas.length || 1)) * 100}%` }} />
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs w-20 text-right">{formatCurrency(exp.total)}</span>
                        </div>

                        {/* Actions — ALWAYS VISIBLE (not hover-only, works on mobile) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {exp.installments > 1 && (
                            <button
                              onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50"
                              title="Ver cuotas"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                          <button
                            onClick={() => setEditingExpense({ ...exp })}
                            className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('¿Seguro que querés eliminar este gasto?')) return;
                              await handleDeleteExpense(exp.id);
                            }}
                            disabled={loadingAction}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 p-2 rounded-lg hover:bg-secondary/50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Expanded cuotas ──────────────────────── */}
                    {isExpanded && exp.installments > 1 && (
                      <div className="px-4 md:px-6 py-4 bg-secondary/20">
                        <div className="bg-card/50 border border-border rounded-xl p-4 animate-fade-in">
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Desglose de Cuotas
                          </h5>

                          <div className="space-y-1">
                            {cuotas.map(c => {
                              const isPaid   = c.estado === 'Pagada';
                              const isActual = c.estado === 'Actual';

                              return (
                                <div
                                  key={c.numero}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                    ${isPaid ? 'bg-success/5 border border-success/10' : isActual ? 'bg-primary/5 border border-primary/15' : 'border border-transparent hover:bg-secondary/30'}`}
                                >
                                  {/* Toggle pagado/pendiente — siempre habilitado, funciona en mobile */}
                                  <button
                                    onClick={() => handleTogglePaid(exp, c.numero, isPaid)}
                                    disabled={loadingAction}
                                    className={`shrink-0 transition-all duration-150 disabled:opacity-50
                                      ${isPaid
                                        ? 'text-success hover:text-muted-foreground hover:scale-90'
                                        : 'text-muted-foreground hover:text-success hover:scale-110'}`}
                                    title={isPaid ? 'Desmarcar (volver a pendiente)' : 'Marcar como pagada'}
                                  >
                                    {isPaid
                                      ? <CheckCircle2 size={18} />
                                      : <Circle size={18} />
                                    }
                                  </button>

                                  {/* Cuota number */}
                                  <span className={`font-mono text-xs w-8 shrink-0 ${isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    #{c.numero}
                                  </span>

                                  {/* Date + note */}
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${isPaid ? 'text-muted-foreground line-through decoration-success/60' : isActual ? 'text-primary font-medium' : 'text-foreground'}`}>
                                      {c.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    {c.nota && (
                                      <span className="block text-[10px] text-accent mt-0.5">{c.nota}</span>
                                    )}
                                  </div>

                                  {/* Amount */}
                                  <span className={`font-bold text-sm shrink-0 ${isPaid ? 'text-muted-foreground line-through decoration-success/60' : isActual ? 'text-primary' : 'text-foreground'}`}>
                                    {formatCurrency(c.monto)}
                                  </span>

                                  {/* Status badge */}
                                  <span className={`hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0
                                    ${isPaid   ? 'bg-success/10 text-success border border-success/20' :
                                      isActual ? 'bg-primary/20 text-primary border border-primary/30' :
                                                 'bg-muted/50 text-muted-foreground border border-border'}`}>
                                    {isPaid ? '✓ Pagada' : isActual ? '↻ Actual' : '· Pendiente'}
                                  </span>

                                  {/* Edit button — ALWAYS VISIBLE */}
                                  <button
                                    onClick={() => handleEditCuota(exp, c)}
                                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
                                    title="Editar cuota"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Summary footer */}
                          <div className="flex flex-wrap items-center gap-4 text-sm border-t border-border pt-3 mt-3">
                            <div>
                              <span className="text-muted-foreground">Pagado: </span>
                              <span className="text-success font-bold">{formatCurrency(totalPagado)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pendiente: </span>
                              <span className="text-foreground font-bold">{formatCurrency(totalPendiente)}</span>
                            </div>
                            {pendientes.length > 0 && (
                              <div className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-medium">
                                Próx: {pendientes[0].fecha.toLocaleDateString('es-AR')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {cardExpenses.length === 0 && (
                <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                  No hay gastos en este medio de pago.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog: todas las cuotas pagas ───────────────────── */}
      <Dialog open={!!completedExpenseId} onOpenChange={(o) => !o && setCompletedExpenseId(null)}>
        <DialogContent className="glass-panel border-border sm:max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <PartyPopper size={48} style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 8px hsl(153 100% 50% / 0.6))' }} />
            </div>
            <DialogTitle className="text-foreground text-xl">
              ¡Todas las cuotas están pagas!
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            ¿Querés eliminar este gasto del registro? Podés dejarlo como historial o borrarlo.
          </p>
          <DialogFooter className="mt-6 flex gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCompletedExpenseId(null)}
            >
              Mantener
            </Button>
            <Button
              className="flex-1"
              style={{ background: 'hsl(153 100% 50%)', color: 'hsl(153 100% 5%)' }}
              disabled={loadingAction}
              onClick={() => completedExpenseId && handleDeleteExpense(completedExpenseId)}
            >
              {loadingAction ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: editar gasto ─────────────────────────────── */}
      {editingExpense && (
        <Dialog open={!!editingExpense} onOpenChange={(o) => !o && setEditingExpense(null)}>
          <DialogContent className="glass-panel border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Descripción</label>
                <input className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.desc} onChange={e => setEditingExpense({ ...editingExpense, desc: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Medio de Pago</label>
                <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.cardId || ''} onChange={e => setEditingExpense({ ...editingExpense, cardId: e.target.value || undefined })}>
                  <option value="" className="bg-card">Sin medio de pago</option>
                  {cards.map(c => <option key={c.id} value={c.id} className="bg-card">{c.bank ? `${c.bank} — ` : ''}{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Monto Total</label>
                  <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.total} onChange={e => setEditingExpense({ ...editingExpense, total: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Monto por Cuota</label>
                  <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.installmentAmount || ''} onChange={e => setEditingExpense({ ...editingExpense, installmentAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Fecha primera cuota</label>
                <input type="date" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground [color-scheme:dark]" value={editingExpense.date} onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Categoría</label>
                  <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.category} onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Periodicidad</label>
                  <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.periodicidad} onChange={e => setEditingExpense({ ...editingExpense, periodicidad: e.target.value as Expense['periodicidad'] })}>
                    <option value="semanal"   className="bg-card">Semanal</option>
                    <option value="quincenal" className="bg-card">Quincenal</option>
                    <option value="mensual"   className="bg-card">Mensual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Cuota Actual</label>
                  <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.current} onChange={e => setEditingExpense({ ...editingExpense, current: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cuotas Totales</label>
                  <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.installments} onChange={e => setEditingExpense({ ...editingExpense, installments: Number(e.target.value) })} />
                </div>
              </div>
              <Button className="w-full" disabled={loadingAction} onClick={async () => {
                setLoadingAction(true);
                try {
                  await updateExpense(editingExpense);
                  setEditingExpense(null);
                } catch {
                  toast({ title: 'Error al actualizar', variant: 'destructive' });
                } finally {
                  setLoadingAction(false);
                }
              }}>
                {loadingAction ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Dialog: editar cuota individual ──────────────────── */}
      {editingInstallment && (
        <Dialog open={!!editingInstallment} onOpenChange={(o) => !o && setEditingInstallment(null)}>
          <DialogContent className="glass-panel border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Cuota #{editingInstallment.num}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Monto</label>
                <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground"
                  value={editingInstallment.monto}
                  onChange={e => setEditingInstallment({ ...editingInstallment, monto: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Fecha de vencimiento</label>
                <input type="date" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground [color-scheme:dark]"
                  value={editingInstallment.fecha}
                  onChange={e => setEditingInstallment({ ...editingInstallment, fecha: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nota (opcional)</label>
                <input type="text" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: Pago adelantado"
                  value={editingInstallment.nota}
                  onChange={e => setEditingInstallment({ ...editingInstallment, nota: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setEditingInstallment(null)}>Cancelar</Button>
              <Button onClick={handleSaveCuota} disabled={loadingAction}>
                {loadingAction ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
