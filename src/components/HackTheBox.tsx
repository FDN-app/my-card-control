import { useState } from 'react';
import {
  Terminal, Monitor, Plus, Pencil, Trash2, ExternalLink,
  Check, X, Target, ChevronRight, Flag,
} from 'lucide-react';
import { useHTB, type HTBMaquina, type HTBMaquinaInput } from '@/hooks/useHTB';
import { getHoyArgentina } from '@/lib/dateAR';
import { toast } from 'sonner';

/* ── Dificultad ──────────────────────────────────────────────────────────── */

const DIFICULTAD_STYLE: Record<HTBMaquina['dificultad'], { color: string; glow: string; bg: string }> = {
  Easy:   { color: 'hsl(153 100% 50%)',  glow: 'hsl(153 100% 50% / 0.3)',  bg: 'hsl(153 100% 50% / 0.1)'  },
  Medium: { color: 'hsl(45 100% 60%)',   glow: 'hsl(45 100% 60% / 0.3)',   bg: 'hsl(45 100% 60% / 0.1)'   },
  Hard:   { color: 'hsl(15 100% 60%)',   glow: 'hsl(15 100% 60% / 0.3)',   bg: 'hsl(15 100% 60% / 0.1)'   },
  Insane: { color: 'hsl(285 100% 70%)',  glow: 'hsl(285 100% 70% / 0.3)',  bg: 'hsl(285 100% 70% / 0.1)'  },
};

/* ── Form ─────────────────────────────────────────────────────────────────── */

type MaquinaForm = {
  nombre: string;
  dificultad: HTBMaquina['dificultad'];
  sistema_operativo: HTBMaquina['sistema_operativo'];
  tecnicas: string;
  writeup_url: string;
  ip: string;
  notas: string;
  fecha_resolucion: string;
};

function emptyForm(): MaquinaForm {
  return {
    nombre: '',
    dificultad: 'Easy',
    sistema_operativo: 'Linux',
    tecnicas: '',
    writeup_url: '',
    ip: '',
    notas: '',
    fecha_resolucion: getHoyArgentina(),
  };
}

function maquinaToForm(m: HTBMaquina): MaquinaForm {
  return {
    nombre: m.nombre,
    dificultad: m.dificultad,
    sistema_operativo: m.sistema_operativo,
    tecnicas: m.tecnicas ?? '',
    writeup_url: m.writeup_url ?? '',
    ip: m.ip ?? '',
    notas: m.notas ?? '',
    fecha_resolucion: m.fecha_resolucion,
  };
}

function formToInput(f: MaquinaForm): HTBMaquinaInput {
  return {
    nombre: f.nombre.trim(),
    dificultad: f.dificultad,
    sistema_operativo: f.sistema_operativo,
    tecnicas: f.tecnicas.trim() || null,
    writeup_url: f.writeup_url.trim() || null,
    ip: f.ip.trim() || null,
    notas: f.notas.trim() || null,
    fecha_resolucion: f.fecha_resolucion,
  };
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DiffBadge({ d }: { d: HTBMaquina['dificultad'] }) {
  const s = DIFICULTAD_STYLE[d];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.glow}` }}
    >
      {d}
    </span>
  );
}

function TecnicaTag({ t }: { t: string }) {
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{
        color: 'hsl(192 100% 65%)',
        background: 'hsl(192 100% 50% / 0.08)',
        border: '1px solid hsl(192 100% 50% / 0.2)',
      }}
    >
      {t.trim()}
    </span>
  );
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] ' +
  'focus:bg-secondary/50 transition-colors';

const selectCls = inputCls + ' cursor-pointer';

/* ── Machine Card ─────────────────────────────────────────────────────────── */

function MaquinaCard({
  maquina, onEdit, onDelete,
}: { maquina: HTBMaquina; onEdit: () => void; onDelete: () => void }) {
  const s = DIFICULTAD_STYLE[maquina.dificultad];
  const tecnicas = maquina.tecnicas
    ? maquina.tecnicas.split(',').filter(Boolean)
    : [];

  const fecha = new Date(maquina.fecha_resolucion + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-all duration-200 group"
      style={{
        background: 'hsl(215 55% 5%)',
        borderColor: 'hsl(215 45% 12%)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* OS icon */}
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: s.bg,
              border: `1px solid ${s.glow}`,
            }}
          >
            {maquina.sistema_operativo === 'Linux'
              ? <Terminal size={14} style={{ color: s.color }} />
              : <Monitor size={14} style={{ color: s.color }} />
            }
          </span>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{maquina.nombre}</p>
            <p className="text-[10px] text-muted-foreground">{maquina.sistema_operativo} · {fecha}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <DiffBadge d={maquina.dificultad} />
        </div>
      </div>

      {/* Técnicas */}
      {tecnicas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tecnicas.map((t, i) => <TecnicaTag key={i} t={t} />)}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1 border-t border-border/20">
        <div className="flex items-center gap-3">
          {maquina.writeup_url && (
            <a
              href={maquina.writeup_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[hsl(153_100%_50%)] transition-colors"
            >
              <ExternalLink size={11} /> Writeup
            </a>
          )}
          {maquina.ip && (
            <span className="text-[11px] font-mono text-muted-foreground/60">{maquina.ip}</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Notas */}
      {maquina.notas && (
        <p className="text-[11px] text-muted-foreground/70 italic border-t border-border/20 pt-2">
          {maquina.notas}
        </p>
      )}
    </div>
  );
}

/* ── Machine Form Modal ───────────────────────────────────────────────────── */

function MaquinaModal({
  open, editing, form, saving,
  onChange, onSave, onClose,
}: {
  open: boolean;
  editing: boolean;
  form: MaquinaForm;
  saving: boolean;
  onChange: (k: keyof MaquinaForm, v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          z-50 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(215 60% 4% / 0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid hsl(153 100% 50% / 0.15)',
          boxShadow: '0 -8px 40px hsl(0 0% 0% / 0.6)',
          maxHeight: '90dvh',
        }}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Flag size={16} style={{ color: 'hsl(153 100% 50%)' }} />
            <h2 className="font-bold text-foreground">
              {editing ? 'Editar máquina' : 'Nueva máquina'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-5 pb-6 space-y-4" style={{ maxHeight: 'calc(90dvh - 80px)' }}>
          {/* Nombre */}
          <InputField label="Nombre *">
            <input
              className={inputCls}
              value={form.nombre}
              onChange={e => onChange('nombre', e.target.value)}
              placeholder="Ej: Blue, Forest, Beep"
              autoFocus
            />
          </InputField>

          {/* Dificultad + SO */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Dificultad">
              <select
                className={selectCls}
                value={form.dificultad}
                onChange={e => onChange('dificultad', e.target.value)}
              >
                {(['Easy', 'Medium', 'Hard', 'Insane'] as const).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </InputField>
            <InputField label="Sistema operativo">
              <select
                className={selectCls}
                value={form.sistema_operativo}
                onChange={e => onChange('sistema_operativo', e.target.value)}
              >
                <option value="Linux">Linux</option>
                <option value="Windows">Windows</option>
              </select>
            </InputField>
          </div>

          {/* Técnicas */}
          <InputField label="Técnicas (separadas por coma)">
            <input
              className={inputCls}
              value={form.tecnicas}
              onChange={e => onChange('tecnicas', e.target.value)}
              placeholder="Ej: SQLi, RCE, PrivEsc, CVE-2021-41773"
            />
          </InputField>

          {/* Fecha */}
          <InputField label="Fecha de resolución">
            <input
              type="date"
              className={inputCls}
              value={form.fecha_resolucion}
              onChange={e => onChange('fecha_resolucion', e.target.value)}
            />
          </InputField>

          {/* IP + Writeup */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="IP (opcional)">
              <input
                className={inputCls}
                value={form.ip}
                onChange={e => onChange('ip', e.target.value)}
                placeholder="10.10.11.X"
              />
            </InputField>
            <InputField label="Writeup URL (opcional)">
              <input
                className={inputCls}
                value={form.writeup_url}
                onChange={e => onChange('writeup_url', e.target.value)}
                placeholder="https://..."
              />
            </InputField>
          </div>

          {/* Notas */}
          <InputField label="Notas (opcional)">
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              value={form.notas}
              onChange={e => onChange('notas', e.target.value)}
              placeholder="¿Qué aprendiste? ¿Algo a recordar?"
            />
          </InputField>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onSave}
              disabled={saving || !form.nombre.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'hsl(153 100% 50% / 0.12)',
                border: '1px solid hsl(153 100% 50% / 0.4)',
                color: 'hsl(153 100% 50%)',
                boxShadow: '0 0 12px hsl(153 100% 50% / 0.15)',
                opacity: saving || !form.nombre.trim() ? 0.5 : 1,
                cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={15} />
              {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Guardar'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function HackTheBox() {
  const {
    maquinas, maquinasEstaSemana, config,
    loadingMaquinas, loadingConfig,
    crearMaquina, actualizarMaquina, eliminarMaquina, upsertConfig,
  } = useHTB();

  const objetivo = config?.maquinas_objetivo_semanal ?? 2;

  /* ── Modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<HTBMaquina | null>(null);
  const [form, setForm] = useState<MaquinaForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  /* ── Objective edit state ── */
  const [editingObj, setEditingObj] = useState(false);
  const [objInput, setObjInput] = useState('');
  const [savingObj, setSavingObj] = useState(false);

  const setField = (k: keyof MaquinaForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditingMaquina(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (m: HTBMaquina) => {
    setEditingMaquina(m);
    setForm(maquinaToForm(m));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMaquina(null);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const input = formToInput(form);
      if (editingMaquina) {
        await actualizarMaquina({ id: editingMaquina.id, ...input });
        toast.success('Máquina actualizada');
      } else {
        await crearMaquina(input);
        toast.success('Máquina registrada');
      }
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eliminarMaquina(id);
      toast.success('Máquina eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveObj = async () => {
    const n = Number(objInput);
    if (!n || n < 1) return;
    setSavingObj(true);
    try {
      await upsertConfig({ maquinas_objetivo_semanal: n });
      toast.success('Objetivo actualizado');
      setEditingObj(false);
    } catch {
      toast.error('Error al guardar objetivo');
    } finally {
      setSavingObj(false);
    }
  };

  const semanaProgress = Math.min((maquinasEstaSemana.length / objetivo) * 100, 100);
  const cumplido = maquinasEstaSemana.length >= objetivo;

  if (loadingMaquinas || loadingConfig) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: '2px solid hsl(153 100% 50% / 0.3)', borderTopColor: 'hsl(153 100% 50%)' }}
          />
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 6px hsl(153 100% 50% / 0.7))' }}>
              {'<'}
            </span>
            HackTheBox
            <span style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 6px hsl(153 100% 50% / 0.7))' }}>
              {'>'}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Máquinas resueltas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{
            background: 'hsl(153 100% 50% / 0.1)',
            border: '1px solid hsl(153 100% 50% / 0.35)',
            color: 'hsl(153 100% 50%)',
            boxShadow: '0 0 12px hsl(153 100% 50% / 0.1)',
          }}
        >
          <Plus size={15} /> Nueva
        </button>
      </div>

      {/* ── Stats ── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'hsl(215 55% 5%)',
          border: '1px solid hsl(215 45% 12%)',
        }}
      >
        {/* Weekly row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: 'hsl(153 100% 50%)' }} />
            <span className="text-sm font-semibold text-foreground">Esta semana</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Inline objective editor */}
            {editingObj ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={objInput}
                  onChange={e => setObjInput(e.target.value)}
                  className="w-14 text-center text-sm bg-secondary/40 border border-[hsl(153_100%_50%/0.4)] rounded-lg px-2 py-1 text-foreground focus:outline-none"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveObj(); if (e.key === 'Escape') setEditingObj(false); }}
                />
                <button
                  onClick={handleSaveObj}
                  disabled={savingObj}
                  className="p-1 rounded-lg text-[hsl(153_100%_50%)] hover:bg-[hsl(153_100%_50%/0.1)] transition-colors"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setEditingObj(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setObjInput(String(objetivo)); setEditingObj(true); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span
                  className="text-xl font-black"
                  style={{ color: cumplido ? 'hsl(153 100% 50%)' : 'hsl(215 20% 70%)' }}
                >
                  {maquinasEstaSemana.length}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-bold text-foreground">{objetivo}</span>
                <Pencil size={11} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {/* Total chip */}
            <span
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'hsl(192 100% 50% / 0.08)',
                border: '1px solid hsl(192 100% 50% / 0.2)',
                color: 'hsl(192 100% 65%)',
              }}
            >
              <ChevronRight size={11} />
              {maquinas.length} total
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${semanaProgress}%`,
                background: cumplido
                  ? 'hsl(153 100% 50%)'
                  : 'linear-gradient(90deg, hsl(153 100% 35%), hsl(153 100% 50%))',
                boxShadow: cumplido ? '0 0 8px hsl(153 100% 50% / 0.6)' : undefined,
              }}
            />
          </div>
          {cumplido && (
            <p className="text-[11px] font-semibold text-center" style={{ color: 'hsl(153 100% 50%)' }}>
              ✅ Objetivo semanal cumplido
            </p>
          )}
        </div>
      </div>

      {/* ── Machine list ── */}
      {maquinas.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center"
          style={{ borderColor: 'hsl(215 45% 14%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'hsl(153 100% 50% / 0.06)',
              border: '1px solid hsl(153 100% 50% / 0.2)',
            }}
          >
            <Terminal size={24} style={{ color: 'hsl(153 100% 50%)' }} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Ninguna máquina registrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Empezá a trackar tus <span style={{ color: 'hsl(153 100% 50%)' }}>pwns</span> de HackTheBox.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'hsl(153 100% 50% / 0.1)',
              border: '1px solid hsl(153 100% 50% / 0.35)',
              color: 'hsl(153 100% 50%)',
            }}
          >
            <Plus size={15} /> Primera máquina
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {maquinas.map(m => (
            <MaquinaCard
              key={m.id}
              maquina={m}
              onEdit={() => openEdit(m)}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}

      {/* ── Form modal ── */}
      <MaquinaModal
        open={modalOpen}
        editing={!!editingMaquina}
        form={form}
        saving={saving}
        onChange={setField}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}
