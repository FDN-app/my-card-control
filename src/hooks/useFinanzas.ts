import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useTelegramAlert } from '@/hooks/useTelegramAlert';
import { getHoyArDate, formatYMD } from '@/lib/dateAR';
import type { Expense } from '@/lib/data';

export interface Ingreso {
  id: string;
  user_id: string;
  fecha: string;
  monto: number;
  tipo: 'fijo' | 'variable';
  descripcion: string | null;
}

export interface GastoDiario {
  id: string;
  user_id: string;
  fecha: string;
  monto: number;
  categoria: string;
  descripcion: string | null;
  medio_pago: 'efectivo' | 'transferencia' | 'otro';
}

export interface Presupuesto {
  id: string;
  user_id: string;
  categoria: string;
  limite_mensual: number;
  moneda: string;
  created_at: string;
}

export interface ReglaCategoria {
  id: string;
  user_id: string;
  patron: string;
  categoria: string;
  created_at: string;
}

export interface MetaAhorro {
  id: string;
  user_id: string;
  nombre: string;
  objetivo: number;
  fecha_limite: string | null;
  ahorrado_actual: number;
  moneda: string;
  created_at: string;
}

export interface Jornada {
  id: string;
  user_id: string;
  fecha: string;
  facturado: number;
  gasto_nafta: number;
  km_recorridos: number;
  horas: number;
  notas: string | null;
  created_at: string;
}

export const CATEGORIAS_GASTOS = [
  'Supermercado', 'Servicios', 'Transporte', 'Comida', 'Entretenimiento',
  'Salud', 'Educación', 'Ropa', 'Transferencia', 'Ahorro', 'Otros',
] as const;

// ── Funciones puras para Fase 5 ─────────────────────────────────────────────

export function calcularProyeccionDeuda(expenses: Expense[]) {
  return expenses
    .filter(e => e.current < e.installments)
    .map(expense => {
      const primeraCuota = new Date(expense.date + 'T00:00:00');
      const montoCuota = expense.installmentAmount || Math.round(expense.total / expense.installments);
      const tasaInteres = expense.tasa_interes || 0;
      const montoConInteres = tasaInteres > 0 ? montoCuota * (1 + tasaInteres / 100) : montoCuota;
      const cuotasFaltantes = expense.installments - expense.current;

      const detallesMeses = Array.from({ length: cuotasFaltantes }, (_, idx) => {
        const fechaCuota = new Date(primeraCuota);
        fechaCuota.setMonth(primeraCuota.getMonth() + expense.current + idx);
        const mesKey = `${fechaCuota.getFullYear()}-${String(fechaCuota.getMonth() + 1).padStart(2, '0')}`;
        const mesLabel = fechaCuota.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        return { mesKey, mes: mesLabel, monto: montoConInteres };
      });

      return {
        gastoId: expense.id,
        descripcion: expense.desc,
        tarjetaId: expense.cardId,
        cuotasFaltantes,
        montoCuota: montoConInteres,
        tasaInteres,
        detallesMeses,
      };
    });
}

export function consolidarDeudaPorMes(proyeccion: ReturnType<typeof calcularProyeccionDeuda>) {
  const porMes: Record<string, number> = {};
  proyeccion.forEach(p =>
    p.detallesMeses.forEach(({ mesKey, monto }) => {
      porMes[mesKey] = (porMes[mesKey] || 0) + monto;
    })
  );
  return Object.entries(porMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mesKey, total]) => {
      const [y, m] = mesKey.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      return { mesKey, mes: label, total };
    });
}

// ── Hook principal ───────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function useFinanzas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendAlert } = useTelegramAlert();

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: configuracion, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracion', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_usuario')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { salario_mensual: 0 };
    },
    enabled: !!user,
  });

  const { data: ingresos = [], isLoading: loadingIngresos } = useQuery({
    queryKey: ['ingresos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as Ingreso[];
    },
    enabled: !!user,
  });

  const { data: gastosDiarios = [], isLoading: loadingGastos } = useQuery({
    queryKey: ['gastos_diarios', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_diarios')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as GastoDiario[];
    },
    enabled: !!user,
  });

  const { data: presupuestos = [], isLoading: loadingPresupuestos } = useQuery({
    queryKey: ['presupuestos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('user_id', user?.id)
        .order('categoria');
      if (error) throw error;
      return data as Presupuesto[];
    },
    enabled: !!user,
  });

  const { data: reglas = [], isLoading: loadingReglas } = useQuery({
    queryKey: ['reglas_categoria', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reglas_categoria')
        .select('*')
        .eq('user_id', user?.id)
        .order('patron');
      if (error) throw error;
      return data as ReglaCategoria[];
    },
    enabled: !!user,
  });

  const { data: metasAhorro = [], isLoading: loadingMetas } = useQuery({
    queryKey: ['metas_ahorro', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_ahorro')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as MetaAhorro[];
    },
    enabled: !!user,
  });

  const { data: jornadas = [], isLoading: loadingJornadas } = useQuery({
    queryKey: ['jornadas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jornadas')
        .select('*')
        .eq('user_id', user?.id)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as Jornada[];
    },
    enabled: !!user,
  });

  // ── Ingresos por tipo del mes actual ─────────────────────────────────────

  const { ingresosFijoMes, ingresosVariableMes } = (() => {
    const arNow = getHoyArDate();
    const startOfMonth = formatYMD(new Date(arNow.getFullYear(), arNow.getMonth(), 1));
    const mes = ingresos.filter(i => i.fecha >= startOfMonth);
    return {
      ingresosFijoMes: mes.filter(i => i.tipo === 'fijo'),
      ingresosVariableMes: mes.filter(i => i.tipo === 'variable'),
    };
  })();

  // ── Gasto por categoría vs presupuesto (mes actual) ──────────────────────

  const gastadoPorCategoria = (() => {
    const arNow = getHoyArDate();
    const startOfMonth = formatYMD(new Date(arNow.getFullYear(), arNow.getMonth(), 1));
    const gastosMes = gastosDiarios.filter(g => g.fecha >= startOfMonth);
    const map: Record<string, number> = {};
    gastosMes.forEach(g => { map[g.categoria] = (map[g.categoria] || 0) + g.monto; });
    return presupuestos.map(p => ({
      ...p,
      gastado: map[p.categoria] || 0,
      porcentaje: p.limite_mensual > 0
        ? Math.round(((map[p.categoria] || 0) / p.limite_mensual) * 100)
        : 0,
    }));
  })();

  // ── Mutations: Configuración ─────────────────────────────────────────────

  const setSalario = useMutation({
    mutationFn: async (salario_mensual: number) => {
      const { error } = await supabase
        .from('configuracion_usuario')
        .upsert({ user_id: user!.id, salario_mensual, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion', user?.id] }),
  });

  // ── Mutations: Ingresos ───────────────────────────────────────────────────

  const addIngreso = useMutation({
    mutationFn: async (ingreso: Omit<Ingreso, 'id' | 'user_id'>) => {
      const { error } = await supabase.from('ingresos').insert([{ ...ingreso, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  const updateIngreso = useMutation({
    mutationFn: async (ingreso: Ingreso) => {
      const { id, user_id, ...updateData } = ingreso;
      const { error } = await supabase.from('ingresos').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  const deleteIngreso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingresos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingresos', user?.id] }),
  });

  // ── Mutations: Gastos diarios ─────────────────────────────────────────────

  const addGastoDiario = useMutation({
    mutationFn: async (gasto: Omit<GastoDiario, 'id' | 'user_id'>) => {
      // Auto-categorización por reglas (case-insensitive sobre descripción)
      let categoriaFinal = gasto.categoria;
      if (reglas.length > 0) {
        const haystack = `${gasto.descripcion ?? ''} ${gasto.categoria}`.toLowerCase();
        const match = reglas.find(r => haystack.includes(r.patron.toLowerCase()));
        if (match) categoriaFinal = match.categoria;
      }

      const { error } = await supabase
        .from('gastos_diarios')
        .insert([{ ...gasto, categoria: categoriaFinal, user_id: user!.id }]);
      if (error) throw error;
      return { ...gasto, categoria: categoriaFinal };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] });

      if (data.monto > 50000) {
        sendAlert('💸 Gasto grande', `${fmt.format(data.monto)} en ${data.categoria}`);
      }

      const presupuesto = presupuestos.find(p => p.categoria === data.categoria);
      if (presupuesto && presupuesto.limite_mensual > 0) {
        const threshold = parseInt(localStorage.getItem('cuotactrl_alert_threshold') || '80');
        const arNow = getHoyArDate();
        const startOfMonth = formatYMD(new Date(arNow.getFullYear(), arNow.getMonth(), 1));
        const { data: gastosMesData } = await supabase
          .from('gastos_diarios')
          .select('monto')
          .eq('user_id', user!.id)
          .eq('categoria', data.categoria)
          .gte('fecha', startOfMonth);
        const totalActual = (gastosMesData || []).reduce((s, g) => s + g.monto, 0);
        const pct = Math.round((totalActual / presupuesto.limite_mensual) * 100);
        if (pct >= threshold) {
          sendAlert(
            `⚠️ Presupuesto de ${data.categoria} al ${pct}%`,
            `Gastaste ${fmt.format(totalActual)} de ${fmt.format(presupuesto.limite_mensual)}`
          );
        }
      }
    },
  });

  const updateGastoDiario = useMutation({
    mutationFn: async (gasto: GastoDiario) => {
      const { id, user_id, ...updateData } = gasto;
      const { error } = await supabase.from('gastos_diarios').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] }),
  });

  const deleteGastoDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos_diarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos_diarios', user?.id] }),
  });

  // ── Mutations: Presupuestos ───────────────────────────────────────────────

  const addPresupuesto = useMutation({
    mutationFn: async (p: Pick<Presupuesto, 'categoria' | 'limite_mensual' | 'moneda'>) => {
      const { error } = await supabase.from('presupuestos').insert([{ ...p, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presupuestos', user?.id] }),
  });

  const updatePresupuesto = useMutation({
    mutationFn: async (p: Presupuesto) => {
      const { id, user_id, created_at, ...updateData } = p;
      const { error } = await supabase.from('presupuestos').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presupuestos', user?.id] }),
  });

  const deletePresupuesto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('presupuestos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presupuestos', user?.id] }),
  });

  // ── Mutations: Reglas de categoría ───────────────────────────────────────

  const addRegla = useMutation({
    mutationFn: async (r: Pick<ReglaCategoria, 'patron' | 'categoria'>) => {
      const { error } = await supabase.from('reglas_categoria').insert([{ ...r, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reglas_categoria', user?.id] }),
  });

  const updateRegla = useMutation({
    mutationFn: async (r: ReglaCategoria) => {
      const { id, user_id, created_at, ...updateData } = r;
      const { error } = await supabase.from('reglas_categoria').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reglas_categoria', user?.id] }),
  });

  const deleteRegla = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reglas_categoria').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reglas_categoria', user?.id] }),
  });

  // ── Mutations: Metas de ahorro ────────────────────────────────────────────

  const addMeta = useMutation({
    mutationFn: async (m: Pick<MetaAhorro, 'nombre' | 'objetivo' | 'fecha_limite' | 'moneda'>) => {
      const { error } = await supabase
        .from('metas_ahorro')
        .insert([{ ...m, user_id: user!.id, ahorrado_actual: 0 }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas_ahorro', user?.id] }),
  });

  const updateMeta = useMutation({
    mutationFn: async (m: MetaAhorro) => {
      const { id, user_id, created_at, ...updateData } = m;
      const { error } = await supabase.from('metas_ahorro').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas_ahorro', user?.id] }),
  });

  const deleteMeta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_ahorro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas_ahorro', user?.id] }),
  });

  const agregarAporte = useMutation({
    mutationFn: async ({ id, aporte }: { id: string; aporte: number }) => {
      const meta = metasAhorro.find(m => m.id === id);
      if (!meta) throw new Error('Meta no encontrada');
      const nuevo = Math.min(meta.ahorrado_actual + aporte, meta.objetivo);
      const { error } = await supabase
        .from('metas_ahorro')
        .update({ ahorrado_actual: nuevo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas_ahorro', user?.id] }),
  });

  // ── Mutations: Jornadas ───────────────────────────────────────────────────

  const addJornada = useMutation({
    mutationFn: async (j: Omit<Jornada, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('jornadas').insert([{ ...j, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jornadas', user?.id] }),
  });

  const updateJornada = useMutation({
    mutationFn: async (j: Jornada) => {
      const { id, user_id, created_at, ...updateData } = j;
      const { error } = await supabase.from('jornadas').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jornadas', user?.id] }),
  });

  const deleteJornada = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jornadas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jornadas', user?.id] }),
  });

  return {
    configuracion,
    ingresos,
    ingresosFijoMes,
    ingresosVariableMes,
    gastosDiarios,
    presupuestos,
    reglas,
    metasAhorro,
    jornadas,
    gastadoPorCategoria,
    loading: loadingConfig || loadingIngresos || loadingGastos || loadingPresupuestos || loadingReglas || loadingMetas || loadingJornadas,
    setSalario: setSalario.mutateAsync,
    addIngreso: addIngreso.mutateAsync,
    updateIngreso: updateIngreso.mutateAsync,
    deleteIngreso: deleteIngreso.mutateAsync,
    addGastoDiario: addGastoDiario.mutateAsync,
    updateGastoDiario: updateGastoDiario.mutateAsync,
    deleteGastoDiario: deleteGastoDiario.mutateAsync,
    addPresupuesto: addPresupuesto.mutateAsync,
    updatePresupuesto: updatePresupuesto.mutateAsync,
    deletePresupuesto: deletePresupuesto.mutateAsync,
    addRegla: addRegla.mutateAsync,
    updateRegla: updateRegla.mutateAsync,
    deleteRegla: deleteRegla.mutateAsync,
    addMeta: addMeta.mutateAsync,
    updateMeta: updateMeta.mutateAsync,
    deleteMeta: deleteMeta.mutateAsync,
    agregarAporte: agregarAporte.mutateAsync,
    addJornada: addJornada.mutateAsync,
    updateJornada: updateJornada.mutateAsync,
    deleteJornada: deleteJornada.mutateAsync,
  };
}
