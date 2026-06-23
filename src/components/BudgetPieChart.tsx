import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinanzas } from '@/hooks/useFinanzas';
import { useCurrency } from '@/contexts/CurrencyContext';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#a855f7'];

export default function BudgetPieChart() {
  // jornadas es la fuente de verdad para gasto_nafta de Uber
  const { gastosDiarios, jornadas } = useFinanzas();
  const { format } = useCurrency();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const data = useMemo(() => {
    const map: Record<string, number> = {};

    // Gastos diarios normales
    gastosDiarios
      .filter(g => new Date(g.fecha).getTime() >= startOfMonth)
      .forEach(g => {
        map[g.categoria] = (map[g.categoria] || 0) + g.monto;
      });

    // Nafta de jornadas Uber como categoría "Combustible"
    const naftaMes = jornadas
      .filter(j => new Date(j.fecha + 'T00:00:00').getTime() >= startOfMonth)
      .reduce((a, j) => a + j.gasto_nafta, 0);
    if (naftaMes > 0) {
      map['Combustible'] = (map['Combustible'] || 0) + naftaMes;
    }

    const total = Object.values(map).reduce((a, v) => a + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [gastosDiarios, jornadas, startOfMonth]);

  const total = data.reduce((a, d) => a + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="glass-panel border-border rounded-2xl p-6 flex flex-col items-center justify-center h-64 opacity-60">
        <p className="text-muted-foreground text-sm">Sin gastos registrados este mes</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border-border rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Gastos por Categoría</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total mes: <span className="text-foreground font-bold">{format(total)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="w-full md:w-56 h-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [format(v), 'Gasto']}
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 7%)',
                  border: '1px solid hsl(217 33% 14%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-sm text-muted-foreground flex-1 truncate">{entry.name}</span>
              <span className="text-sm font-bold text-foreground shrink-0">{format(entry.value)}</span>
              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{entry.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
