import { useState } from 'react';
import {
  Trophy, Flame, Code2, Plus, Pencil, Trash2, ChevronDown,
} from 'lucide-react';
import { useObjetivos } from '@/hooks/useObjetivos';
import { useProyectos, type EstadoProyecto, type Proyecto } from '@/hooks/useProyectos';
import { getHoyArDate } from '@/lib/dateAR';
import { toast } from 'sonner';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ESTADOS: EstadoProyecto[] = ['Idea', 'En progreso', 'Terminada', 'Mejorando'];

const ESTADO_STYLES: Record<EstadoProyecto, { bg: string; text: string; border: string }> = {
  'Idea':        { bg: 'bg-gray-500/15',   text: 'text-gray-400',   border: 'border-gray-500/30' },
  'En progreso': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'Terminada':   { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30' },
  'Mejorando':   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
};

function EstadoBadge({ estado }: { estado: EstadoProyecto }) {
  const s = ESTADO_STYLES[estado];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {estado}
    </span>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value} terminadas</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsl(215 45% 10%)' }}>
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

/* ── Tarjeta de proyecto ── */

function ProyectoCard({
  proyecto,
  onEdit,
  onDelete,
  onCambiarEstado,
}: {
  proyecto: Proyecto;
  onEdit: (p: Proyecto) => void;
  onDelete: (id: string) => void;
  onCambiarEstado: (id: string, estado: EstadoProyecto) => void;
}) {
  const [openEstado, setOpenEstado] = useState(false);

  const fmt = (d: string | null) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-all"
      style={{ background: 'hsl(215 55% 5%)', borderColor: 'hsl(215 45% 12%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{proyecto.nombre}</p>
          {proyecto.descripcion && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{proyecto.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(proyecto)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(proyecto.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Estado + fechas */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setOpenEstado(o => !o)}
            className="flex items-center gap-1.5"
          >
            <EstadoBadge estado={proyecto.estado} />
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {openEstado && (
            <div
              className="absolute left-0 top-7 z-20 rounded-xl border p-1 min-w-[140px] space-y-0.5"
              style={{ background: 'hsl(215 60% 6%)', borderColor: 'hsl(215 45% 14%)' }}
            >
              {ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => { onCambiarEstado(proyecto.id, e); setOpenEstado(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    e === proyecto.estado ? 'bg-secondary/40' : 'hover:bg-secondary/20'
                  }`}
                >
                  <EstadoBadge estado={e} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          {proyecto.fecha_inicio && <span>Inicio: {fmt(proyecto.fecha_inicio)}</span>}
          {proyecto.fecha_fin && <span>Fin: {fmt(proyecto.fecha_fin)}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Modal crear/editar proyecto ── */

function ProyectoModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Proyecto | null;
  onSave: (data: { nombre: string; descripcion: string | null; estado: EstadoProyecto }) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [estado, setEstado] = useState<EstadoProyecto>(initial?.estado ?? 'Idea');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      await onSave({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, estado });
      onClose();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border p-5 space-y-4"
        style={{ background: 'hsl(215 60% 4%)', borderColor: 'hsl(153 100% 50% / 0.2)' }}
      >
        <h2 className="text-base font-bold text-foreground">
          {initial ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h2>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: App de finanzas"
            className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Descripción</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Breve descripción del proyecto..."
            rows={3}
            className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] transition-colors resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Estado</label>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEstado(e)}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                  estado === e
                    ? `${ESTADO_STYLES[e].bg} ${ESTADO_STYLES[e].text} ${ESTADO_STYLES[e].border}`
                    : 'bg-secondary/20 border-border/30 text-muted-foreground'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'hsl(153 100% 50% / 0.12)',
              border: '1px solid hsl(153 100% 50% / 0.4)',
              color: 'hsl(153 100% 50%)',
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Flame size={14} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function ObjetivosMensuales() {
  const { objetivo, isLoading: loadingObj, upsertObjetivo } = useObjetivos();
  const { proyectos, isLoading: loadingProj, crearProyecto, actualizarProyecto, cambiarEstado, eliminarProyecto } = useProyectos();

  const arNow = getHoyArDate();
  const mesLabel = `${MESES[arNow.getMonth()]} ${arNow.getFullYear()}`;
  const mesActual = arNow.getMonth() + 1;
  const anioActual = arNow.getFullYear();

  // Calcular terminadas este mes por fecha_fin
  const terminadasEsteMes = proyectos.filter(p => {
    if (p.estado !== 'Terminada' || !p.fecha_fin) return false;
    const [y, m] = p.fecha_fin.split('-').map(Number);
    return y === anioActual && m === mesActual;
  }).length;

  const [appsObjetivo, setAppsObjetivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [savingObj, setSavingObj] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);

  // Sync form with loaded objetivo
  const [syncedId, setSyncedId] = useState<string | undefined>();
  if (objetivo && objetivo.id !== syncedId) {
    setAppsObjetivo(objetivo.apps_objetivo != null ? String(objetivo.apps_objetivo) : '');
    setDescripcion(objetivo.descripcion ?? '');
    setSyncedId(objetivo.id);
  }

  const handleGuardarObjetivo = async () => {
    setSavingObj(true);
    try {
      await upsertObjetivo({
        apps_objetivo: appsObjetivo !== '' ? Number(appsObjetivo) : null,
        apps_completadas: terminadasEsteMes,
        descripcion: descripcion || null,
      });
      toast.success('Objetivo actualizado');
    } catch (err: any) {
      console.error('[ObjetivosMensuales] save error:', err);
      toast.error('Error al guardar');
    } finally {
      setSavingObj(false);
    }
  };

  const handleDeleteProyecto = async (id: string) => {
    try {
      await eliminarProyecto(id);
      toast.success('Proyecto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleCambiarEstado = async (id: string, estado: EstadoProyecto) => {
    try {
      await cambiarEstado({ id, estado });
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleSaveProyecto = async (data: { nombre: string; descripcion: string | null; estado: EstadoProyecto }) => {
    if (editingProyecto) {
      await actualizarProyecto({ id: editingProyecto.id, ...data });
      toast.success('Proyecto actualizado');
    } else {
      await crearProyecto(data);
      toast.success('Proyecto creado');
    }
  };

  if (loadingObj || loadingProj) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Cargando…
      </div>
    );
  }

  const appsObj = objetivo?.apps_objetivo ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(153 100% 50% / 0.1)', border: '1px solid hsl(153 100% 50% / 0.4)' }}
        >
          <Trophy size={20} style={{ color: 'hsl(153 100% 50%)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Proyectos del Mes</h1>
          <p className="text-sm text-muted-foreground capitalize">{mesLabel}</p>
        </div>
      </div>

      {/* ── Objetivo mensual ── */}
      <div
        className="rounded-2xl border p-5 space-y-5"
        style={{ background: 'hsl(215 55% 5%)', borderColor: 'hsl(215 45% 12%)' }}
      >
        {/* Counter */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Apps Terminadas</p>
            <p
              className="text-5xl font-black tabular-nums"
              style={{ color: 'hsl(153 100% 50%)', textShadow: '0 0 20px hsl(153 100% 50% / 0.4)' }}
            >
              {terminadasEsteMes}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">proyectos terminados este mes</p>
          </div>
          <div
            className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
            style={{
              background: 'hsl(153 100% 50% / 0.06)',
              border: '1px solid hsl(153 100% 50% / 0.2)',
            }}
          >
            <Code2 size={22} style={{ color: 'hsl(153 100% 50%)' }} />
            <span className="text-xs font-bold" style={{ color: 'hsl(153 100% 50%)' }}>
              {proyectos.length} total
            </span>
          </div>
        </div>

        {appsObj > 0 && <ProgressBar value={terminadasEsteMes} max={appsObj} />}

        {/* Configurar objetivo */}
        <div className="border-t border-border/20 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Configurar objetivo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Apps objetivo este mes</label>
              <input
                type="number"
                min="0"
                step="1"
                value={appsObjetivo}
                onChange={e => setAppsObjetivo(e.target.value)}
                placeholder="Ej: 4"
                className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Enfoque del mes</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Apps de productividad"
                className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] transition-colors"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleGuardarObjetivo}
            disabled={savingObj}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'hsl(153 100% 50% / 0.12)',
              border: '1px solid hsl(153 100% 50% / 0.4)',
              color: 'hsl(153 100% 50%)',
              opacity: savingObj ? 0.5 : 1,
            }}
          >
            <Flame size={14} />
            {savingObj ? 'Guardando…' : 'Guardar objetivo'}
          </button>
        </div>
      </div>

      {/* ── Lista de proyectos ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Proyectos</p>
          <button
            onClick={() => { setEditingProyecto(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: 'hsl(153 100% 50% / 0.1)',
              border: '1px solid hsl(153 100% 50% / 0.35)',
              color: 'hsl(153 100% 50%)',
            }}
          >
            <Plus size={13} />
            Nuevo
          </button>
        </div>

        {proyectos.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-8 text-center"
            style={{ borderColor: 'hsl(215 45% 15%)' }}
          >
            <Code2 size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay proyectos todavía.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Creá tu primer proyecto arriba.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proyectos.map(p => (
              <ProyectoCard
                key={p.id}
                proyecto={p}
                onEdit={proj => { setEditingProyecto(proj); setModalOpen(true); }}
                onDelete={handleDeleteProyecto}
                onCambiarEstado={handleCambiarEstado}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProyectoModal
          initial={editingProyecto}
          onSave={handleSaveProyecto}
          onClose={() => { setModalOpen(false); setEditingProyecto(null); }}
        />
      )}
    </div>
  );
}
