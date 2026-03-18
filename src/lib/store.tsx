import React, { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { INITIAL_CARDS, INITIAL_EXPENSES, type CreditCard, type Expense } from '@/lib/data';

interface AppState {
  cards: CreditCard[];
  expenses: Expense[];
  alertThreshold: number;
  setAlertThreshold: (v: number) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (card: CreditCard) => void;
  deleteCard: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: number) => void;
  getCardExpenses: (cardId: string) => Expense[];
  getCardProjected: (cardId: string) => number;
  nextMonthTotal: number;
  totalBudget: number;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<CreditCard[]>(INITIAL_CARDS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [alertThreshold, setAlertThreshold] = useState(80);

  const addCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    setCards(prev => [...prev, { ...card, id: `c${Date.now()}` }]);
  }, []);

  const updateCard = useCallback((card: CreditCard) => {
    setCards(prev => prev.map(c => c.id === card.id ? card : c));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setExpenses(prev => prev.filter(e => e.cardId !== id));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
  }, []);

  const deleteExpense = useCallback((id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const getCardExpenses = useCallback((cardId: string) => {
    return expenses.filter(e => e.cardId === cardId);
  }, [expenses]);

  const getCardProjected = useCallback((cardId: string) => {
    return expenses
      .filter(e => e.cardId === cardId && e.current < e.installments)
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
      cards, expenses, alertThreshold, setAlertThreshold,
      addCard, updateCard, deleteCard, addExpense, deleteExpense,
      getCardExpenses, getCardProjected, nextMonthTotal, totalBudget,
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
