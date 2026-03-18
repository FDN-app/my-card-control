import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, PlusCircle, FileUp, Settings, TrendingDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CreditCard, label: 'Mis Tarjetas', path: '/tarjetas' },
  { icon: PlusCircle, label: 'Nuevo Gasto', path: '/gastos/nuevo' },
  { icon: FileUp, label: 'Importar', path: '/gastos/importar' },
];

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: typeof LayoutDashboard; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 interactive-press ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 fixed h-full bg-background z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingDown size={18} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">CuotaCtrl</h1>
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
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Tomas Cook</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border px-6 py-3 flex justify-between items-center z-30">
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
      </nav>
    </div>
  );
}
