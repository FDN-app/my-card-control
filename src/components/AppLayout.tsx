import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, PlusCircle, FileUp,
  Settings, TrendingDown, Bell, LogOut, Wallet, Target, Car, CalendarCheck,
  CalendarDays, Trophy,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/* ── Nav definitions ─────────────────────────────────────── */

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/' },
  { icon: CreditCard,      label: 'Medios de Pago', path: '/tarjetas' },
  { icon: Wallet,          label: 'Mis Finanzas',   path: '/finanzas' },
  { icon: PlusCircle,      label: 'Nuevo Gasto',    path: '/gastos/nuevo' },
  { icon: FileUp,          label: 'Importar',       path: '/gastos/importar' },
  { icon: Bell,            label: 'Suscripciones',  path: '/suscripciones' },
  { icon: Target,          label: 'Metas de Ahorro', path: '/metas' },
  { icon: Car,             label: 'Conductor',        path: '/conductor' },
  { icon: CalendarCheck,  label: 'Metas Diarias',    path: '/metas-diarias' },
  { icon: CalendarDays,   label: 'Plan Semanal',     path: '/plan-semanal' },
  { icon: Trophy,         label: 'Objetivos',        path: '/objetivos' },
];

// 5 items for mobile — center item is the CTA
const BOTTOM_ITEMS = [
  { icon: LayoutDashboard, label: 'Inicio',    path: '/',              center: false },
  { icon: CreditCard,      label: 'Pagos',     path: '/tarjetas',      center: false },
  { icon: PlusCircle,      label: 'Nuevo',     path: '/gastos/nuevo',  center: true  },
  { icon: Wallet,          label: 'Finanzas',  path: '/finanzas',       center: false },
  { icon: CalendarCheck,  label: 'Metas',     path: '/metas-diarias',  center: false },
];

/* ── Sidebar item ────────────────────────────────────────── */

function SidebarItem({
  icon: Icon, label, active, onClick,
}: { icon: typeof LayoutDashboard; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
        interactive-press relative overflow-hidden group
        ${active
          ? 'text-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green)/0.08)] border border-[hsl(var(--neon-green)/0.25)]'
          : 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-[hsl(var(--neon-green)/0.04)]'
        }
      `}
      style={active ? {
        boxShadow: '0 0 12px hsl(153 100% 50% / 0.15), inset 0 0 8px hsl(153 100% 50% / 0.05)',
      } : undefined}
    >
      {/* Active left accent bar */}
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: 'hsl(var(--neon-green))', boxShadow: '0 0 8px hsl(153 100% 50%)' }}
        />
      )}
      <Icon
        size={18}
        strokeWidth={active ? 2.5 : 2}
        className={active ? 'text-[hsl(var(--neon-green))]' : ''}
        style={active ? { filter: 'drop-shadow(0 0 4px hsl(153 100% 50% / 0.7))' } : undefined}
      />
      <span className="font-medium text-sm">{label}</span>
      {/* Hover shimmer */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(153 100% 50% / 0.03), transparent)' }} />
    </button>
  );
}

/* ── Bottom nav item ─────────────────────────────────────── */

function BottomItem({
  icon: Icon, label, active, center, onClick,
}: { icon: typeof LayoutDashboard; label: string; active: boolean; center: boolean; onClick: () => void }) {
  if (center) {
    return (
      <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center -mt-5 interactive-press"
        aria-label={label}
      >
        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: active
              ? 'hsl(153 100% 50%)'
              : 'linear-gradient(135deg, hsl(153 100% 25%), hsl(192 100% 25%))',
            boxShadow: active
              ? '0 0 20px hsl(153 100% 50% / 0.7), 0 0 40px hsl(153 100% 50% / 0.3)'
              : '0 0 15px hsl(153 100% 50% / 0.4), 0 4px 16px hsl(0 0% 0% / 0.5)',
          }}
        >
          <Icon
            size={24}
            strokeWidth={2.5}
            style={{ color: active ? 'hsl(153 100% 5%)' : 'hsl(153 100% 70%)' }}
          />
        </span>
        <span className="text-[10px] font-bold mt-1"
          style={{ color: active ? 'hsl(153 100% 50%)' : 'hsl(215 20% 55%)' }}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-2 py-1 interactive-press group"
      aria-label={label}
    >
      {/* Active indicator dot */}
      {active && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: 'hsl(var(--neon-green))', boxShadow: '0 0 6px hsl(153 100% 50%)' }}
        />
      )}
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 2}
        style={{
          color: active ? 'hsl(153 100% 50%)' : 'hsl(215 20% 50%)',
          filter: active ? 'drop-shadow(0 0 4px hsl(153 100% 50% / 0.8))' : undefined,
        }}
      />
      <span
        className="text-[10px] font-medium"
        style={{ color: active ? 'hsl(153 100% 50%)' : 'hsl(215 20% 45%)' }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── AppLayout ───────────────────────────────────────────── */

export default function AppLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background bg-cyber-grid">

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(153 100% 50%), transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, hsl(192 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(285 100% 50%), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* ════════════════════════════════════════════════
          SIDEBAR — desktop only (md+)
          ════════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-20"
        style={{
          background: 'hsl(215 60% 3% / 0.9)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid hsl(153 100% 50% / 0.1)',
          boxShadow: '4px 0 24px hsl(0 0% 0% / 0.4), inset -1px 0 0 hsl(153 100% 50% / 0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'hsl(153 100% 50% / 0.1)',
              border: '1px solid hsl(153 100% 50% / 0.4)',
              boxShadow: '0 0 12px hsl(153 100% 50% / 0.3)',
            }}
          >
            <TrendingDown size={18} style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 4px hsl(153 100% 50%))' }} />
          </div>
          <h1
            className="text-xl font-black tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, hsl(153 100% 60%), hsl(192 100% 60%), hsl(153 100% 60%))',
              backgroundSize: '200% auto',
              animation: 'textShine 4s linear infinite',
            }}
          >
            CuotaCtrl
          </h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          {SIDEBAR_ITEMS.map(item => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-6 space-y-1"
          style={{ borderTop: '1px solid hsl(215 45% 12%)' }}>
          <div className="pt-4">
            <SidebarItem
              icon={Settings}
              label="Configuración"
              active={isActive('/configuracion')}
              onClick={() => navigate('/configuracion')}
            />
          </div>

          {/* User info */}
          <div className="px-3 py-3 rounded-xl mt-2"
            style={{
              background: 'hsl(215 55% 7%)',
              border: '1px solid hsl(215 45% 12%)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                style={{
                  background: 'hsl(153 100% 50% / 0.1)',
                  border: '1px solid hsl(153 100% 50% / 0.3)',
                  color: 'hsl(153 100% 50%)',
                }}
              >
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate" title={user?.email ?? ''}>
                  {user?.email ?? 'Usuario'}
                </p>
                <p className="text-[10px] font-mono text-[hsl(153_100%_40%)] uppercase tracking-wider">
                  Plan Pro
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut size={13} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════════════ */}
      <main className="flex-1 md:ml-60 relative z-10
        p-4 md:p-10
        pb-[calc(5rem+env(safe-area-inset-bottom))]
        md:pb-10"
      >
        <Outlet />
      </main>

      {/* ════════════════════════════════════════════════
          BOTTOM NAV — mobile only (< md)
          ════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2"
        style={{
          background: 'hsl(215 60% 3% / 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid hsl(153 100% 50% / 0.12)',
          boxShadow: '0 -4px 24px hsl(0 0% 0% / 0.5), 0 -1px 0 hsl(153 100% 50% / 0.08)',
          paddingTop: '0.5rem',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        {BOTTOM_ITEMS.map(item => (
          <BottomItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
            center={item.center}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>
    </div>
  );
}
