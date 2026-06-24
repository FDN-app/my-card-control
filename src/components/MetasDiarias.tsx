import { useState, useEffect } from 'react';
import { Car, Dumbbell, BookOpen, Zap, Check, Flame, Pencil } from 'lucide-react';
import { useMetas, type MetaDiaria, type MetaDiariaInput } from '@/hooks/useMetas';
import { toast } from 'sonner';

const hoy = new Date().toISOString().split('T')[0];

const ENERGIA_LABELS = ['', '😴', '😩', '😕', '😐', '🙂', '😊', '😄', '⚡', '🔥', '💥'];

/* ── helpers ── */

function neon(active: boolean) {
  return active
    ? 'bg-[hsl(153_100%_50%/0.12)] border-[hsl(153_100%_50%/0.5)] text-[hsl(153_100%_50%)]'
    : 'bg-secondary/30 border-border/40 text-muted-foreground';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function NumInput({
  value, onChange, placeholder, step = '0.5',
}: { value: string; onChange: (v: string) => void; placeholder?: string; step?: string }) {
  return (
    <input
      type="number"
      min="0"
      step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors"
    />
  );
}

function TextInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors"
    />
  );
}

function ToggleBtn({
  done, onToggle, label, icon: Icon,
}: { done: boolean; onToggle: () => void; label: string; icon: typeof Car }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${neon(done)}`}
      style={done ? { boxShadow: '0 0 10px hsl(153 100% 50% / 0.25)' } : undefined}
    >
      <Icon size={15} />
      {done ? <Check size={13} /> : null}
      {done ? `${label} ✓` : label}
    </button>
  );
}

/* ── empty form state ── */

type FormState = {
  uber_horas: string;
  uber_facturacion: string;
  gym_horas: string;
  gym_tipo: string;
  estudio_horas: string;
  estudio_tema: string;
  energia: string;
  notas: string;
};

function emptyForm(): FormState {
  return {
    uber_horas: '',
    uber_facturacion: '',
    gym_horas: '',
    gym_tipo: '',
    estudio_horas: '',
    estudio_tema: '',
    energia: '',
    notas: '',
  };
}

function metaToForm(m: MetaDiaria): FormState {
  return {
    uber_horas: m.uber_horas != null ? String(m.uber_horas) : '',
    uber_facturacion: m.uber_facturacion != null ? String(m.uber_facturacion) : '',
    gym_horas: m.gym_horas != null ? String(m.gym_horas) : '',
    gym_tipo: m.gym_tipo ?? '',
    estudio_horas: m.estudio_horas != null ? String(m.estudio_horas) : '',
    estudio_tema: m.estudio_tema ?? '',
    energia: m.energia != null ? String(m.energia) : '',
    notas: m.notas ?? '',
  };
}

function formToInput(f: FormState): Partial<MetaDiariaInput> {
  return {
    uber_horas: f.uber_horas !== '' ? Number(f.uber_horas) : null,
    uber_facturacion: f.uber_facturacion !== '' ? Number(f.uber_facturacion) : null,
    gym_horas: f.gym_horas !== '' ? Number(f.gym_horas) : null,
    gym_tipo: f.gym_tipo || null,
    estudio_horas: f.estudio_horas !== '' ? Number(f.estudio_horas) : null,
    estudio_tema: f.estudio_tema || null,
    energia: f.energia !== '' ? Number(f.energia) : null,
    notas: f.notas || null,
  };
}

/* ── main component ── */

export default function MetasDiarias() {
  const { getMeta, createMeta, updateMeta, toggleRealizado, isLoading } = useMetas();
  const meta = getMeta(hoy);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (meta) {
      setForm(metaToForm(meta));
      setEditing(false);
    } else {
      setForm(emptyForm());
      setEditing(true);
    }
  }, [meta?.id]);

  const set = (k: keyof FormState) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = formToInput(form);
      if (meta) {
        await updateMeta({ id: meta.id, ...input });
        toast.success('Meta actualizada');
      } else {
        await createMeta({ fecha: hoy, uber_realizado: false, gym_realizado: false, estudio_realizado: false, ...input } as MetaDiariaInput);
        toast.success('Meta del día creada');
      }
      setEditing(false);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (campo: 'uber_realizado' | 'gym_realizado' | 'estudio_realizado') => {
    if (!meta) return;
    try {
      await toggleRealizado({ id: meta.id, campo, valor: !meta[campo] });
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const dateLabel = new Date(hoy + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Metas del Día</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        {meta && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-[hsl(153_100%_50%/0.3)] transition-all"
          >
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      {/* Toggle strip — only shown when meta exists */}
      {meta && (
        <div className="flex flex-wrap gap-3">
          <ToggleBtn
            done={meta.uber_realizado}
            onToggle={() => handleToggle('uber_realizado')}
            label="Uber"
            icon={Car}
          />
          <ToggleBtn
            done={meta.gym_realizado}
            onToggle={() => handleToggle('gym_realizado')}
            label="Gym"
            icon={Dumbbell}
          />
          <ToggleBtn
            done={meta.estudio_realizado}
            onToggle={() => handleToggle('estudio_realizado')}
            label="Estudio"
            icon={BookOpen}
          />
        </div>
      )}

      {/* Form */}
      {(editing || !meta) && (
        <div className="rounded-2xl border border-border/40 p-5 space-y-6"
          style={{ background: 'hsl(215 55% 5%)', boxShadow: '0 4px 24px hsl(0 0% 0% / 0.3)' }}>

          {/* Uber */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Car size={16} className="text-[hsl(153_100%_50%)]" />
              Uber
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.uber_horas} onChange={set('uber_horas')} placeholder="0" />
              </Field>
              <Field label="Facturación ($)">
                <NumInput value={form.uber_facturacion} onChange={set('uber_facturacion')} placeholder="0" step="100" />
              </Field>
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* Gym */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Dumbbell size={16} className="text-[hsl(153_100%_50%)]" />
              Gym
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.gym_horas} onChange={set('gym_horas')} placeholder="0" />
              </Field>
              <Field label="Tipo de entrenamiento">
                <TextInput value={form.gym_tipo} onChange={set('gym_tipo')} placeholder="Ej: Pecho, Cardio..." />
              </Field>
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* Estudio */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <BookOpen size={16} className="text-[hsl(153_100%_50%)]" />
              Estudio
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.estudio_horas} onChange={set('estudio_horas')} placeholder="0" />
              </Field>
              <Field label="Tema">
                <TextInput value={form.estudio_tema} onChange={set('estudio_tema')} placeholder="Ej: React, Inglés..." />
              </Field>
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* Energía + Notas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap size={16} className="text-[hsl(153_100%_50%)]" />
              General
            </div>
            <Field label={`Energía${form.energia ? ` — ${ENERGIA_LABELS[Number(form.energia)]}` : ''}`}>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="1" max="10"
                  value={form.energia || 5}
                  onChange={e => set('energia')(e.target.value)}
                  className="flex-1 accent-[hsl(153_100%_50%)]"
                />
                <span className="text-lg w-8 text-center">
                  {form.energia ? ENERGIA_LABELS[Number(form.energia)] : '—'}
                </span>
              </div>
            </Field>
            <Field label="Notas">
              <textarea
                value={form.notas}
                onChange={e => set('notas')(e.target.value)}
                placeholder="¿Algo relevante del día?"
                rows={3}
                className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors resize-none"
              />
            </Field>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'hsl(153 100% 50% / 0.12)',
                border: '1px solid hsl(153 100% 50% / 0.4)',
                color: 'hsl(153 100% 50%)',
                boxShadow: '0 0 12px hsl(153 100% 50% / 0.15)',
              }}
            >
              <Flame size={15} />
              {saving ? 'Guardando…' : meta ? 'Actualizar' : 'Guardar meta'}
            </button>
            {meta && (
              <button
                onClick={() => { setForm(metaToForm(meta)); setEditing(false); }}
                className="px-4 py-2.5 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary card — when meta exists and not editing */}
      {meta && !editing && (
        <div className="rounded-2xl border border-border/40 p-5 space-y-4"
          style={{ background: 'hsl(215 55% 5%)' }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Resumen de hoy</p>
          <div className="grid grid-cols-3 gap-3">
            <SummaryChip
              icon={Car}
              label="Uber"
              line1={meta.uber_horas != null ? `${meta.uber_horas}h` : '—'}
              line2={meta.uber_facturacion != null
                ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(meta.uber_facturacion)
                : '—'}
              done={meta.uber_realizado}
            />
            <SummaryChip
              icon={Dumbbell}
              label="Gym"
              line1={meta.gym_horas != null ? `${meta.gym_horas}h` : '—'}
              line2={meta.gym_tipo || '—'}
              done={meta.gym_realizado}
            />
            <SummaryChip
              icon={BookOpen}
              label="Estudio"
              line1={meta.estudio_horas != null ? `${meta.estudio_horas}h` : '—'}
              line2={meta.estudio_tema || '—'}
              done={meta.estudio_realizado}
            />
          </div>
          {meta.energia != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap size={14} />
              Energía: <span className="text-base">{ENERGIA_LABELS[meta.energia]}</span>
              <span className="text-foreground font-semibold">{meta.energia}/10</span>
            </div>
          )}
          {meta.notas && (
            <p className="text-sm text-muted-foreground border-t border-border/30 pt-3 italic">
              "{meta.notas}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryChip({
  icon: Icon, label, line1, line2, done,
}: { icon: typeof Car; label: string; line1: string; line2: string; done: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-3 transition-all ${neon(done)}`}
      style={done ? { boxShadow: '0 0 10px hsl(153 100% 50% / 0.15)' } : undefined}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        {done && <Check size={11} className="ml-auto" />}
      </div>
      <span className="text-sm font-bold truncate">{line1}</span>
      <span className="text-[11px] truncate opacity-70">{line2}</span>
    </div>
  );
}
