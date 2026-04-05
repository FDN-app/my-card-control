import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/store';
import { formatCurrency, type Expense, CATEGORIES } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const generateInstallments = (exp: Expense) => {
  const arr = [];
  const start = new Date(exp.date);
  // normaliza al inicio del dia
  start.setHours(0, 0, 0, 0);

  for (let i = 1; i <= exp.installments; i++) {
     let d = new Date(start);
     if (exp.periodicidad === 'semanal') {
       d.setDate(d.getDate() + (i - 1) * 7);
     } else if (exp.periodicidad === 'quincenal') {
       d.setDate(d.getDate() + (i - 1) * 15);
     } else {
       d.setMonth(d.getMonth() + (i - 1));
     }

     let baseMonto = exp.installmentAmount || Math.round(exp.total / exp.installments);
     let eliminada = false;
     let nota = '';

     if (exp.modificaciones_cuotas?.[i]) {
       const mod = exp.modificaciones_cuotas[i];
       if (mod.monto !== undefined) baseMonto = mod.monto;
       if (mod.fecha) d = new Date(mod.fecha);
       if (mod.nota) nota = mod.nota;
       if (mod.eliminada) eliminada = true;
     }

     let estado = 'Pendiente';
     if (i < exp.current) estado = 'Pagada';
     else if (i === exp.current) estado = 'Actual';

     arr.push({
       numero: i,
       fecha: d,
       monto: baseMonto,
       eliminada,
       nota,
       estado
     });
  }
  return arr.filter(c => !c.eliminada); 
};

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, expenses, deleteExpense, updateExpense, getCardExpenses } = useApp();
  const { toast } = useToast();
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedExpense, setExpandedExpense] = useState<string | number | null>(null);
  
  // Installment Editing
  const [editingInstallment, setEditingInstallment] = useState<{ exp: Expense, num: number, monto: number, fecha: string, nota: string } | null>(null);
  
  const [loadingAction, setLoadingAction] = useState(false);

  const card = cards.find(c => c.id === id);
  const cardExpenses = useMemo(() => getCardExpenses(id || ''), [getCardExpenses, id]);

  const projected = useMemo(() => {
    return cardExpenses.reduce((acc, exp) => {
      const cuotas = generateInstallments(exp);
      const remaining = cuotas.filter(c => c.numero >= exp.current);
      return acc + (remaining.length > 0 ? remaining[0].monto : 0);
    }, 0);
  }, [cardExpenses]);

  const projectionData = useMemo(() => {
    const data = Array.from({ length: 6 }).map((_, i) => {
       const d = new Date();
       d.setMonth(d.getMonth() + i);
       return { 
         name: d.toLocaleString('es-AR', { month: 'short' }).toUpperCase(), 
         year: d.getFullYear(), 
         month: d.getMonth(),
         total: 0 
       };
    });

    cardExpenses.forEach(exp => {
       const cuotas = generateInstallments(exp).filter(c => c.numero >= exp.current);
       cuotas.forEach(cuota => {
          const cy = cuota.fecha.getFullYear();
          const cm = cuota.fecha.getMonth();
          const target = data.find(d => d.year === cy && d.month === cm);
          if (target) target.total += cuota.monto;
       });
    });
    return data;
  }, [cardExpenses]);

  if (!card) return <div className="text-foreground p-8">Tarjeta no encontrada.</div>;

  const handleEditCuota = (exp: Expense, cuota: any) => {
    setEditingInstallment({
      exp,
      num: cuota.numero,
      monto: cuota.monto,
      fecha: cuota.fecha.toISOString().slice(0, 10),
      nota: cuota.nota || ''
    });
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
      toast({ title: 'Cuota actualizada exitosamente' });
    } catch (e) {
      toast({ title: 'Error al actualizar cuota', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteCuota = async (exp: Expense, num: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta cuota?')) return;
    
    const mods = { ...(exp.modificaciones_cuotas || {}) };
    mods[num] = { ...(mods[num] || {}), eliminada: true };
    
    let newCurrent = exp.current;
    if (num === exp.current) {
       // Buscar la proxima cuota que no esté eliminada
       let next = num + 1;
       while (next <= exp.installments && mods[next]?.eliminada) {
         next++;
       }
       newCurrent = next;
    }
    
    try {
      await updateExpense({ ...exp, modificaciones_cuotas: mods, current: newCurrent });
      toast({ title: 'Cuota eliminada exitosamente' });
    } catch (e) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-right">
      <button onClick={() => navigate('/tarjetas')} className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm interactive-press">
        <ArrowLeft size={16} /> Volver a Tarjetas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <CreditCardVisual card={card} projected={projected} />
          <div className="surface-elevated p-6 rounded-2xl space-y-4">
            <h4 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Métricas</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Presupuesto</span>
              <span className="text-foreground font-medium">{formatCurrency(card.budget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Disponible</span>
              <span className={`font-medium ${card.budget - projected < 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(card.budget - projected)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Gastos activos</span>
              <span className="text-foreground font-medium">{cardExpenses.length}</span>
            </div>
          </div>
          <Button className="w-full gap-2" onClick={() => navigate('/gastos/nuevo')}>
            <Plus size={16} /> Agregar Gasto
          </Button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Projection chart */}
          <div className="surface-elevated rounded-2xl p-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto] mb-6">Proyección de Deuda (6 meses)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 14%)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'hsl(217 33% 14%)' }}
                    contentStyle={{ backgroundColor: 'hsl(222 47% 7%)', border: '1px solid hsl(217 33% 14%)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses table */}
          <div className="surface-elevated rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-muted-foreground text-[10px] uppercase tracking-widest">
                  <th className="px-6 py-4 font-semibold">Gasto</th>
                  <th className="px-6 py-4 font-semibold text-right">Vr. Cuota</th>
                  <th className="px-6 py-4 font-semibold text-right">Interés</th>
                  <th className="px-6 py-4 font-semibold text-center">Progreso</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Orig.</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cardExpenses.map(exp => {
                  const cuotas = generateInstallments(exp);
                  const pagadas = cuotas.filter(c => c.numero < exp.current);
                  const pendientes = cuotas.filter(c => c.numero >= exp.current);
                  const totalPagado = pagadas.reduce((a,c) => a + c.monto, 0);
                  const totalPendiente = pendientes.reduce((a,c) => a + c.monto, 0);
                  
                  const isExpanded = expandedExpense === exp.id;
                  
                  return (
                    <React.Fragment key={exp.id}>
                      <tr className="hover:bg-secondary/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <p className="text-foreground font-medium text-sm">{exp.desc}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-muted-foreground text-xs">{exp.category}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border 
                                ${exp.periodicidad === 'semanal' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                  exp.periodicidad === 'quincenal' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                  'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                {exp.periodicidad ? exp.periodicidad.charAt(0).toUpperCase() + exp.periodicidad.slice(1) : 'Mensual'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-foreground font-bold text-sm tracking-display">{formatCurrency(pendientes.length > 0 ? pendientes[0].monto : (exp.installmentAmount || Math.round(exp.total / exp.installments)))}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-warning font-medium text-xs">
                            {((exp.installmentAmount * exp.installments) - exp.total) > 0 ? 
                              `+${formatCurrency((exp.installmentAmount * exp.installments) - exp.total)}` : 
                              '$0'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{pendientes.length} rest ({exp.current}/{exp.installments})</span>
                            <div className="w-24 bg-secondary h-1 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${(pagadas.length / (cuotas.length || 1)) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-muted-foreground font-bold text-xs">{formatCurrency(exp.total)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                            {exp.installments > 1 && (
                               <button onClick={() => setExpandedExpense(isExpanded ? null : exp.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Ver Cuotas">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                               </button>
                            )}
                            <button onClick={() => setEditingExpense({...exp})} className="text-muted-foreground hover:text-primary transition-colors p-1">
                              <Pencil size={16} />
                            </button>
                            <button onClick={async () => {
                              setLoadingAction(true);
                              try {
                                await deleteExpense(exp.id);
                              } catch (e) {
                                toast({ title: 'Error', description: 'No se pudo eliminar el gasto', variant: 'destructive' });
                              } finally {
                                setLoadingAction(false);
                              }
                            }} disabled={loadingAction} className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Cuotas Row */}
                      {isExpanded && exp.installments > 1 && (
                        <tr className="bg-secondary/30">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="bg-card/50 border border-border rounded-xl p-4 animate-fade-in">
                               <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Desglose de Cuotas</h5>
                               <div className="overflow-x-auto">
                                 <table className="w-full text-left text-sm mb-4">
                                   <thead>
                                     <tr className="text-muted-foreground border-b border-border/50">
                                       <th className="pb-2 font-medium">Cuota</th>
                                       <th className="pb-2 font-medium">Vencimiento</th>
                                       <th className="pb-2 font-medium text-right">Monto</th>
                                       <th className="pb-2 font-medium text-right">Estado</th>
                                       <th className="pb-2"></th>
                                     </tr>
                                   </thead>
                                   <tbody className="divide-y divide-border/20">
                                     {cuotas.map(c => (
                                        <tr key={c.numero} className="group/cuota">
                                          <td className="py-2.5">
                                            <span className="text-foreground">{c.numero}</span> <span className="text-muted-foreground text-xs">/ {exp.installments}</span>
                                          </td>
                                          <td className="py-2.5 text-muted-foreground">
                                            {c.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            {c.nota && <span className="block text-[10px] text-accent mt-0.5">{c.nota}</span>}
                                          </td>
                                          <td className="py-2.5 text-right font-medium text-foreground">
                                            {formatCurrency(c.monto)}
                                          </td>
                                          <td className="py-2.5 text-right">
                                            <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1.5
                                              ${c.estado === 'Pagada' ? 'bg-success/10 text-success' : 
                                                c.estado === 'Actual' ? 'bg-primary/20 text-primary border border-primary/30 font-bold' : 
                                                'bg-muted/50 text-muted-foreground'}`}>
                                              {c.estado === 'Pagada' && '✅ '}
                                              {c.estado === 'Actual' && '🔄 '}
                                              {c.estado === 'Pendiente' && '⏳ '}
                                              {c.estado}
                                            </span>
                                          </td>
                                          <td className="py-2.5 text-right opacity-0 group-hover/cuota:opacity-100 transition-opacity w-16">
                                            <div className="flex justify-end gap-2">
                                              <button onClick={() => handleEditCuota(exp, c)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil size={14}/></button>
                                              <button onClick={() => handleDeleteCuota(exp, c.numero)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                          </td>
                                        </tr>
                                     ))}
                                   </tbody>
                                 </table>
                               </div>
                               
                               <div className="flex items-center gap-6 text-sm border-t border-border pt-3">
                                 <div>
                                   <span className="text-muted-foreground">Total Pagado: </span>
                                   <span className="text-foreground font-bold">{formatCurrency(totalPagado)}</span>
                                 </div>
                                 <div>
                                   <span className="text-muted-foreground">Total Pendiente: </span>
                                   <span className="text-foreground font-bold">{formatCurrency(totalPendiente)}</span>
                                 </div>
                                 <div className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-medium">
                                   Próx. vencimiento: {pendientes.length > 0 ? pendientes[0].fecha.toLocaleDateString('es-AR') : '-'}
                                 </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingExpense && (
        <Dialog open={!!editingExpense} onOpenChange={(o) => !o && setEditingExpense(null)}>
          <DialogContent className="glass-panel border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               <div>
                  <label className="text-sm text-muted-foreground">Descripción</label>
                  <input className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.desc} onChange={e => setEditingExpense({...editingExpense, desc: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Monto Total</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.total} onChange={e => setEditingExpense({...editingExpense, total: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Monto por Cuota</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.installmentAmount || ''} onChange={e => setEditingExpense({...editingExpense, installmentAmount: Number(e.target.value)})} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm text-muted-foreground">Categoría</label>
                   <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.category} onChange={e => setEditingExpense({...editingExpense, category: e.target.value})}>
                     {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-sm text-muted-foreground">Periodicidad</label>
                   <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.periodicidad} onChange={e => setEditingExpense({...editingExpense, periodicidad: e.target.value as any})}>
                     <option value="semanal" className="bg-card">Semanal</option>
                     <option value="quincenal" className="bg-card">Quincenal</option>
                     <option value="mensual" className="bg-card">Mensual</option>
                   </select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Cuota Actual</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.current} onChange={e => setEditingExpense({...editingExpense, current: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cuotas Totales</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.installments} onChange={e => setEditingExpense({...editingExpense, installments: Number(e.target.value)})} />
                  </div>
               </div>
               <Button className="w-full" disabled={loadingAction} onClick={async () => {
                  setLoadingAction(true);
                  try {
                    await updateExpense(editingExpense);
                    setEditingExpense(null);
                  } catch (e) {
                    toast({ title: 'Error al actualizar', variant: 'destructive' });
                  } finally {
                    setLoadingAction(false);
                  }
               }}>
                 {loadingAction ? 'Guardando...' : 'Guardar'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Edición de Cuota Individual */}
      {editingInstallment && (
        <Dialog open={!!editingInstallment} onOpenChange={(o) => !o && setEditingInstallment(null)}>
          <DialogContent className="glass-panel border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Cuota {editingInstallment.num}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Monto</label>
                <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" 
                  value={editingInstallment.monto} 
                  onChange={e => setEditingInstallment({...editingInstallment, monto: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Fecha de vencimiento</label>
                <input type="date" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" 
                  value={editingInstallment.fecha} 
                  onChange={e => setEditingInstallment({...editingInstallment, fecha: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nota opcional</label>
                <input type="text" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" 
                  placeholder="Ej: Pago adelantado"
                  value={editingInstallment.nota} 
                  onChange={e => setEditingInstallment({...editingInstallment, nota: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setEditingInstallment(null)}>Cancelar</Button>
              <Button onClick={handleSaveCuota} disabled={loadingAction}>{loadingAction ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
