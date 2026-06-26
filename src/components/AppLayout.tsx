import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, PlusCircle, FileUp,
  Settings, TrendingDown, Bell, LogOut, Wallet, Target, Car, CalendarCheck,
  CalendarDays, Trophy, MoreHorizontal, X,
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
  { icon: Wallet,          label: 'Finanzas',  path: '/finanzas',      center: false },
  { icon: CalendarCheck,  label: 'Metas',     path: '/metas-diarias', center: false },
];

// Items accessible via the "Más" drawer (not in BOTTOM_ITEMS)
const MORE_ITEMS = [
  { icon: CalendarDays, label: 'Plan Semanal',    path: '/plan-semanal' },
  { icon: Trophy,       label: 'Objetivos',       path: '/objetivos' },
  { icon: Car,          label: 'Conductor',       path: '/conductor' },
  { icon: Target,       label: 'Metas de Ahorro', path: '/metas' },
  { icon: Bell,         label: 'Suscripciones',   path: '/suscripciones' },
  { icon: FileUp,       label: 'Importar',        path: '/gastos/importar' },
  { icon: Settings,     label: 'Configuración',   path: '/configuracion' },
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

/* ── More drawer (bottom sheet) ──────────────────────────── */

function MoreSheet({
  open, onClose, currentPath, onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const isActive = (path: string) =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        style={{ background: 'hsl(0 0% 0% / 0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl
          transition-transform duration-300 ease-out
          ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          background: 'hsl(215 60% 4% / 0.98)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid hsl(153 100% 50% / 0.2)',
          boxShadow: '0 -8px 40px hsl(0 0% 0% / 0.6), 0 -1px 0 hsl(153 100% 50% / 0.15)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(215 20% 30%)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'hsl(215 20% 45%)' }}>
            Más secciones
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(215 20% 50%)' }}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2.5 px-4 pt-1 pb-2">
          {MORE_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => onNavigate(path)}
                className="flex flex-col items-center gap-2.5 p-3.5 rounded-xl transition-all active:scale-95"
                style={{
                  background: active ? 'hsl(153 100% 50% / 0.1)' : 'hsl(215 55% 7%)',
                  border: `1px solid ${active ? 'hsl(153 100% 50% / 0.35)' : 'hsl(215 45% 12%)'}`,
                  boxShadow: active ? '0 0 12px hsl(153 100% 50% / 0.12)' : undefined,
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  style={{
                    color: active ? 'hsl(153 100% 50%)' : 'hsl(215 20% 60%)',
                    filter: active ? 'drop-shadow(0 0 5px hsl(153 100% 50% / 0.8))' : undefined,
                  }}
                />
                <span
                  className="text-[11px] font-medium text-center leading-tight"
                  style={{ color: active ? 'hsl(153 100% 50%)' : 'hsl(215 20% 55%)' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── AppLayout ───────────────────────────────────────────── */

export default function AppLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();
  const [showMore, setShowMore] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const moreIsActive = MORE_ITEMS.some(i => isActive(i.path));

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

        {/* Más button */}
        <BottomItem
          icon={MoreHorizontal}
          label="Más"
          active={showMore || moreIsActive}
          center={false}
          onClick={() => setShowMore(prev => !prev)}
        />
      </nav>

      {/* ════════════════════════════════════════════════
          MORE SHEET — mobile drawer
          ════════════════════════════════════════════════ */}
      <MoreSheet
        open={showMore}
        onClose={() => setShowMore(false)}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
}
