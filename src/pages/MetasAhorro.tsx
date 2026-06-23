import { useState, useMemo } from 'react';
import { Target, Plus, Trash2, Pencil, Check, X, PiggyBank, CalendarClock } from 'lucide-react';
import { useFinanzas, type MetaAhorro } from '@/hooks/useFinanzas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function calcularFechaEstimada(meta: MetaAhorro): Date | null {
  if (meta.ahorrado_actual <= 0) return null;
  const creado = new Date(meta.created_at);
  const ahora = new Date();
  const mesesActiva =
    (ahora.getFullYear() - creado.getFullYear()) * 12 +
    (ahora.getMonth() - creado.getMonth()) || 1;
  const ritmo = meta.ahorrado_actual / mesesActiva;
  if (ritmo <= 0) return null;
  const restante = meta.objetivo - meta.ahorrado_actual;
  if (restante <= 0) return null;
  const estimada = new Date();
  estimada.setMonth(estimada.getMonth() + Math.ceil(restante / ritmo));
  return estimada;
}

function BarraProgreso({ pct, completada }: { pct: number; completada: boolean }) {
  return (
    <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${completada ? 'bg-green-500' : 'bg-primary'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function MetasAhorro() {
  const { metasAhorro, addMeta, updateMeta, deleteMeta, agregarAporte } = useFinanzas();

  const [form, setForm] = useState({ nombre: '', objetivo: '', fecha_limite: '' });
  const [editingMeta, setEditingMeta] = useState<MetaAhorro | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', objetivo: '', fecha_limite: '' });
  const [aporteId, setAporteId] = useState<string | null>(null);
  const [aporteVal, setAporteVal] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const objetivo = Number(form.objetivo);
    if (!form.nombre.trim() || !objetivo || objetivo <= 0) return;
    setSaving(true);
    try {
      await addMeta({
        nombre: form.nombre.trim(),
        objetivo,
        fecha_limite: form.fecha_limite || null,
        moneda: 'ARS',
      });
      setForm({ nombre: '', objetivo: '', fecha_limite: '' });
      toast.success('Meta creada');
    } catch {
      toast.error('Error al crear la meta');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMeta) return;
    const objetivo = Number(editForm.objetivo);
    if (!editForm.nombre.trim() || !objetivo || objetivo <= 0) return;
    setSaving(true);
    try {
      await updateMeta({
        ...editingMeta,
        nombre: editForm.nombre.trim(),
        objetivo,
        fecha_limite: editForm.fecha_limite || null,
      });
      setEditingMeta(null);
      toast.success('Meta actualizada');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeta(id);
      toast.success('Meta eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleAporte = async (id: string) => {
    const val = Number(aporteVal);
    if (!val || val <= 0) return;
    try {
      await agregarAporte({ id, aporte: val });
      setAporteId(null);
      setAporteVal('');
      toast.success(`Aporte de ${fmt.format(val)} registrado`);
    } catch {
      toast.error('Error al registrar el aporte');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
          <Target className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Metas de Ahorro</h1>
          <p className="text-muted-foreground">Definí objetivos y seguí tu progreso</p>
        </div>
      </div>

      {/* Formulario de nueva meta */}
      <div className="glass-panel border-border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
          <PiggyBank className="text-primary" size={20} /> Nueva Meta
        </h2>
        <form onSubmit={handleAddMeta} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Nombre de la meta</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Viaje a Europa"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Objetivo (ARS)</Label>
              <Input
                type="number"
                min="1"
                className="mt-1"
                placeholder="Ej: 500000"
                value={form.objetivo}
                onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-xs">Fecha límite (opcional)</Label>
              <Input
                type="date"
                className="mt-1 [color-scheme:dark]"
                value={form.fecha_limite}
                onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={saving} className="gap-2 shrink-0">
              <Plus size={16} /> Crear Meta
            </Button>
          </div>
        </form>
      </div>

      {/* Lista de metas */}
      {metasAhorro.length === 0 ? (
        <div className="glass-panel border-border p-12 text-center border-dashed">
          <Target size={48} className="text-muted-foreground mb-4 mx-auto opacity-40" />
          <p className="text-muted-foreground">Aún no creaste ninguna meta de ahorro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {metasAhorro.map(meta => {
            const pct = meta.objetivo > 0 ? Math.round((meta.ahorrado_actual / meta.objetivo) * 100) : 0;
            const completada = pct >= 100;
            const fechaEstimada = calcularFechaEstimada(meta);
            const fechaLimite = meta.fecha_limite ? new Date(meta.fecha_limite + 'T00:00:00') : null;
            const llegarATiempo = fechaEstimada && fechaLimite ? fechaEstimada <= fechaLimite : null;

            return (
              <div key={meta.id} className="glass-panel border-border p-5 space-y-4">
                {editingMeta?.id === meta.id ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nombre</Label>
                        <Input className="mt-1" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Objetivo (ARS)</Label>
                        <Input type="number" className="mt-1" value={editForm.objetivo} onChange={e => setEditForm(f => ({ ...f, objetivo: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Fecha límite</Label>
                        <Input type="date" className="mt-1 [color-scheme:dark]" value={editForm.fecha_limite} onChange={e => setEditForm(f => ({ ...f, fecha_limite: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} disabled={saving} className="bg-success text-success-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50">
                          <Check size={14} /> Guardar
                        </button>
                        <button onClick={() => setEditingMeta(null)} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 hover:text-foreground">
                          <X size={14} /> Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{meta.nombre}</h3>
                          {completada && (
                            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                              ¡Completada!
                            </span>
                          )}
                        </div>
                        {fechaLimite && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarClock size={11} />
                            Fecha límite: {fechaLimite.toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 text-muted-foreground">
                        <button onClick={() => { setEditingMeta(meta); setEditForm({ nombre: meta.nombre, objetivo: String(meta.objetivo), fecha_limite: meta.fecha_limite || '' }); }} className="hover:text-primary p-1 rounded"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(meta.id)} className="hover:text-destructive p-1 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-bold text-foreground">{pct}%</span>
                      </div>
                      <BarraProgreso pct={pct} completada={completada} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt.format(meta.ahorrado_actual)} ahorrado</span>
                        <span>Meta: {fmt.format(meta.objetivo)}</span>
                      </div>
                    </div>

                    {/* Proyección */}
                    {!completada && (
                      <div className="flex items-center gap-2 text-xs">
                        {fechaEstimada ? (
                          <span className={`px-2 py-1 rounded-lg border ${
                            llegarATiempo === false
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-primary/10 border-primary/20 text-primary'
                          }`}>
                            {llegarATiempo === false ? '⚠️ ' : '📅 '}
                            Estimado: {fechaEstimada.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                            {llegarATiempo === false && ' (tarde)'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Sin datos suficientes para proyectar</span>
                        )}
                        <span className="text-muted-foreground">
                          Falta {fmt.format(meta.objetivo - meta.ahorrado_actual)}
                        </span>
                      </div>
                    )}

                    {/* Aporte */}
                    {!completada && (
                      <div>
                        {aporteId === meta.id ? (
                          <div className="flex gap-2 items-center animate-fade-in">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Monto del aporte"
                              className="flex-1"
                              value={aporteVal}
                              onChange={e => setAporteVal(e.target.value)}
                              autoFocus
                            />
                            <button onClick={() => handleAporte(meta.id)} className="bg-success text-success-foreground px-4 py-2 rounded-lg text-sm font-medium"><Check size={14} /></button>
                            <button onClick={() => { setAporteId(null); setAporteVal(''); }} className="text-muted-foreground p-2 rounded-lg hover:text-foreground"><X size={14} /></button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 w-full border-primary/20 hover:bg-primary/10 text-primary"
                            onClick={() => { setAporteId(meta.id); setAporteVal(''); }}
                          >
                            <Plus size={14} /> Registrar aporte
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
