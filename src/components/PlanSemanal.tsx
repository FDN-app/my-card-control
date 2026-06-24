import { useState } from 'react';
import { Car, Dumbbell, BookOpen, UtensilsCrossed, Check, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlanSemanal, type DiaSemanaInput } from '@/hooks/usePlanSemanal';
import { toast } from 'sonner';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

function NumInput({ value, onChange, placeholder, step = '0.5' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; step?: string;
}) {
  return (
    <input
      type="number" min="0" step={step} value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors"
    />
  );
}

function TextInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text" value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(153_100%_50%/0.5)] focus:bg-secondary/50 transition-colors"
    />
  );
}

type DiaForm = {
  uber_horas: string;
  uber_facturacion_objetivo: string;
  gym_activo: boolean;
  gym_tipo: string;
  gym_horas: string;
  estudio_horas: string;
  estudio_tema: string;
  dieta_calorias_objetivo: string;
};

function emptyDia(): DiaForm {
  return {
    uber_horas: '',
    uber_facturacion_objetivo: '',
    gym_activo: false,
    gym_tipo: '',
    gym_horas: '',
    estudio_horas: '',
    estudio_tema: '',
    dieta_calorias_objetivo: '',
  };
}

function diaToForm(d: DiaSemanaInput): DiaForm {
  return {
    uber_horas: d.uber_horas != null ? String(d.uber_horas) : '',
    uber_facturacion_objetivo: d.uber_facturacion_objetivo != null ? String(d.uber_facturacion_objetivo) : '',
    gym_activo: d.gym_activo,
    gym_tipo: d.gym_tipo ?? '',
    gym_horas: d.gym_horas != null ? String(d.gym_horas) : '',
    estudio_horas: d.estudio_horas != null ? String(d.estudio_horas) : '',
    estudio_tema: d.estudio_tema ?? '',
    dieta_calorias_objetivo: d.dieta_calorias_objetivo != null ? String(d.dieta_calorias_objetivo) : '',
  };
}

function formToInput(dia_semana: number, f: DiaForm): DiaSemanaInput {
  return {
    dia_semana,
    uber_horas: f.uber_horas !== '' ? Number(f.uber_horas) : null,
    uber_facturacion_objetivo: f.uber_facturacion_objetivo !== '' ? Number(f.uber_facturacion_objetivo) : null,
    gym_activo: f.gym_activo,
    gym_tipo: f.gym_tipo || null,
    gym_horas: f.gym_horas !== '' ? Number(f.gym_horas) : null,
    estudio_horas: f.estudio_horas !== '' ? Number(f.estudio_horas) : null,
    estudio_tema: f.estudio_tema || null,
    dieta_calorias_objetivo: f.dieta_calorias_objetivo !== '' ? Number(f.dieta_calorias_objetivo) : null,
  };
}

function DiaCard({ dia_semana, existing, upsertDia }: {
  dia_semana: number;
  existing: DiaSemanaInput | null;
  upsertDia: (input: DiaSemanaInput) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DiaForm>(() => existing ? diaToForm(existing) : emptyDia());
  const [saving, setSaving] = useState(false);

  const set = (k: keyof DiaForm) => (v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertDia(formToInput(dia_semana, form));
      toast.success(`${DIAS[dia_semana]} guardado`);
      setOpen(false);
    } catch (err: any) {
      console.error('[PlanSemanal] save error:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const hasData = existing && (
    existing.uber_horas != null ||
    existing.gym_activo ||
    existing.estudio_horas != null ||
    existing.dieta_calorias_objetivo != null
  );

  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{
        background: 'hsl(215 55% 5%)',
        borderColor: open ? 'hsl(153 100% 50% / 0.4)' : 'hsl(215 45% 12%)',
        boxShadow: open ? '0 0 16px hsl(153 100% 50% / 0.08)' : undefined,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            style={{
              background: hasData ? 'hsl(153 100% 50% / 0.12)' : 'hsl(215 45% 10%)',
              border: `1px solid ${hasData ? 'hsl(153 100% 50% / 0.4)' : 'hsl(215 45% 15%)'}`,
              color: hasData ? 'hsl(153 100% 50%)' : 'hsl(215 20% 50%)',
            }}
          >
            {DIAS_CORTO[dia_semana]}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{DIAS[dia_semana]}</span>
            {hasData && (
              <div className="flex gap-1">
                {existing?.uber_horas != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(153_100%_50%/0.08)] text-[hsl(153_100%_50%)] border border-[hsl(153_100%_50%/0.2)]">
                    <Car size={9} className="inline mr-0.5" />{existing.uber_horas}h
                  </span>
                )}
                {existing?.gym_activo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(153_100%_50%/0.08)] text-[hsl(153_100%_50%)] border border-[hsl(153_100%_50%/0.2)]">
                    <Dumbbell size={9} className="inline mr-0.5" />Gym
                  </span>
                )}
                {existing?.estudio_horas != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(153_100%_50%/0.08)] text-[hsl(153_100%_50%)] border border-[hsl(153_100%_50%/0.2)]">
                    <BookOpen size={9} className="inline mr-0.5" />{existing.estudio_horas}h
                  </span>
                )}
                {existing?.dieta_calorias_objetivo != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(153_100%_50%/0.08)] text-[hsl(153_100%_50%)] border border-[hsl(153_100%_50%/0.2)]">
                    <UtensilsCrossed size={9} className="inline mr-0.5" />{existing.dieta_calorias_objetivo}kcal
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      {/* Expandable form */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4">

          {/* Uber */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Car size={13} className="text-[hsl(153_100%_50%)]" /> Uber
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.uber_horas} onChange={set('uber_horas')} placeholder="0" />
              </Field>
              <Field label="Facturación obj. ($)">
                <NumInput value={form.uber_facturacion_objetivo} onChange={set('uber_facturacion_objetivo')} placeholder="0" step="100" />
              </Field>
            </div>
          </div>

          {/* Gym */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Dumbbell size={13} className="text-[hsl(153_100%_50%)]" /> Gym
              </p>
              <button
                type="button"
                onClick={() => set('gym_activo')(!form.gym_activo)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${neon(form.gym_activo)}`}
              >
                {form.gym_activo && <Check size={11} />}
                {form.gym_activo ? 'Activo' : 'Descanso'}
              </button>
            </div>
            {form.gym_activo && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Horas">
                  <NumInput value={form.gym_horas} onChange={set('gym_horas')} placeholder="0" />
                </Field>
                <Field label="Tipo">
                  <TextInput value={form.gym_tipo} onChange={set('gym_tipo')} placeholder="Ej: Pecho, Cardio..." />
                </Field>
              </div>
            )}
          </div>

          {/* Estudio */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BookOpen size={13} className="text-[hsl(153_100%_50%)]" /> Estudio
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Horas">
                <NumInput value={form.estudio_horas} onChange={set('estudio_horas')} placeholder="0" />
              </Field>
              <Field label="Tema">
                <TextInput value={form.estudio_tema} onChange={set('estudio_tema')} placeholder="Ej: React, Inglés..." />
              </Field>
            </div>
          </div>

          {/* Dieta */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UtensilsCrossed size={13} className="text-[hsl(153_100%_50%)]" /> Dieta
            </p>
            <Field label="Calorías objetivo">
              <NumInput value={form.dieta_calorias_objetivo} onChange={set('dieta_calorias_objetivo')} placeholder="2000" step="50" />
            </Field>
          </div>

          <button
            type="button"
            onClick={handleSave}
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
            {saving ? 'Guardando…' : 'Guardar día'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlanSemanal() {
  const { plan, isLoading, upsertDia } = usePlanSemanal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Cargando plan…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Plan Semanal</h1>
        <p className="text-sm text-muted-foreground">Configurá tus objetivos por día de la semana</p>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5, 6].map(dia => (
          <DiaCard
            key={dia}
            dia_semana={dia}
            existing={plan.find(d => d.dia_semana === dia) ?? null}
            upsertDia={upsertDia}
          />
        ))}
      </div>
    </div>
  );
}
