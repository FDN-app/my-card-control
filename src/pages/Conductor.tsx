import { useState, useMemo } from 'react';
import { Car, Fuel, Route, Clock, TrendingUp, Trash2, Pencil, Check, X, Plus, PiggyBank, BarChart3 } from 'lucide-react';
import { useFinanzas, type Jornada } from '@/hooks/useFinanzas';
import { toast } from 'sonner';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Dom
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const inicioSemana = monday.toISOString().split('T')[0];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const finSemana = sunday.toISOString().split('T')[0];
  return { inicioSemana, finSemana };
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-secondary/40 border border-border/50 rounded-xl px-4 py-3">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground text-base mt-0.5">{value}</span>
    </div>
  );
}

function calcMetrics(j: Jornada) {
  const neto = j.facturado - j.gasto_nafta;
  const kmPeso = j.km_recorridos > 0 ? neto / j.km_recorridos : 0;
  const horaPeso = j.horas > 0 ? neto / j.horas : 0;
  return { neto, kmPeso, horaPeso };
}

export default function Conductor() {
  const { jornadas, addJornada, updateJornada, deleteJornada } = useFinanzas();

  const [tab, setTab] = useState<'jornada' | 'historial' | 'semana'>('jornada');

  const [apartarPct, setApartarPct] = useState<number>(() =>
    parseInt(localStorage.getItem('cuotactrl_apartar_pct') || '20')
  );

  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    fecha: hoy,
    facturado: '',
    gasto_nafta: '',
    km_recorridos: '',
    horas: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fecha: '',
    facturado: '',
    gasto_nafta: '',
    km_recorridos: '',
    horas: '',
    notas: '',
  });

  // ── Semana actual ─────────────────────────────────────────────────────────
  const { inicioSemana, finSemana } = useMemo(() => getWeekBounds(), []);

  const jornadasSemana = useMemo(
    () => jornadas.filter(j => j.fecha >= inicioSemana && j.fecha <= finSemana),
    [jornadas, inicioSemana, finSemana]
  );

  const semana = useMemo(() => {
    const totalFacturado = jornadasSemana.reduce((s, j) => s + j.facturado, 0);
    const totalNafta = jornadasSemana.reduce((s, j) => s + j.gasto_nafta, 0);
    const totalNeto = totalFacturado - totalNafta;
    const totalKm = jornadasSemana.reduce((s, j) => s + j.km_recorridos, 0);
    const totalHoras = jornadasSemana.reduce((s, j) => s + j.horas, 0);
    const promKm = totalKm > 0 ? totalNeto / totalKm : 0;
    const promHora = totalHoras > 0 ? totalNeto / totalHoras : 0;
    return { totalFacturado, totalNafta, totalNeto, totalKm, totalHoras, promKm, promHora };
  }, [jornadasSemana]);

  // ── Mes actual ────────────────────────────────────────────────────────────
  const inicioMes = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  const jornadasMes = useMemo(
    () => jornadas.filter(j => j.fecha >= inicioMes),
    [jornadas, inicioMes]
  );

  const netoMes = jornadasMes.reduce((s, j) => s + j.facturado - j.gasto_nafta, 0);
  const netoSemana = jornadasSemana.reduce((s, j) => s + j.facturado - j.gasto_nafta, 0);

  // ── Preview tiempo real del formulario ────────────────────────────────────
  const previewNeto = (Number(form.facturado) || 0) - (Number(form.gasto_nafta) || 0);
  const previewKm = previewNeto > 0 && Number(form.km_recorridos) > 0
    ? previewNeto / Number(form.km_recorridos) : 0;
  const previewHora = previewNeto > 0 && Number(form.horas) > 0
    ? previewNeto / Number(form.horas) : 0;
  const previewApartar = previewNeto > 0 ? Math.round(previewNeto * apartarPct / 100) : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.facturado) return;
    setSaving(true);
    try {
      await addJornada({
        fecha: form.fecha,
        facturado: Number(form.facturado),
        gasto_nafta: Number(form.gasto_nafta) || 0,
        km_recorridos: Number(form.km_recorridos) || 0,
        horas: Number(form.horas) || 0,
        notas: form.notas || null,
      });
      setForm({ fecha: hoy, facturado: '', gasto_nafta: '', km_recorridos: '', horas: '', notas: '' });
      toast.success('Jornada guardada');
      setTab('historial');
    } catch {
      toast.error('Error al guardar la jornada');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJornada(id);
      toast.success('Jornada eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const openEdit = (j: Jornada) => {
    setEditingId(j.id);
    setEditForm({
      fecha: j.fecha,
      facturado: String(j.facturado),
      gasto_nafta: String(j.gasto_nafta),
      km_recorridos: String(j.km_recorridos),
      horas: String(j.horas),
      notas: j.notas || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const orig = jornadas.find(j => j.id === editingId);
    if (!orig) return;
    try {
      await updateJornada({
        ...orig,
        fecha: editForm.fecha,
        facturado: Number(editForm.facturado),
        gasto_nafta: Number(editForm.gasto_nafta) || 0,
        km_recorridos: Number(editForm.km_recorridos) || 0,
        horas: Number(editForm.horas) || 0,
        notas: editForm.notas || null,
      });
      setEditingId(null);
      toast.success('Jornada actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleApartarChange = (pct: number) => {
    setApartarPct(pct);
    localStorage.setItem('cuotactrl_apartar_pct', String(pct));
  };

  // ── Tarjeta "Apartar" ─────────────────────────────────────────────────────
  const ApartarCard = ({ montoJornada }: { montoJornada?: number }) => (
    <div className="glass-panel border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <PiggyBank size={18} className="text-primary" /> Apartar para gastos del auto
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">%</span>
          <input
            type="number"
            min="1"
            max="99"
            className="w-14 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center"
            value={apartarPct}
            onChange={e => handleApartarChange(Math.max(1, Math.min(99, Number(e.target.value))))}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Sugerido para nafta futura, service y monotributo ({apartarPct}% del neto de cada jornada).
      </p>
      <div className="grid grid-cols-3 gap-3">
        {montoJornada !== undefined && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-primary">Esta jornada</p>
            <p className="font-bold text-primary text-lg">{fmt.format(montoJornada)}</p>
          </div>
        )}
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Semana</p>
          <p className="font-bold text-foreground text-lg">{fmt.format(Math.round(netoSemana * apartarPct / 100))}</p>
        </div>
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mes</p>
          <p className="font-bold text-foreground text-lg">{fmt.format(Math.round(netoMes * apartarPct / 100))}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
          <Car className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conductor</h1>
          <p className="text-muted-foreground">Rentabilidad de tus jornadas Uber</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/50 p-1 rounded-xl">
        <button
          onClick={() => setTab('jornada')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === 'jornada' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Cerrar Jornada
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === 'historial' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Historial
        </button>
        <button
          onClick={() => setTab('semana')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === 'semana' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart3 size={14} /> Semana
        </button>
      </div>

      {/* ── TAB: CERRAR JORNADA ─────────────────────────────────────────────── */}
      {tab === 'jornada' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-panel border-border p-6">
            <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
              <Car size={18} className="text-primary" /> Cerrar el día
            </h2>
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Fecha</label>
                  <input
                    type="date"
                    className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm [color-scheme:dark]"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Facturado (ARS)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    value={form.facturado}
                    onChange={e => setForm(f => ({ ...f, facturado: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Fuel size={11} /> Nafta (ARS)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    value={form.gasto_nafta}
                    onChange={e => setForm(f => ({ ...f, gasto_nafta: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Route size={11} /> Kilómetros</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    value={form.km_recorridos}
                    onChange={e => setForm(f => ({ ...f, km_recorridos: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> Horas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    value={form.horas}
                    onChange={e => setForm(f => ({ ...f, horas: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notas (opcional)</label>
                <textarea
                  className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm resize-none"
                  rows={2}
                  placeholder="Ej: Mucho tráfico, zona norte..."
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                />
              </div>

              {/* Preview en tiempo real */}
              {previewNeto > 0 && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Neto</p>
                    <p className="font-bold text-success">{fmt.format(previewNeto)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">$/km</p>
                    <p className="font-bold text-foreground">{previewKm > 0 ? fmt.format(previewKm) : '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">$/hora</p>
                    <p className="font-bold text-foreground">{previewHora > 0 ? fmt.format(previewHora) : '—'}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-3 rounded-xl font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar Jornada'}
              </button>
            </form>
          </div>

          {/* Tarjeta apartar */}
          <ApartarCard montoJornada={previewApartar > 0 ? previewApartar : undefined} />
        </div>
      )}

      {/* ── TAB: HISTORIAL ───────────────────────────────────────────────────── */}
      {tab === 'historial' && (
        <div className="space-y-3 animate-fade-in">
          {jornadas.length === 0 ? (
            <div className="glass-panel border-border p-12 text-center border-dashed">
              <Car size={48} className="text-muted-foreground mb-4 mx-auto opacity-40" />
              <p className="text-muted-foreground">Aún no registraste ninguna jornada.</p>
            </div>
          ) : (
            jornadas.map(j => {
              const { neto, kmPeso, horaPeso } = calcMetrics(j);
              const esBuena = semana.promKm > 0 && kmPeso >= semana.promKm;
              const apartar = Math.round(neto * apartarPct / 100);

              if (editingId === j.id) {
                return (
                  <div key={j.id} className="glass-panel border-primary/20 p-4 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Fecha</label>
                        <input type="date" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground [color-scheme:dark]" value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Facturado</label>
                        <input type="number" min="0" step="any" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.facturado} onChange={e => setEditForm(f => ({ ...f, facturado: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Nafta</label>
                        <input type="number" min="0" step="any" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.gasto_nafta} onChange={e => setEditForm(f => ({ ...f, gasto_nafta: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Km</label>
                        <input type="number" min="0" step="any" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.km_recorridos} onChange={e => setEditForm(f => ({ ...f, km_recorridos: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Horas</label>
                        <input type="number" min="0" step="0.5" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.horas} onChange={e => setEditForm(f => ({ ...f, horas: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Notas</label>
                      <input type="text" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.notas} onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleSaveEdit} className="bg-success text-success-foreground px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5"><Check size={14} /> Guardar</button>
                      <button onClick={() => setEditingId(null)} className="bg-secondary text-muted-foreground px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:text-foreground"><X size={14} /> Cancelar</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={j.id} className="glass-panel border-border p-4 space-y-3 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Indicador verde/rojo vs promedio semanal */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                          semana.promKm === 0 ? 'bg-secondary' : esBuena ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]'
                        }`}
                        title={semana.promKm > 0 ? (esBuena ? 'Por encima del promedio semanal' : 'Por debajo del promedio semanal') : 'Sin promedio semanal aún'}
                      />
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {new Date(j.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        {j.notas && <p className="text-xs text-muted-foreground">{j.notas}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:text-primary"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-secondary/30 border border-border/40 rounded-lg p-2 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Facturado</p>
                      <p className="font-bold text-foreground text-sm">{fmt.format(j.facturado)}</p>
                    </div>
                    <div className={`border rounded-lg p-2 text-center ${neto >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Neto</p>
                      <p className={`font-bold text-sm ${neto >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt.format(neto)}</p>
                    </div>
                    <div className="bg-secondary/30 border border-border/40 rounded-lg p-2 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1"><Fuel size={9} /> Nafta</p>
                      <p className="font-bold text-foreground text-sm">{fmt.format(j.gasto_nafta)}</p>
                    </div>
                    <div className="bg-secondary/30 border border-border/40 rounded-lg p-2 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1"><Route size={9} /> $/km</p>
                      <p className="font-bold text-foreground text-sm">{kmPeso > 0 ? fmt.format(kmPeso) : '—'}</p>
                    </div>
                    <div className="bg-secondary/30 border border-border/40 rounded-lg p-2 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1"><Clock size={9} /> $/hora</p>
                      <p className="font-bold text-foreground text-sm">{horaPeso > 0 ? fmt.format(horaPeso) : '—'}</p>
                    </div>
                  </div>

                  {/* Sugerencia apartar */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-2 mt-1">
                    <span className="flex items-center gap-1"><PiggyBank size={11} /> Sugerido a apartar ({apartarPct}%)</span>
                    <span className="font-semibold text-primary">{fmt.format(apartar)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB: SEMANA ─────────────────────────────────────────────────────── */}
      {tab === 'semana' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-panel border-border p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Resumen Semanal
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(inicioSemana + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                {' — '}
                {new Date(finSemana + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{jornadasSemana.length} jornada{jornadasSemana.length !== 1 ? 's' : ''}
              </p>
            </div>

            {jornadasSemana.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sin jornadas esta semana.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricChip label="Total facturado" value={fmt.format(semana.totalFacturado)} />
                  <MetricChip label="Total neto" value={fmt.format(semana.totalNeto)} />
                  <MetricChip label="Total nafta" value={fmt.format(semana.totalNafta)} />
                  <MetricChip label="Km totales" value={`${semana.totalKm.toFixed(1)} km`} />
                  <MetricChip label="Horas totales" value={`${semana.totalHoras.toFixed(1)} h`} />
                  <div className="flex flex-col items-center bg-secondary/40 border border-border/50 rounded-xl px-4 py-3">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Jornadas</span>
                    <span className="font-bold text-foreground text-base mt-0.5">{jornadasSemana.length}</span>
                  </div>
                </div>

                {/* Promedios destacados */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-primary mb-1">Promedio $/km</p>
                    <p className="text-2xl font-black text-primary">{semana.promKm > 0 ? fmt.format(semana.promKm) : '—'}</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-primary mb-1">Promedio $/hora</p>
                    <p className="text-2xl font-black text-primary">{semana.promHora > 0 ? fmt.format(semana.promHora) : '—'}</p>
                  </div>
                </div>

                {/* Detalle por jornada */}
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Detalle por día</p>
                  {jornadasSemana.map(j => {
                    const { neto, kmPeso } = calcMetrics(j);
                    const esBuena = semana.promKm > 0 && kmPeso >= semana.promKm;
                    return (
                      <div key={j.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${semana.promKm === 0 ? 'bg-secondary' : esBuena ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-muted-foreground capitalize">
                            {new Date(j.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">{j.km_recorridos} km · {j.horas}h</span>
                          <span className={`font-bold ${neto >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt.format(neto)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <ApartarCard />
        </div>
      )}
    </div>
  );
}
