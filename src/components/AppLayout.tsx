import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, PlusCircle, FileUp, Settings, TrendingDown, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CreditCard, label: 'Mis Tarjetas', path: '/tarjetas' },
  { icon: PlusCircle, label: 'Nuevo Gasto', path: '/gastos/nuevo' },
  { icon: FileUp, label: 'Importar', path: '/gastos/importar' },
  { icon: Bell, label: 'Suscripciones', path: '/suscripciones' },
];

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: typeof LayoutDashboard; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 interactive-press ${
        active
          ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 hidden md:flex flex-col p-6 fixed h-full glass-panel z-20">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center neon-border group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-shadow duration-300">
            <TrendingDown size={20} className="text-primary-foreground stroke-[2.5px]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[textShine_4s_linear_infinite] [background-size:200%_auto]">CuotaCtrl</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {NAV_ITEMS.map(item => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <SidebarItem
            icon={Settings}
            label="Configuración"
            active={isActive('/configuracion')}
            onClick={() => navigate('/configuracion')}
          />
          <div className="mt-6 flex flex-col gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-foreground">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate" title={user?.email || 'Usuario'}>{user?.email || 'Usuario'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan Pro</p>
              </div>
            </div>
            
            <button 
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors mt-2"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel rounded-2xl px-6 py-3 flex justify-between items-center z-30 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`p-2 ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <item.icon size={22} />
          </button>
        ))}
        <button
          onClick={() => navigate('/configuracion')}
          className={`p-2 ${isActive('/configuracion') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Settings size={22} />
        </button>
        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="p-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut size={22} />
        </button>
      </nav>
    </div>
  );
}
