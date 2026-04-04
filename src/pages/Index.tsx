import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, Bell, Printer, History, Sparkles, Loader2, TrendingUp, CreditCard, PlusCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { generateMonthlySummary, generateNextMonthPrediction } from '@/services/openai';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const { cards, expenses, alertThreshold, subscriptionAlertDays, getCardProjected, nextMonthTotal, totalBudget, loadingData } = useApp();
  const { subscriptions } = useSubscriptions();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const [summary, setSummary] = useState<string | null>(() => localStorage.getItem('lastOpenAI_Summary'));
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setShowSummaryModal(true);
    try {
      // Tomamos contexto requerido
      const context = {
        totalPresupuesto: totalBudget,
        metricsTarjetas: cards, // No enviamos 'metrics' entero por si es circular
        suscripcionesActivas: subscriptions.filter(s => s.estado === 'Activa').map(s => ({ nombre: s.nombre, monto: s.monto })),
        gastosTotalesNextMonth: nextMonthTotal
      };
      const result = await generateMonthlySummary(context);
      setSummary(result);
      localStorage.setItem('lastOpenAI_Summary', result);
    } catch (e: any) {
      setSummary("Hubo un error al generar el resumen: " + e.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGeneratePrediction = async () => {
    setLoadingPrediction(true);
    try {
      const tresMeses = new Date();
      tresMeses.setMonth(tresMeses.getMonth() - 3);
      const limitDate = tresMeses.toISOString();

      const context = {
        presupuestosTotales: totalBudget,
        tarjetas: cards,
        suscripcionesActivas: subscriptions.filter(s => s.estado === 'Activa').map(s => ({ nombre: s.nombre, monto: s.monto })),
        gastosRecientes: expenses.filter(e => e.date >= limitDate).map(e => ({ desc: e.desc, category: e.category, installment: e.installmentAmount || Math.round(e.total/e.installments), cuotasRestantes: e.installments - e.current  })),
      };
      
      const result = await generateNextMonthPrediction(context);
      setPrediction(result);
    } catch (e: any) {
      console.error(e);
      setPrediction({ error: e.message });
    } finally {
      setLoadingPrediction(false);
    }
  };

  const metrics = useMemo(() => {
    const cardMetrics = cards.map(card => {
      const projected = getCardProjected(card.id);
      return { ...card, projected, available: card.budget - projected, usage: card.budget > 0 ? (projected / card.budget) * 100 : 0 };
    });

    const endingSoon = expenses.filter(e => e.installments > 1 && (e.installments - e.current) <= 2);

    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      const cuota = e.installmentAmount || Math.round(e.total / e.installments);
      categoryMap[e.category] = (categoryMap[e.category] || 0) + cuota;
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const completedExpenses = expenses.filter(e => e.current >= e.installments && e.installments > 1);

    return { cardMetrics, endingSoon, pieData, completedExpenses };
  }, [cards, expenses, alertThreshold, getCardProjected]);

  const subMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = subscriptions
      .filter(s => s.estado === 'Activa')
      .map(s => {
        const billingDate = new Date(s.fecha_proximo_cobro + 'T00:00:00');
        const diffTime = billingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...s, diffDays };
      })
      .filter(s => s.diffDays >= 0 && s.diffDays <= 7)
      .sort((a, b) => a.diffDays - b.diffDays);
      
    return upcoming;
  }, [subscriptions]);

  const cardsAlerts = metrics.cardMetrics.filter(cm => cm.usage >= alertThreshold);
  const subAlerts = subMetrics.filter(s => s.diffDays <= subscriptionAlertDays);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-widest pl-1">Resumen General</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-display bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto]">
            {showHistory ? 'Historial' : formatCurrency(nextMonthTotal)}
            {!showHistory && <span className="text-xl text-muted-foreground/60 font-medium ml-3 lowercase">/ mes próximo</span>}
          </h2>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right hidden lg:block">
             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Presupuesto Total</p>
             <p className="text-lg font-bold text-foreground">{formatCurrency(totalBudget)}</p>
          </div>
          <Button variant={showHistory ? 'default' : 'outline'} size="icon" onClick={() => setShowHistory(!showHistory)} className="border-border/50 hover:bg-secondary/80" title="Ver Historial">
             <History size={18} />
          </Button>
          <Button onClick={() => summary ? setShowSummaryModal(true) : handleGenerateSummary()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" title="Resumen Inteligente">
             <Sparkles size={16} /> <span className="hidden md:inline">Resumen IA</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => window.print()} className="print:hidden border-border/50 bg-secondary/30 hover:bg-secondary/80" title="Exportar a PDF">
             <Printer size={18} />
          </Button>
        </div>
      </header>

      {!loadingData && cards.length === 0 && expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center surface-elevated rounded-3xl mt-8 border border-dashed border-primary/30 relative overflow-hidden animate-fade-in shadow-[0_0_50px_hsl(var(--primary)/0.1)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
           <CreditCard size={64} className="text-primary mb-6 animate-pulse" />
           <h2 className="text-3xl font-black mb-3">¡Bienvenido a CuotaCtrl!</h2>
           <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
             Este es tu espacio personal para organizar tus finanzas. Para empezar a rastrear tus gastos y cuotas, primero necesitas registrar al menos una tarjeta o billetera virtual.
           </p>
           <Button onClick={() => navigate('/tarjetas')} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/30">
              <PlusCircle /> Agregar mi Primera Tarjeta
           </Button>
        </div>
      ) : showHistory ? (
        <div className="surface-elevated rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-bold text-foreground">Gastos Finalizados</h3>
            <p className="text-sm text-muted-foreground mt-1">Historial de deudas o cuotas que ya han sido pagadas por completo.</p>
          </div>
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-secondary text-muted-foreground text-[10px] uppercase tracking-widest">
                 <th className="px-6 py-4 font-semibold">Gasto</th>
                 <th className="px-6 py-4 font-semibold">Categoría</th>
                 <th className="px-6 py-4 font-semibold text-right">Total Pagado</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border">
               {metrics.completedExpenses.length === 0 ? (
                 <tr>
                   <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No hay gastos finalizados en el historial.</td>
                 </tr>
               ) : (
                 metrics.completedExpenses.map(exp => (
                   <tr key={`he-${exp.id}`} className="hover:bg-secondary/50 transition-colors">
                     <td className="px-6 py-4">
                       <p className="text-foreground font-medium text-sm">{exp.desc}</p>
                       <p className="text-muted-foreground text-xs text-[10px]">{exp.installments} cuotas</p>
                     </td>
                     <td className="px-6 py-4 text-muted-foreground text-sm">{exp.category}</td>
                     <td className="px-6 py-4 text-right">
                       <p className="text-foreground font-bold text-sm tracking-display">{formatCurrency(exp.total)}</p>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Alerts */}
          {(cardsAlerts.length > 0 || subAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardsAlerts.map(cm => (
            <div
              key={`c-a-${cm.id}`}
              className={`p-4 rounded-2xl flex items-center gap-4 glass-card ${
                cm.usage >= 100
                  ? 'border-destructive/50 shadow-[0_0_15px_hsl(var(--destructive)/0.3)] text-destructive'
                  : 'border-warning/50 shadow-[0_0_15px_hsl(var(--warning)/0.3)] text-warning'
              }`}
            >
              <AlertCircle size={24} />
              <div>
                <p className="font-bold text-sm">{cm.usage >= 100 ? 'Presupuesto Superado' : 'Cerca del Límite'}</p>
                <p className="text-xs opacity-80">{cm.bank}: {Math.round(cm.usage)}% del presupuesto asignado.</p>
              </div>
            </div>
          ))}
          {subAlerts.map(sa => (
            <div
              key={`s-a-${sa.id}`}
              className="p-4 rounded-2xl flex items-center gap-4 glass-card border-warning/50 shadow-[0_0_15px_hsl(var(--warning)/0.3)] text-warning"
            >
              <Bell size={24} />
              <div>
                <p className="font-bold text-sm">Cobro Próximo</p>
                <p className="text-xs opacity-80">{sa.nombre} se debitará en {sa.diffDays === 0 ? 'hoy' : `${sa.diffDays} días`} por {formatCurrency(sa.monto)}.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cards + Category chart */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Tus Tarjetas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.cardMetrics.map(cm => (
              <CreditCardVisual
                key={cm.id}
                card={cm}
                projected={cm.projected}
                onClick={() => navigate(`/tarjetas/${cm.id}`)}
              />
            ))}
          </div>

          {/* Pie chart */}
          <div className="surface-elevated rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Distribución por Categoría</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {metrics.pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(260 40% 10%)', border: '1px solid hsl(260 40% 20%)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {metrics.pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          {/* Predicción IA */}
          <div className="surface-elevated rounded-2xl p-6 mt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="text-primary" /> Predicción del Próximo Mes
              </h2>
              {!prediction && !loadingPrediction && (
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10 text-primary gap-2" onClick={handleGeneratePrediction}>
                  <Sparkles size={16} /> Analizar
                </Button>
              )}
            </div>

            {loadingPrediction && (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-muted-foreground text-sm">Calculando estimaciones basándose en tu historial...</p>
              </div>
            )}

            {prediction?.error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                No se pudo generar la predicción: {prediction.error}
              </div>
            )}

            {prediction && !prediction.error && (
              <div className="animate-fade-in space-y-6">
                {prediction.alertaPresupuestoGlobal && (
                  <div className="p-4 rounded-xl glass-card border-destructive/50 text-destructive flex items-start gap-4">
                    <AlertCircle className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Alerta Presupuestaria General</p>
                      <p className="text-sm opacity-90">{prediction.mensajeGeneral}</p>
                    </div>
                  </div>
                )}
                {!prediction.alertaPresupuestoGlobal && prediction.mensajeGeneral && (
                  <p className="text-muted-foreground italic text-sm">{prediction.mensajeGeneral}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <h3 className="font-bold text-foreground mb-4 opacity-80 uppercase tracking-widest text-[10px]">Gasto Esperado</h3>
                     <div className="space-y-3">
                       {prediction.totalGastosCategoria?.map((cat: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-secondary/30 p-2.5 rounded-lg text-sm">
                            <span className="text-muted-foreground font-medium">{cat.categoria}</span>
                            <span className="font-bold text-foreground">{formatCurrency(cat.monto)}</span>
                          </div>
                       ))}
                       {(!prediction.totalGastosCategoria || prediction.totalGastosCategoria.length === 0) && (
                          <p className="text-xs text-muted-foreground">No hay estimaciones suficientes.</p>
                       )}
                     </div>
                  </div>
                  
                  <div>
                     <h3 className="font-bold text-foreground mb-4 opacity-80 uppercase tracking-widest text-[10px]">Alertas de Tarjetas</h3>
                     {(!prediction.riesgoTarjetas || prediction.riesgoTarjetas.length === 0) ? (
                       <p className="text-muted-foreground text-sm bg-success/10 text-success p-3 rounded-xl border border-success/20">No hay tarjetas en riesgo inminente.</p>
                     ) : (
                       <div className="space-y-3">
                         {prediction.riesgoTarjetas?.map((riesgo: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 bg-secondary/20 p-3 rounded-xl border border-border">
                               {riesgo.alertaCritica ? <AlertCircle className="text-destructive shrink-0 mt-0.5" size={16} /> : <AlertCircle className="text-warning shrink-0 mt-0.5" size={16} />}
                               <div>
                                 <p className={`font-bold text-sm ${riesgo.alertaCritica ? 'text-destructive' : 'text-warning'}`}>{riesgo.nombreTarjeta}</p>
                                 <p className="text-xs text-muted-foreground mt-1">{riesgo.mensaje}</p>
                               </div>
                            </div>
                         ))}
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar content */}
        <div className="space-y-6">
          {/* Ending soon */}
          <h2 className="text-xl font-bold text-foreground">Terminan pronto</h2>
          {metrics.endingSoon.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay cuotas por finalizar.</p>
          ) : (
            <div className="space-y-3">
              {metrics.endingSoon.map(exp => {
                const remaining = exp.installments - exp.current;
                return (
                  <div key={exp.id} className="surface-elevated p-4 rounded-xl flex justify-between items-center interactive-press">
                    <div>
                      <p className="text-foreground font-medium text-sm">{exp.desc}</p>
                      <p className="text-muted-foreground text-xs">
                        {remaining === 0 ? 'Última cuota este mes' : `Quedan ${remaining} cuota${remaining > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold text-sm">{formatCurrency(exp.installmentAmount || Math.round(exp.total / exp.installments))}</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {exp.current}/{exp.installments}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming Subscriptions */}
          <h2 className="text-xl font-bold text-foreground pt-4">Suscripciones próximas</h2>
          {subMetrics.length === 0 ? (
            <div className="surface-elevated p-5 rounded-xl border border-dashed border-border flex flex-col items-center text-center opacity-70">
              <Bell className="text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">No hay suscripciones que cobrar en los próximos 7 días.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subMetrics.map(sub => {
                const card = cards.find(c => c.id === sub.tarjeta_id);
                return (
                  <div key={sub.id} className="surface-elevated p-4 rounded-xl flex items-center justify-between interactive-press" onClick={() => navigate('/suscripciones')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                        <span className="text-lg font-bold">{sub.nombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{sub.nombre}</p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          {card?.bank || 'Tarjeta Borrada'} • Falta{sub.diffDays !== 1 ? 'n' : ''} {sub.diffDays === 0 ? 'hoy' : `${sub.diffDays} d`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground font-bold text-sm">{formatCurrency(sub.monto)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* OpenAI Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="glass-panel border-border sm:max-w-xl max-h-[80vh] overflow-y-auto w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="text-primary" size={20} />
              Análisis Inteligente del Mes
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {loadingSummary ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Analizando tus finanzas con IA...</p>
              </div>
            ) : summary ? (
              <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n|-(?=\s)/g, '<br/>&bull;') }} />
            ) : null}
            {!loadingSummary && (
              <div className="mt-8 flex justify-end">
                <Button variant="outline" onClick={handleGenerateSummary} className="gap-2 text-xs h-8" disabled={loadingSummary}>
                   <Sparkles size={12} /> Volver a Generar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
