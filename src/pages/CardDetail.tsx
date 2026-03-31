import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/store';
import { formatCurrency, type Expense, CATEGORIES } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, expenses, deleteExpense, updateExpense, getCardExpenses } = useApp();
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const card = cards.find(c => c.id === id);
  const cardExpenses = useMemo(() => getCardExpenses(id || ''), [getCardExpenses, id]);

  const projected = useMemo(() =>
    cardExpenses.reduce((acc, e) => acc + (e.installmentAmount || Math.round(e.total / e.installments)), 0),
    [cardExpenses]
  );

  const projectionData = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const total = cardExpenses.reduce((acc, exp) => {
        const remaining = exp.installments - exp.current;
        return i <= remaining ? acc + (exp.installmentAmount || Math.round(exp.total / exp.installments)) : acc;
      }, 0);
      return { name: d.toLocaleString('es-AR', { month: 'short' }), total };
    }),
    [cardExpenses]
  );

  if (!card) return <div className="text-foreground p-8">Tarjeta no encontrada.</div>;

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
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cardExpenses.map(exp => {
                  const remaining = exp.installments - exp.current;
                  return (
                    <tr key={exp.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-foreground font-medium text-sm">{exp.desc}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground text-xs">{exp.category}</p>
                          {remaining <= 1 && exp.installments > 1 && (
                            <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">
                              {remaining === 0 ? 'Última cuota' : '1 cuota más'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-foreground font-bold text-sm tracking-display">{formatCurrency(exp.installmentAmount || Math.round(exp.total / exp.installments))}</p>
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
                          <span className="text-[10px] text-muted-foreground">{remaining} restantes ({exp.current}/{exp.installments})</span>
                          <div className="w-24 bg-secondary h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${(exp.current / exp.installments) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-muted-foreground font-bold text-xs">{formatCurrency(exp.total)}</p>
                      </td>
                      <td className="px-6 py-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingExpense({...exp})} className="text-muted-foreground hover:text-primary transition-colors">
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
                          }} disabled={loadingAction} className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
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
               <div>
                 <label className="text-sm text-muted-foreground">Categoría</label>
                 <select className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.category} onChange={e => setEditingExpense({...editingExpense, category: e.target.value})}>
                   {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Cuotas (Actual)</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border p-2 rounded mt-1 text-foreground" value={editingExpense.current} onChange={e => setEditingExpense({...editingExpense, current: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cuotas (Total)</label>
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
    </div>
  );
}
