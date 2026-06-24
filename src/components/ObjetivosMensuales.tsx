import { useState, useEffect } from 'react';
import { Trophy, PlusCircle, Flame } from 'lucide-react';
import { useObjetivos } from '@/hooks/useObjetivos';
import { toast } from 'sonner';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value} completadas</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ background: 'hsl(215 45% 10%)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? 'hsl(153 100% 50%)'
              : 'linear-gradient(90deg, hsl(153 100% 35%), hsl(153 100% 50%))',
            boxShadow: pct > 0 ? '0 0 8px hsl(153 100% 50% / 0.5)' : undefined,
          }}
        />
      </div>
      {max > 0 && (
        <p className="text-[10px] text-muted-foreground text-right">objetivo: {max} apps</p>
      )}
    </div>
  );
}

export default function ObjetivosMensuales() {
  const { objetivo, isLoading, upsertObjetivo, incrementarApp, isPendingIncrement } = useObjetivos();

  const now = new Date();
  const mesLabel = `${MESES[now.getMonth()]} ${now.getFullYear()}`;

  const [appsObjetivo, setAppsObjetivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (objetivo) {
      setAppsObjetivo(objetivo.apps_objetivo != null ? String(objetivo.apps_objetivo) : '');
      setDescripcion(objetivo.descripcion ?? '');
    }
  }, [objetivo?.id]);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await upsertObjetivo({
        mes: now.toISOString().slice(0, 7),
        apps_objetivo: appsObjetivo !== '' ? Number(appsObjetivo) : null,
        apps_completadas: objetivo?.apps_completadas ?? 0,
        descripcion: descripcion || null,
      });
      toast.success('Objetivo actualizado');
    } catch (err: any) {
      console.error('[ObjetivosMensuales] save error:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleIncrementar = async () => {
    try {
      await incrementarApp();
      toast.success('+1 app completada 🎉');
    } catch (err: any) {
      console.error('[ObjetivosMensuales] increment error:', err);
      toast.error('Error al actualizar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Cargando objetivos…
      </div>
    );
  }

  const appsCompletadas = objetivo?.apps_completadas ?? 0;
  const appsObj = objetivo?.apps_objetivo ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'hsl(153 100% 50% / 0.1)',
            border: '1px solid hsl(153 100% 50% / 0.4)',
          }}
        >
          <Trophy size={20} style={{ color: 'hsl(153 100% 50%)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Objetivos del Mes</h1>
          <p className="text-sm text-muted-foreground capitalize">{mesLabel}</p>
        </div>
      </div>

      {/* Apps completadas */}
      <div
        className="rounded-2xl border p-5 space-y-5"
        style={{ background: 'hsl(215 55% 5%)', borderColor: 'hsl(215 45% 12%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Apps Creadas</p>
            <p
              className="text-5xl font-black tabular-nums"
              style={{ color: 'hsl(153 100% 50%)', textShadow: '0 0 20px hsl(153 100% 50% / 0.4)' }}
            >
              {appsCompletadas}
            </p>
          </div>
          <button
            type="button"
            onClick={handleIncrementar}
            disabled={isPendingIncrement}
            className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all active:scale-95"
            style={{
              background: 'hsl(153 100% 50% / 0.12)',
              border: '1px solid hsl(153 100% 50% / 0.4)',
              boxShadow: '0 0 16px hsl(153 100% 50% / 0.15)',
              opacity: isPendingIncrement ? 0.5 : 1,
            }}
          >
            <PlusCircle size={24} style={{ color: 'hsl(153 100% 50%)' }} />
            <span className="text-xs font-bold" style={{ color: 'hsl(153 100% 50%)' }}>
              +1 app
            </span>
          </button>
        </div>

        {appsObj > 0 && (
          <ProgressBar value={appsCompletadas} max={appsObj} />
        )}
      </div>

      {/* Editar objetivo */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'hsl(215 55% 5%)', borderColor: 'hsl(215 45% 12%)' }}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Configurar Objetivo</p>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Apps objetivo este mes
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={appsObjetivo}
            onChange={e => setAppsObjetivo(e.target.value)}
            placeholder="Ej: 10"
            className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Descripción / enfoque del mes
          </label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Mes de consolidación — apps de productividad y TS"
            rows={3}
            className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'hsl(153 100% 50% / 0.12)',
            border: '1px solid hsl(153 100% 50% / 0.4)',
            color: 'hsl(153 100% 50%)',
            opacity: saving ? 0.5 : 1,
          }}
        >
          <Flame size={14} />
          {saving ? 'Guardando…' : 'Guardar objetivo'}
        </button>
      </div>

      {objetivo?.descripcion && (
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'hsl(215 55% 5%)', borderColor: 'hsl(215 45% 12%)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Enfoque del mes</p>
          <p className="text-sm text-foreground/80 italic">"{objetivo.descripcion}"</p>
        </div>
      )}
    </div>
  );
}
