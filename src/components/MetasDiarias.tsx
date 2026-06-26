import { useState, useEffect } from 'react';
import { Car, Dumbbell, BookOpen, Zap, Check, Flame, Pencil, UtensilsCrossed, Code2 } from 'lucide-react';
import { useMetas, type MetaDiaria, type MetaDiariaInput } from '@/hooks/useMetas';
import { getHoyArgentina } from '@/lib/dateAR';
import { toast } from 'sonner';

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
  uber_horas_objetivo: string;
  uber_facturacion_minima: string;
  gym_horas: string;
  gym_tipo: string;
  estudio_horas: string;
  estudio_tema: string;
  dieta_calorias_objetivo: string;
  apps_horas: string;
  energia_nivel: string;
  notas: string;
};

function emptyForm(): FormState {
  return {
    uber_horas_objetivo: '',
    uber_facturacion_minima: '',
    gym_horas: '',
    gym_tipo: '',
    estudio_horas: '',
    estudio_tema: '',
    dieta_calorias_objetivo: '',
    apps_horas: '',
    energia_nivel: '',
    notas: '',
  };
}

function metaToForm(m: MetaDiaria): FormState {
  return {
    uber_horas_objetivo: m.uber_horas_objetivo != null ? String(m.uber_horas_objetivo) : '',
    uber_facturacion_minima: m.uber_facturacion_minima != null ? String(m.uber_facturacion_minima) : '',
    gym_horas: m.gym_horas != null ? String(m.gym_horas) : '',
    gym_tipo: m.gym_tipo ?? '',
    estudio_horas: m.estudio_horas != null ? String(m.estudio_horas) : '',
    estudio_tema: m.estudio_tema ?? '',
    dieta_calorias_objetivo: m.dieta_calorias_objetivo != null ? String(m.dieta_calorias_objetivo) : '',
    apps_horas: m.apps_horas != null ? String(m.apps_horas) : '',
    energia_nivel: m.energia_nivel != null ? String(m.energia_nivel) : '',
    notas: m.notas ?? '',
  };
}

function formToInput(f: FormState): Partial<MetaDiariaInput> {
  return {
    uber_horas_objetivo: f.uber_horas_objetivo !== '' ? Number(f.uber_horas_objetivo) : null,
    uber_facturacion_minima: f.uber_facturacion_minima !== '' ? Number(f.uber_facturacion_minima) : null,
    gym_horas: f.gym_horas !== '' ? Number(f.gym_horas) : null,
    gym_tipo: f.gym_tipo || null,
    estudio_horas: f.estudio_horas !== '' ? Number(f.estudio_horas) : null,
    estudio_tema: f.estudio_tema || null,
    dieta_calorias_objetivo: f.dieta_calorias_objetivo !== '' ? Number(f.dieta_calorias_objetivo) : null,
    apps_horas: f.apps_horas !== '' ? Number(f.apps_horas) : null,
    energia_nivel: f.energia_nivel !== '' ? Number(f.energia_nivel) : null,
    notas: f.notas || null,
  };
}

/* ── main component ── */

export default function MetasDiarias() {
  const hoy = getHoyArgentina();
  const { getMeta, createMeta, updateMeta, toggleRealizado } = useMetas();
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
        await createMeta({
          fecha: hoy,
          uber_realizado: false,
          gym_realizado: false,
          estudio_realizado: false,
          dieta_realizado: false,
          apps_realizado: false,
          ...input,
        } as MetaDiariaInput);
        toast.success('Meta del día creada');
      }
      setEditing(false);
    } catch (err: any) {
      console.error('[MetasDiarias] handleSave error:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (campo: 'uber_realizado' | 'gym_realizado' | 'estudio_realizado' | 'dieta_realizado' | 'apps_realizado') => {
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
          <ToggleBtn
            done={meta.dieta_realizado}
            onToggle={() => handleToggle('dieta_realizado')}
            label="Dieta"
            icon={UtensilsCrossed}
          />
          <ToggleBtn
            done={meta.apps_realizado}
            onToggle={() => handleToggle('apps_realizado')}
            label="Apps"
            icon={Code2}
          />
        </div>
      )}

      {/* Form */}
      {(editing || !meta) && (
        <div className="rounded-2xl border border-border/40 p-5 space-y-6"
          style={{ background: 'hsl(215 55% 5%)', boxShadow: '0 4px 24px hsl(0 0% 0% / 0.3)' }}>

          {/* Uber */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Car size={16} className="text-[hsl(153_100%_50%)]" />
              Uber
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.uber_horas_objetivo} onChange={set('uber_horas_objetivo')} placeholder="0" />
              </Field>
              <Field label="Facturación ($)">
                <NumInput value={form.uber_facturacion_minima} onChange={set('uber_facturacion_minima')} placeholder="0" step="100" />
              </Field>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Gym */}
          <div className="space-y-3">
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
          </div>

          <div className="border-t border-border/30" />

          {/* Estudio */}
          <div className="space-y-3">
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
          </div>

          <div className="border-t border-border/30" />

          {/* Dieta */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <UtensilsCrossed size={16} className="text-[hsl(153_100%_50%)]" />
              Dieta
            </div>
            <Field label="Calorías objetivo">
              <NumInput value={form.dieta_calorias_objetivo} onChange={set('dieta_calorias_objetivo')} placeholder="2000" step="50" />
            </Field>
          </div>

          <div className="border-t border-border/30" />

          {/* Programar apps */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Code2 size={16} className="text-[hsl(153_100%_50%)]" />
              Programar apps
            </div>
            <Field label="Horas">
              <NumInput value={form.apps_horas} onChange={set('apps_horas')} placeholder="0" />
            </Field>
          </div>

          <div className="border-t border-border/30" />

          {/* Energía + Notas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap size={16} className="text-[hsl(153_100%_50%)]" />
              General
            </div>
            <Field label={`Energía${form.energia_nivel ? ` — ${ENERGIA_LABELS[Number(form.energia_nivel)]}` : ''}`}>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="1" max="10"
                  value={form.energia_nivel || 5}
                  onChange={e => set('energia_nivel')(e.target.value)}
                  className="flex-1 accent-[hsl(153_100%_50%)]"
                />
                <span className="text-lg w-8 text-center">
                  {form.energia_nivel ? ENERGIA_LABELS[Number(form.energia_nivel)] : '—'}
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1" style={{ position: 'relative', zIndex: 50 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                background: 'hsl(153 100% 50% / 0.12)',
                border: '1px solid hsl(153 100% 50% / 0.4)',
                color: 'hsl(153 100% 50%)',
                boxShadow: '0 0 12px hsl(153 100% 50% / 0.15)',
                position: 'relative',
                zIndex: 51,
                pointerEvents: saving ? 'none' : 'auto',
              }}
            >
              <Flame size={15} />
              {saving ? 'Guardando…' : meta ? 'Actualizar' : 'Guardar meta'}
            </button>
            {meta && (
              <button
                type="button"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryChip
              icon={Car}
              label="Uber"
              line1={meta.uber_horas_objetivo != null ? `${meta.uber_horas_objetivo}h` : '—'}
              line2={meta.uber_facturacion_minima != null
                ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(meta.uber_facturacion_minima)
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
            <SummaryChip
              icon={UtensilsCrossed}
              label="Dieta"
              line1={meta.dieta_calorias_objetivo != null ? `${meta.dieta_calorias_objetivo} kcal` : '—'}
              line2=""
              done={meta.dieta_realizado}
            />
            <SummaryChip
              icon={Code2}
              label="Apps"
              line1={meta.apps_horas != null ? `${meta.apps_horas}h` : '—'}
              line2=""
              done={meta.apps_realizado}
            />
          </div>
          {meta.energia_nivel != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap size={14} />
              Energía: <span className="text-base">{ENERGIA_LABELS[meta.energia_nivel]}</span>
              <span className="text-foreground font-semibold">{meta.energia_nivel}/10</span>
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
