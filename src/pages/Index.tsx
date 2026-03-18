import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/store';
import { formatCurrency } from '@/lib/data';
import { CreditCardVisual } from '@/components/CreditCardVisual';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const { cards, expenses, alertThreshold, getCardProjected, nextMonthTotal, totalBudget } = useApp();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    const cardMetrics = cards.map(card => {
      const projected = getCardProjected(card.id);
      return { ...card, projected, available: card.budget - projected, usage: card.budget > 0 ? (projected / card.budget) * 100 : 0 };
    });

    const endingSoon = expenses.filter(e => e.installments > 1 && (e.installments - e.current) <= 2);

    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      const cuota = Math.round(e.total / e.installments);
      categoryMap[e.category] = (categoryMap[e.category] || 0) + cuota;
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    return { cardMetrics, endingSoon, pieData };
  }, [cards, expenses, alertThreshold, getCardProjected]);

  const alerts = metrics.cardMetrics.filter(cm => cm.usage >= alertThreshold);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Resumen General</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-display text-foreground">
            {formatCurrency(nextMonthTotal)}
            <span className="text-lg text-muted-foreground font-normal ml-3">/ mes próximo</span>
          </h2>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Presupuesto Total</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalBudget)}</p>
        </div>
      </header>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map(cm => (
            <div
              key={cm.id}
              className={`p-4 rounded-xl flex items-center gap-4 border ${
                cm.usage >= 100
                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                  : 'bg-warning/10 border-warning/20 text-warning'
              }`}
            >
              <AlertCircle size={24} />
              <div>
                <p className="font-bold text-sm">{cm.usage >= 100 ? 'Presupuesto Superado' : 'Cerca del Límite'}</p>
                <p className="text-xs opacity-80">{cm.bank}: {Math.round(cm.usage)}% del presupuesto asignado.</p>
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
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(222 47% 7%)', border: '1px solid hsl(217 33% 14%)', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
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
        </div>

        {/* Ending soon */}
        <div className="space-y-6">
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
                      <p className="text-primary font-bold text-sm">{formatCurrency(Math.round(exp.total / exp.installments))}</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {exp.current}/{exp.installments}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
