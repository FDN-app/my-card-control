import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFinanzas } from '@/hooks/useFinanzas';
import { useApp } from '@/lib/store';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useCurrency } from '@/contexts/CurrencyContext';

// FUENTE DE VERDAD:
// - Ingresos Uber → tabla `jornadas` (campo facturado). NO registrar también en tabla ingresos.
// - Gastos nafta Uber → tabla `jornadas` (campo gasto_nafta). NO registrar también en gastos_diarios.
// - Ingresos fijo/variable extra → tabla `ingresos`. NO duplicar lo que ya está en jornadas.
// - Salario base de referencia → configuracion_usuario.salario_mensual.

export default function NetBalance() {
  const { configuracion, ingresos, gastosDiarios, jornadas } = useFinanzas();
  const { nextMonthTotal } = useApp();
  const { subscriptions } = useSubscriptions();
  const { format } = useCurrency();

  const now = new Date();
  const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const endOfLastMonth  = startOfMonth - 1;

  const metrics = useMemo(() => {
    const salario = configuracion?.salario_mensual || 0;

    // Ingresos tabla (fijo: sueldo en blanco / variable: extras que NO sean Uber)
    const ingresosTabMes = ingresos
      .filter(i => new Date(i.fecha).getTime() >= startOfMonth)
      .reduce((a, i) => a + i.monto, 0);

    const ingresosTabUltMes = ingresos
      .filter(i =>
        new Date(i.fecha).getTime() >= startOfLastMonth &&
        new Date(i.fecha).getTime() <= endOfLastMonth
      )
      .reduce((a, i) => a + i.monto, 0);

    // Ingresos Uber desde jornadas (fuente de verdad para Uber)
    const facturadoUberMes = jornadas
      .filter(j => new Date(j.fecha + 'T00:00:00').getTime() >= startOfMonth)
      .reduce((a, j) => a + j.facturado, 0);

    const facturadoUberUltMes = jornadas
      .filter(j =>
        new Date(j.fecha + 'T00:00:00').getTime() >= startOfLastMonth &&
        new Date(j.fecha + 'T00:00:00').getTime() <= endOfLastMonth
      )
      .reduce((a, j) => a + j.facturado, 0);

    // Gastos nafta Uber desde jornadas (fuente de verdad para nafta)
    const naftaUberMes = jornadas
      .filter(j => new Date(j.fecha + 'T00:00:00').getTime() >= startOfMonth)
      .reduce((a, j) => a + j.gasto_nafta, 0);

    const naftaUberUltMes = jornadas
      .filter(j =>
        new Date(j.fecha + 'T00:00:00').getTime() >= startOfLastMonth &&
        new Date(j.fecha + 'T00:00:00').getTime() <= endOfLastMonth
      )
      .reduce((a, j) => a + j.gasto_nafta, 0);

    // Gastos diarios (sin nafta Uber, que ya viene de jornadas)
    const gastosMes = gastosDiarios
      .filter(g => new Date(g.fecha).getTime() >= startOfMonth)
      .reduce((a, g) => a + g.monto, 0);

    const gastosUltMes = gastosDiarios
      .filter(g =>
        new Date(g.fecha).getTime() >= startOfLastMonth &&
        new Date(g.fecha).getTime() <= endOfLastMonth
      )
      .reduce((a, g) => a + g.monto, 0);

    const totalSubs = subscriptions
      .filter(s => s.estado === 'Activa')
      .reduce((a, s) => a + s.monto, 0);

    const cuotas = Number(nextMonthTotal) || 0;

    const totalIncome       = salario + ingresosTabMes + facturadoUberMes;
    const lastMonthIncome   = salario + ingresosTabUltMes + facturadoUberUltMes;
    const totalGastosDiarios = gastosMes + naftaUberMes;
    const totalExpenses     = totalGastosDiarios + cuotas + totalSubs;
    const lastMonthExpenses = gastosUltMes + naftaUberUltMes + cuotas + totalSubs;

    const net       = totalIncome - totalExpenses;
    const lastNet   = lastMonthIncome - lastMonthExpenses;
    const pctChange = lastNet !== 0 ? ((net - lastNet) / Math.abs(lastNet)) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      net,
      pctChange,
      gastosDiariosTotal: totalGastosDiarios,
      cuotas,
      totalSubs,
      facturadoUberMes,
      naftaUberMes,
    };
  }, [configuracion, ingresos, gastosDiarios, jornadas, nextMonthTotal, subscriptions,
      startOfMonth, startOfLastMonth, endOfLastMonth]);

  const pct       = metrics.pctChange;
  const TrendIcon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const trendColor = pct > 0 ? 'text-success' : pct < 0 ? 'text-destructive' : 'text-muted-foreground';
  const netColor   = metrics.net >= 0 ? 'text-success' : 'text-destructive';

  return (
    <div id="net-balance-card" className="glass-panel border-border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(153 100% 50%), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Saldo Neto del Mes</p>

      <div className="flex items-end gap-4 mb-6">
        <p className={`text-5xl font-black tracking-tight ${netColor}`}
          style={{ filter: metrics.net >= 0 ? 'drop-shadow(0 0 12px hsl(153 100% 50% / 0.4))' : undefined }}>
          {format(metrics.net)}
        </p>
        {pct !== 0 && (
          <div className={`flex items-center gap-1 mb-2 ${trendColor}`}>
            <TrendIcon size={16} />
            <span className="text-sm font-bold">{Math.abs(pct).toFixed(1)}% vs mes anterior</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ingresos',              value: metrics.totalIncome,                          color: 'text-success' },
          { label: 'Gastos diarios',        value: metrics.gastosDiariosTotal,                   color: 'text-destructive' },
          { label: 'Cuotas + Subs',         value: metrics.cuotas + metrics.totalSubs,           color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-secondary/30 rounded-xl p-3 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{format(value)}</p>
          </div>
        ))}
      </div>

      {/* Desglose Uber si hay datos */}
      {(metrics.facturadoUberMes > 0 || metrics.naftaUberMes > 0) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/30 pt-3">
          <span className="uppercase tracking-widest font-semibold">Uber:</span>
          {metrics.facturadoUberMes > 0 && (
            <span className="text-success">+{format(metrics.facturadoUberMes)} facturado</span>
          )}
          {metrics.naftaUberMes > 0 && (
            <span className="text-destructive">−{format(metrics.naftaUberMes)} nafta</span>
          )}
        </div>
      )}
    </div>
  );
}
