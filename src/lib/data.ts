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
  installmentAmount: number;
}

export type AppView = 'dashboard' | 'cards' | 'card-detail' | 'new-expense' | 'import' | 'settings';

export const CATEGORIES = [
  'Tecnología', 'Alimentos', 'Viajes', 'Salud', 'Ropa', 'Hogar', 'Servicios', 'Entretenimiento', 'Educación', 'Transporte', 'Otros'
] as const;

export const INITIAL_CARDS: CreditCard[] = [];
export const INITIAL_EXPENSES: Expense[] = [];

export interface Subscription {
  id: string;
  user_id?: string;
  tarjeta_id: string | null;
  nombre: string;
  monto: number;
  periodicidad: 'Mensual' | 'Anual';
  fecha_proximo_cobro: string;
  estado: 'Activa' | 'Cancelada';
  notas?: string | null;
  created_at?: string;
}

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
