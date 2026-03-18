export interface CreditCard {
  id: string;
  bank: string;
  name: string;
  gradient: string;
  budget: number;
  lastDigits: string;
}

export interface Expense {
  id: number;
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
  'Tecnología', 'Alimentos', 'Viajes', 'Salud', 'Ropa', 'Hogar', 'Servicios', 'Entretenimiento', 'Educación', 'Transporte'
] as const;

export const INITIAL_CARDS: CreditCard[] = [
  { id: 'c1', bank: 'Galicia', name: 'Visa Signature', gradient: 'from-blue-600 to-indigo-700', budget: 450000, lastDigits: '4492' },
  { id: 'c2', bank: 'Santander', name: 'American Express', gradient: 'from-red-600 to-rose-700', budget: 300000, lastDigits: '1005' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 1, cardId: 'c1', desc: 'iPhone 15 Pro', total: 1200000, installments: 12, current: 4, date: '2023-11-10', category: 'Tecnología' },
  { id: 2, cardId: 'c1', desc: 'Supermercado Coto', total: 45000, installments: 3, current: 2, date: '2024-02-15', category: 'Alimentos' },
  { id: 3, cardId: 'c2', desc: 'Vuelo Madrid', total: 850000, installments: 6, current: 5, date: '2023-10-01', category: 'Viajes' },
  { id: 4, cardId: 'c2', desc: 'Suscripción Gym', total: 15000, installments: 1, current: 1, date: '2024-03-01', category: 'Salud' },
  { id: 5, cardId: 'c1', desc: 'Zapatillas Nike', total: 90000, installments: 3, current: 1, date: '2024-03-05', category: 'Ropa' },
  { id: 6, cardId: 'c2', desc: 'Cafetera Nespresso', total: 120000, installments: 6, current: 3, date: '2023-12-20', category: 'Hogar' },
  { id: 7, cardId: 'c1', desc: 'Seguro Auto', total: 40000, installments: 1, current: 1, date: '2024-03-02', category: 'Servicios' },
  { id: 8, cardId: 'c2', desc: 'Restaurante Italpast', total: 35000, installments: 1, current: 1, date: '2024-03-08', category: 'Entretenimiento' },
];

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
