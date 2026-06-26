import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useFinanzas, type GastoDiario } from '@/hooks/useFinanzas';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getHoyArDate } from '@/lib/dateAR';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function ExpenseCalendar() {
  const { gastosDiarios } = useFinanzas();
  const { format } = useCurrency();
  const today = getHoyArDate();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Group gastos by YYYY-MM-DD
  const byDay = useMemo(() => {
    const map: Record<string, GastoDiario[]> = {};
    gastosDiarios.forEach(g => {
      const key = g.fecha.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [gastosDiarios]);

  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(byDay).forEach(([d, gs]) => {
      map[d] = gs.reduce((a, g) => a + g.monto, 0);
    });
    return map;
  }, [byDay]);

  const maxDayTotal = Math.max(...Object.values(totals), 1);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const fmtKey = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const selectedDayExpenses = selectedDay ? (byDay[selectedDay] || []) : [];
  const selectedDayTotal = selectedDayExpenses.reduce((a, g) => a + g.monto, 0);

  return (
    <div className="glass-panel border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Calendario de Gastos</p>
          <h3 className="text-xl font-bold text-foreground mt-0.5">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const key = fmtKey(day);
          const dayTotal = totals[key] || 0;
          const intensity = dayTotal > 0 ? Math.min(0.9, dayTotal / maxDayTotal) : 0;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const isSelected = selectedDay === key;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`relative rounded-lg p-1 min-h-[48px] flex flex-col items-center transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${dayTotal > 0 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
              style={{
                backgroundColor: dayTotal > 0
                  ? `hsl(245 60% 50% / ${intensity * 0.8})`
                  : 'hsl(215 45% 10% / 0.3)',
                border: isToday ? '1px solid hsl(153 100% 50% / 0.6)' : '1px solid transparent',
              }}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</span>
              {dayTotal > 0 && (
                <span className="text-[9px] font-bold mt-auto" style={{ color: `hsl(220 80% ${Math.round(60 + intensity * 30)}%)` }}>
                  {dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(0)}k` : dayTotal.toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail popover */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-secondary/40 border border-border rounded-xl animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {selectedDay}
              </p>
              <p className="font-bold text-foreground">Total: {format(selectedDayTotal)}</p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground p-1 rounded">
              <X size={16} />
            </button>
          </div>
          {selectedDayExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin gastos este día</p>
          ) : (
            <div className="space-y-2">
              {selectedDayExpenses.map(g => (
                <div key={g.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-foreground font-medium">{g.categoria}</span>
                    {g.descripcion && <span className="text-muted-foreground ml-2 text-xs">{g.descripcion}</span>}
                    <span className="ml-2 text-[10px] text-muted-foreground capitalize">{g.medio_pago}</span>
                  </div>
                  <span className="text-destructive font-bold">{format(g.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
        <span>Menor gasto</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `hsl(245 60% 50% / ${v * 0.8})` }} />
          ))}
        </div>
        <span>Mayor gasto</span>
      </div>
    </div>
  );
}
