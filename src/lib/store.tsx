import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { type CreditCard, type Expense } from '@/lib/data';
import { toast } from 'sonner';

interface AppState {
  cards: CreditCard[];
  expenses: Expense[];
  alertThreshold: number;
  subscriptionAlertDays: number;
  setAlertThreshold: (v: number) => void;
  setSubscriptionAlertDays: (v: number) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  updateCard: (card: CreditCard) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string | number) => Promise<void>;
  getCardExpenses: (cardId: string) => Expense[];
  getCardProjected: (cardId: string) => number;
  nextMonthTotal: number;
  totalBudget: number;
  loadingData: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local Preferences
  const [alertThreshold, setAlertThreshold] = React.useState<number>(() => {
    const saved = localStorage.getItem('cuotactrl_alert_threshold');
    return saved ? JSON.parse(saved) : 80;
  });

  const [subscriptionAlertDays, setSubscriptionAlertDays] = React.useState<number>(() => {
    const saved = localStorage.getItem('cuotactrl_sub_alert_days');
    return saved ? JSON.parse(saved) : 3;
  });

  React.useEffect(() => localStorage.setItem('cuotactrl_alert_threshold', JSON.stringify(alertThreshold)), [alertThreshold]);
  React.useEffect(() => localStorage.setItem('cuotactrl_sub_alert_days', JSON.stringify(subscriptionAlertDays)), [subscriptionAlertDays]);

  // DB Queries
  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['cards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tarjetas').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data.map(db => ({
        id: db.id,
        name: db.nombre,
        bank: db.banco,
        budget: Number(db.presupuesto_propio),
        gradient: db.color || 'from-blue-600 to-indigo-700',
        lastDigits: db.ultimos_digitos || '',
      })) as CreditCard[];
    },
    enabled: !!user,
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('gastos').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data.map(db => ({
        id: db.id,
        cardId: db.tarjeta_id,
        desc: db.descripcion,
        total: Number(db.monto_total),
        installments: db.cuotas_total,
        current: db.cuota_actual,
        date: db.fecha_primera_cuota,
        category: db.categoria,
        installmentAmount: Number(db.monto_cuota) || 0
      })) as Expense[];
    },
    enabled: !!user,
  });

  // DB Mutations - Cards
  const { mutateAsync: mutateAddCard } = useMutation({
    mutationFn: async (card: Omit<CreditCard, 'id'>) => {
      const { error } = await supabase.from('tarjetas').insert({
        user_id: user!.id,
        nombre: card.name,
        banco: card.bank,
        presupuesto_propio: card.budget,
        color: card.gradient,
        ultimos_digitos: card.lastDigits,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success("Tarjeta creada con éxito");
    }
  });

  const { mutateAsync: mutateUpdateCard } = useMutation({
    mutationFn: async (card: CreditCard) => {
      const { error } = await supabase.from('tarjetas').update({
        nombre: card.name,
        banco: card.bank,
        presupuesto_propio: card.budget,
        color: card.gradient,
        ultimos_digitos: card.lastDigits,
      }).eq('id', card.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success("Tarjeta actualizada");
    }
  });

  const { mutateAsync: mutateDeleteCard } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tarjetas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cards'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
      ]);
      toast.success("Tarjeta eliminada");
    }
  });

  // DB Mutations - Expenses
  const { mutateAsync: mutateAddExpense } = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      const { error } = await supabase.from('gastos').insert({
        user_id: user!.id,
        tarjeta_id: expense.cardId,
        descripcion: expense.desc,
        monto_total: expense.total,
        cuotas_total: expense.installments,
        cuota_actual: expense.current,
        fecha_primera_cuota: expense.date,
        categoria: expense.category,
        monto_cuota: expense.installmentAmount,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Gasto cargado exitosamente");
    }
  });

  const { mutateAsync: mutateUpdateExpense } = useMutation({
    mutationFn: async (expense: Expense) => {
      const { error } = await supabase.from('gastos').update({
        tarjeta_id: expense.cardId,
        descripcion: expense.desc,
        monto_total: expense.total,
        cuotas_total: expense.installments,
        cuota_actual: expense.current,
        fecha_primera_cuota: expense.date,
        categoria: expense.category,
        monto_cuota: expense.installmentAmount,
      }).eq('id', expense.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Gasto actualizado exitosamente");
    }
  });

  const { mutateAsync: mutateDeleteExpense } = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Gasto eliminado");
    }
  });

  // Derived calculations
  const getCardExpenses = React.useCallback((cardId: string) => {
    return expenses.filter(e => String(e.cardId) === String(cardId));
  }, [expenses]);

  const getCardProjected = React.useCallback((cardId: string) => {
    return expenses
      .filter(e => String(e.cardId) === String(cardId) && e.current <= e.installments)
      .reduce((acc, e) => acc + (e.installmentAmount || Math.round(e.total / e.installments)), 0);
  }, [expenses]);

  const nextMonthTotal = useMemo(() =>
    expenses
      .filter(e => e.current < e.installments || e.installments === 1)
      .reduce((acc, e) => acc + (e.installmentAmount || Math.round(e.total / e.installments)), 0),
  [expenses]);

  const totalBudget = useMemo(() => cards.reduce((acc, c) => acc + c.budget, 0), [cards]);

  return (
    <AppContext.Provider value={{
      cards, expenses, alertThreshold, subscriptionAlertDays,
      setAlertThreshold, setSubscriptionAlertDays,
      addCard: mutateAddCard, updateCard: mutateUpdateCard, deleteCard: mutateDeleteCard, 
      addExpense: mutateAddExpense, updateExpense: mutateUpdateExpense, deleteExpense: mutateDeleteExpense,
      getCardExpenses, getCardProjected, nextMonthTotal, totalBudget,
      loadingData: loadingCards || loadingExpenses
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
