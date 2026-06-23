import { useMemo } from 'react';
import { CreditCard, CalendarDays } from 'lucide-react';
import { useApp } from '@/lib/store';
import { calcularProyeccionDeuda, consolidarDeudaPorMes } from '@/hooks/useFinanzas';
import { formatCurrency } from '@/lib/data';

export default function DeudaFutura() {
  const { expenses, cards } = useApp();

  const { porMes, porTarjeta, totalDeuda } = useMemo(() => {
    const proyeccion = calcularProyeccionDeuda(expenses);
    const porMes = consolidarDeudaPorMes(proyeccion).slice(0, 6); // próximos 6 meses

    // Agrupar por tarjeta
    const tarjetaMap: Record<string, {
      tarjetaId: string | undefined;
      nombre: string;
      gradiente: string;
      gastos: typeof proyeccion;
      total: number;
    }> = {};

    proyeccion.forEach(p => {
      const key = p.tarjetaId ?? 'sin-tarjeta';
      if (!tarjetaMap[key]) {
        const card = cards.find(c => c.id === p.tarjetaId);
        tarjetaMap[key] = {
          tarjetaId: p.tarjetaId,
          nombre: card ? `${card.bank} — ${card.name}` : 'Sin tarjeta asignada',
          gradiente: card?.gradient ?? 'from-gray-600 to-gray-700',
          gastos: [],
          total: 0,
        };
      }
      tarjetaMap[key].gastos.push(p);
      tarjetaMap[key].total += p.montoCuota * p.cuotasFaltantes;
    });

    const porTarjeta = Object.values(tarjetaMap).sort((a, b) => b.total - a.total);
    const totalDeuda = proyeccion.reduce((s, p) => s + p.montoCuota * p.cuotasFaltantes, 0);

    return { porMes, porTarjeta, totalDeuda };
  }, [expenses, cards]);

  if (totalDeuda === 0) return null;

  return (
    <div className="surface-elevated rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Deuda Futura en Cuotas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cuotas pendientes de gastos activos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total restante</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalDeuda)}</p>
        </div>
      </div>

      {/* Proyección por mes */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
          <CalendarDays size={12} /> Próximos meses
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {porMes.map(m => {
            const maxMonto = Math.max(...porMes.map(x => x.total));
            const height = maxMonto > 0 ? Math.round((m.total / maxMonto) * 100) : 0;
            return (
              <div key={m.mesKey} className="flex flex-col items-center gap-1 group">
                <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatCurrency(m.total)}
                </span>
                <div className="w-full bg-secondary/50 rounded-lg overflow-hidden h-16 flex items-end">
                  <div
                    className="w-full bg-primary/60 hover:bg-primary transition-colors rounded-lg"
                    style={{ height: `${height}%` }}
                    title={formatCurrency(m.total)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{m.mes}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por tarjeta */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
          <CreditCard size={12} /> Por tarjeta
        </p>
        <div className="space-y-3">
          {porTarjeta.map(t => (
            <div key={t.tarjetaId ?? 'sin'} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.gradiente}`} />
                  <span className="text-sm font-medium text-foreground">{t.nombre}</span>
                </div>
                <span className="text-sm font-bold text-destructive">{formatCurrency(t.total)}</span>
              </div>
              <div className="space-y-1 pl-5">
                {t.gastos.map(g => (
                  <div key={String(g.gastoId)} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[200px]">{g.descripcion}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.tasaInteres > 0 && (
                        <span className="text-orange-400 text-[10px]">+{g.tasaInteres}% int.</span>
                      )}
                      <span>{formatCurrency(g.montoCuota)} × {g.cuotasFaltantes} cuota{g.cuotasFaltantes !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
