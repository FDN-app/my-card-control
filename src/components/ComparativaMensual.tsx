import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFinanzas } from '@/hooks/useFinanzas';
import { formatCurrency } from '@/lib/data';

export default function ComparativaMensual() {
  const { gastosDiarios } = useFinanzas();

  const { actual, anterior, deltaAbs, deltaPct, porCategoria, mesActualLabel, mesAnteriorLabel } = useMemo(() => {
    const now = new Date();
    const startActual = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endAnterior = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const mesActualLabel = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const mesAnteriorLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const gastosMesActual = gastosDiarios.filter(g => g.fecha >= startActual);
    const gastosMesAnterior = gastosDiarios.filter(g => g.fecha >= startAnterior && g.fecha <= endAnterior);

    const actual = gastosMesActual.reduce((s, g) => s + g.monto, 0);
    const anterior = gastosMesAnterior.reduce((s, g) => s + g.monto, 0);
    const deltaAbs = actual - anterior;
    const deltaPct = anterior > 0 ? Math.round((deltaAbs / anterior) * 100) : null;

    const cats = new Set([
      ...gastosMesActual.map(g => g.categoria),
      ...gastosMesAnterior.map(g => g.categoria),
    ]);
    const porCategoria = Array.from(cats)
      .map(cat => {
        const a = gastosMesActual.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0);
        const b = gastosMesAnterior.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0);
        const d = a - b;
        const dp = b > 0 ? Math.round((d / b) * 100) : null;
        return { categoria: cat, actual: a, anterior: b, delta: d, deltaPct: dp };
      })
      .filter(c => c.actual > 0 || c.anterior > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return { actual, anterior, deltaAbs, deltaPct, porCategoria, mesActualLabel, mesAnteriorLabel };
  }, [gastosDiarios]);

  const DeltaChip = ({ delta, pct }: { delta: number; pct: number | null }) => {
    if (delta === 0) return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Minus size={12} /> Sin cambio</span>
    );
    const isGood = delta < 0;
    const Icon = delta < 0 ? TrendingDown : TrendingUp;
    return (
      <span className={`flex items-center gap-1 text-xs font-semibold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        <Icon size={12} />
        {delta < 0 ? '-' : '+'}{formatCurrency(Math.abs(delta))}
        {pct !== null && <span className="opacity-70">({pct > 0 ? '+' : ''}{pct}%)</span>}
      </span>
    );
  };

  return (
    <div className="surface-elevated rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground">Comparativa Mensual</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Gastos diarios: mes actual vs mes anterior</p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 capitalize">{mesActualLabel}</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(actual)}</p>
        </div>
        <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 capitalize">{mesAnteriorLabel}</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(anterior)}</p>
        </div>
      </div>

      {/* Delta total */}
      <div className={`flex items-center justify-between p-3 rounded-xl border ${
        deltaAbs < 0 ? 'bg-green-500/10 border-green-500/20' :
        deltaAbs > 0 ? 'bg-red-500/10 border-red-500/20' :
                       'bg-secondary/30 border-border/50'
      }`}>
        <span className="text-sm font-medium text-foreground">Variación total</span>
        <DeltaChip delta={deltaAbs} pct={deltaPct} />
      </div>

      {/* Por categoría */}
      {porCategoria.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Por categoría</p>
          {porCategoria.map(c => (
            <div key={c.categoria} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">{c.categoria}</span>
              <div className="flex items-center gap-4">
                <span className="text-foreground font-medium w-28 text-right">{formatCurrency(c.actual)}</span>
                <DeltaChip delta={c.delta} pct={c.deltaPct} />
              </div>
            </div>
          ))}
        </div>
      )}

      {porCategoria.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">No hay datos de gastos para comparar.</p>
      )}
    </div>
  );
}
