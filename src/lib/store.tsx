import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { INITIAL_CARDS, INITIAL_EXPENSES, INITIAL_SUBSCRIPTIONS, type CreditCard, type Expense, type Subscription } from '@/lib/data';
import { toast } from 'sonner';

interface AppState {
  cards: CreditCard[];
  expenses: Expense[];
  subscriptions: Subscription[];
  subscriptionAlertDays: number;
  alertThreshold: number;
  setAlertThreshold: (v: number) => void;
  setSubscriptionAlertDays: (v: number) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (card: CreditCard) => void;
  deleteCard: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string | number) => void;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
  getCardExpenses: (cardId: string) => Expense[];
  getCardProjected: (cardId: string) => number;
  nextMonthTotal: number;
  totalBudget: number;
  loadingData: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or use defaults
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('cuotactrl_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('cuotactrl_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('cuotactrl_subscriptions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });
  
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('cuotactrl_alert_threshold');
    return saved ? JSON.parse(saved) : 80;
  });

  const [subscriptionAlertDays, setSubscriptionAlertDays] = useState<number>(() => {
    const saved = localStorage.getItem('cuotactrl_sub_alert_days');
    return saved ? JSON.parse(saved) : 3;
  });

  const [loadingData, setLoadingData] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cuotactrl_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('cuotactrl_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('cuotactrl_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);
  
  useEffect(() => {
    localStorage.setItem('cuotactrl_alert_threshold', JSON.stringify(alertThreshold));
  }, [alertThreshold]);

  useEffect(() => {
    localStorage.setItem('cuotactrl_sub_alert_days', JSON.stringify(subscriptionAlertDays));
  }, [subscriptionAlertDays]);

  const addCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    setCards(prev => [...prev, { ...card, id: `c${Date.now()}` }]);
    toast.success("Tarjeta creada con éxito");
  }, []);

  const updateCard = useCallback((card: CreditCard) => {
    setCards(prev => prev.map(c => c.id === card.id ? card : c));
    toast.success("Tarjeta actualizada");
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setExpenses(prev => prev.filter(e => e.cardId !== id));
    toast.success("Tarjeta eliminada");
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
    toast.success("Gasto cargado exitosamente");
  }, []);

  const updateExpense = useCallback((expense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    toast.success("Gasto actualizado exitosamente");
  }, []);

  const deleteExpense = useCallback((id: string | number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("Gasto eliminado");
  }, []);

  const addSubscription = useCallback((sub: Omit<Subscription, 'id'>) => {
    setSubscriptions(prev => [...prev, { ...sub, id: `s${Date.now()}` }]);
    toast.success("Suscripción agregada");
  }, []);

  const updateSubscription = useCallback((sub: Subscription) => {
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s));
    toast.success("Suscripción actualizada");
  }, []);

  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    toast.success("Suscripción eliminada");
  }, []);

  const getCardExpenses = useCallback((cardId: string) => {
    return expenses.filter(e => e.cardId === cardId);
  }, [expenses]);

  const getCardProjected = useCallback((cardId: string) => {
    return expenses
      .filter(e => e.cardId === cardId && e.current <= e.installments)
      .reduce((acc, e) => acc + Math.round(e.total / e.installments), 0);
  }, [expenses]);

  const nextMonthTotal = useMemo(() =>
    expenses
      .filter(e => e.current < e.installments || e.installments === 1)
      .reduce((acc, e) => acc + Math.round(e.total / e.installments), 0),
    [expenses]
  );

  const totalBudget = useMemo(() => cards.reduce((acc, c) => acc + c.budget, 0), [cards]);

  return (
    <AppContext.Provider value={{
      cards, expenses, subscriptions, alertThreshold, subscriptionAlertDays,
      setAlertThreshold, setSubscriptionAlertDays,
      addCard, updateCard, deleteCard, addExpense, updateExpense, deleteExpense,
      addSubscription, updateSubscription, deleteSubscription,
      getCardExpenses, getCardProjected, nextMonthTotal, totalBudget,
      loadingData
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
