import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, PlusCircle, Wallet, Bell, Target, Car } from 'lucide-react';

/* ── Grupos de pantallas ─────────────────────────────────────
   Cada grupo es un ítem del menú; sus pantallas se ven como pestañas.
   `match` incluye rutas extra que pertenecen a la pestaña (detalle, editar, importar). */

export const SECTIONS = {
  finanzas: [
    { icon: Wallet,     label: 'Mis Finanzas',   short: 'Finanzas', path: '/finanzas' },
    { icon: PlusCircle, label: 'Nuevo Gasto',    short: 'Nuevo',    path: '/gastos/nuevo', match: ['/gastos'] },
    { icon: CreditCard, label: 'Medios de Pago', short: 'Pagos',    path: '/tarjetas' },
    { icon: Bell,       label: 'Suscripciones',  short: 'Subs',     path: '/suscripciones' },
  ],
  metas: [
    { icon: Target, label: 'Metas de Ahorro', short: 'Metas',     path: '/metas' },
    { icon: Car,    label: 'Conductor',       short: 'Conductor', path: '/conductor' },
  ],
};

export type SectionKey = keyof typeof SECTIONS;

type Tab = (typeof SECTIONS)[SectionKey][number] & { match?: string[] };

export const tabMatches = (tab: Tab, pathname: string) =>
  [tab.path, ...(tab.match ?? [])].some(p => pathname.startsWith(p));

export const sectionMatches = (key: SectionKey, pathname: string) =>
  SECTIONS[key].some(tab => tabMatches(tab, pathname));

export default function SectionLayout({ section }: { section: SectionKey }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs: Tab[] = SECTIONS[section];

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
          {tabs.map(tab => {
            const active = tabMatches(tab, location.pathname);
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-2 md:py-3 text-[11px] md:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {/* En celular va la etiqueta corta para que entren todas sin scroll */}
                <span className="md:hidden truncate">{tab.short}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
