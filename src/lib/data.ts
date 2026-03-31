export interface CreditCard {
  id: string;
  bank: string;
  name: string;
  gradient: string;
  budget: number;
  lastDigits?: string;
}

export interface Expense {
  id: string | number;
  cardId: string;
  desc: string;
  total: number;
  installments: number;
  current: number;
  date: string;
  category: string;
}

export type AppView = 'dashboard' | 'cards' | 'card-detail' | 'new-expense' | 'import' | 'settings';

export const CATEGORIES = [
  'Tecnología', 'Alimentos', 'Viajes', 'Salud', 'Ropa', 'Hogar', 'Servicios', 'Entretenimiento', 'Educación', 'Transporte', 'Otros'
] as const;

export const INITIAL_CARDS: CreditCard[] = [
  { id: 'c1', bank: 'Galicia', name: 'Visa Signature', gradient: 'from-blue-600 to-indigo-700', budget: 450000, lastDigits: '4492' },
  { id: 'c2', bank: 'Santander', name: 'American Express', gradient: 'from-red-600 to-rose-700', budget: 300000, lastDigits: '1005' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', cardId: 'c1', desc: 'iPhone 15 Pro', total: 1200000, installments: 12, current: 4, date: '2025-11-10', category: 'Tecnología' },
  { id: 'e2', cardId: 'c1', desc: 'Supermercado Coto', total: 45000, installments: 3, current: 2, date: '2026-02-15', category: 'Alimentos' },
  { id: 'e3', cardId: 'c2', desc: 'Vuelo Madrid', total: 850000, installments: 6, current: 5, date: '2025-10-01', category: 'Viajes' },
  { id: 'e4', cardId: 'c2', desc: 'Suscripción Gym', total: 15000, installments: 1, current: 1, date: '2026-03-01', category: 'Salud' },
];

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cardId: string;
  nextBillingDate: string;
  periodicity: 'Mensual' | 'Anual';
  status: 'Activa' | 'Cancelada';
}

// Today is 2026-03-20. 2-days away = 2026-03-22
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 12000, cardId: 'c1', nextBillingDate: '2026-03-22', periodicity: 'Mensual', status: 'Activa' },
  { id: 's2', name: 'Spotify', amount: 3500, cardId: 'c2', nextBillingDate: '2026-03-28', periodicity: 'Mensual', status: 'Activa' },
  { id: 's3', name: 'ChatGPT Plus', amount: 20000, cardId: 'c1', nextBillingDate: '2026-04-05', periodicity: 'Mensual', status: 'Activa' },
  { id: 's4', name: 'Claude Pro', amount: 20000, cardId: 'c2', nextBillingDate: '2026-04-10', periodicity: 'Mensual', status: 'Activa' },
  { id: 's5', name: 'Disney+', amount: 8000, cardId: 'c1', nextBillingDate: '2026-04-15', periodicity: 'Mensual', status: 'Activa' },
];

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
