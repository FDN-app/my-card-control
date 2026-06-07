import { useNavigate } from 'react-router-dom';
import { TrendingDown, CreditCard, FileText, Globe, Bell, ArrowRight, Check, Zap, Shield, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: CreditCard,
    title: 'Múltiples Tarjetas',
    desc: 'Gestioná todas tus tarjetas de crédito, débito y medios de pago desde un solo lugar.',
  },
  {
    icon: FileText,
    title: 'Reportes PDF',
    desc: 'Exportá reportes completos del mes con un solo click. Historial siempre a mano.',
  },
  {
    icon: Globe,
    title: 'Multi-moneda',
    desc: 'Visualizá tus gastos en ARS, USD o EUR. Tasas de cambio configurables.',
  },
  {
    icon: Bell,
    title: 'Alertas Inteligentes',
    desc: 'Notificaciones cuando te acercás al límite de presupuesto o vencen suscripciones.',
  },
];

const PRICING = [
  {
    name: 'Gratuito',
    price: '$0',
    period: 'para siempre',
    features: ['3 medios de pago', 'Hasta 20 gastos', 'Dashboard básico', 'Exportar PDF'],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$2.999',
    period: '/ mes',
    features: ['Medios de pago ilimitados', 'Gastos ilimitados', 'IA financiera', 'Multi-moneda', 'Push notifications', 'Soporte prioritario'],
    cta: 'Probar Pro',
    highlight: true,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(215_60%_3%)] text-[hsl(180_15%_94%)] overflow-x-hidden">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, hsl(153 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full opacity-6"
          style={{ background: 'radial-gradient(circle, hsl(285 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(192 100% 50%), transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10">
        {/* ── NAVBAR ──────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(153 100% 50% / 0.12)', border: '1px solid hsl(153 100% 50% / 0.4)', boxShadow: '0 0 12px hsl(153 100% 50% / 0.3)' }}>
              <TrendingDown size={18} style={{ color: 'hsl(153 100% 50%)' }} />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, hsl(153 100% 60%), hsl(192 100% 60%))' }}>
              CuotaCtrl
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-white transition-colors px-4 py-2">
              Iniciar sesión
            </button>
            <button onClick={() => navigate('/login')}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              style={{ background: 'hsl(153 100% 50%)', color: 'hsl(153 100% 5%)', boxShadow: '0 0 16px hsl(153 100% 50% / 0.4)' }}>
              Empezar gratis
            </button>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────── */}
        <section className="px-6 md:px-16 py-24 md:py-36 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
            style={{ background: 'hsl(153 100% 50% / 0.1)', border: '1px solid hsl(153 100% 50% / 0.3)', color: 'hsl(153 100% 60%)' }}>
            <Zap size={12} /> Nuevo · Versión 2.0 con IA financiera
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Controlá tus{' '}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, hsl(153 100% 60%), hsl(192 100% 60%), hsl(153 100% 60%))', backgroundSize: '200% auto', animation: 'textShine 4s linear infinite' }}>
              gastos y cuotas
            </span>{' '}
            en tiempo real
          </h1>

          <p className="text-xl text-[hsl(215_20%_60%)] max-w-2xl mx-auto mb-12 leading-relaxed">
            La app financiera que te muestra exactamente dónde va tu plata, cuánto debés en cuotas
            y cuándo vencen tus suscripciones. Sin hojas de cálculo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105"
              style={{ background: 'hsl(153 100% 50%)', color: 'hsl(153 100% 5%)', boxShadow: '0 0 30px hsl(153 100% 50% / 0.5)' }}>
              Empezar gratis <ArrowRight size={20} />
            </button>
            <button
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-[hsl(180_15%_70%)] border border-white/10 hover:border-white/20 hover:text-white transition-all">
              Ver demo
            </button>
          </div>
        </section>

        {/* ── MOCKUP / SCREENSHOT ─────────────────────────────── */}
        <section className="px-6 md:px-16 py-8 max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden border border-white/8"
            style={{ background: 'hsl(215 55% 6%)', boxShadow: '0 40px 100px hsl(0 0% 0% / 0.6), 0 0 0 1px hsl(153 100% 50% / 0.08)' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-xs text-[hsl(215_20%_40%)] ml-2">cuotactrl.app</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {/* Mini dashboard mockup */}
              {[
                { label: 'Saldo Neto', value: '+$142.500', color: 'hsl(153 100% 50%)' },
                { label: 'Gastos del Mes', value: '$87.300', color: 'hsl(350 85% 60%)' },
                { label: 'Cuotas Activas', value: '$54.000', color: 'hsl(45 90% 55%)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl p-5 border border-white/5"
                  style={{ background: 'hsl(215 55% 8%)' }}>
                  <p className="text-xs text-[hsl(215_20%_50%)] uppercase tracking-widest mb-2">{label}</p>
                  <p className="text-2xl font-black" style={{ color }}>{value}</p>
                  <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: color, opacity: 0.4 }} />
                  </div>
                </div>
              ))}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Netflix · $6.900', 'Spotify · $3.400', 'Gym · $12.000', 'iPhone 12 · 8/12'].map(s => (
                  <div key={s} className="rounded-xl p-3 border border-white/5 flex items-center gap-2"
                    style={{ background: 'hsl(215 55% 7%)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'hsl(153 100% 50% / 0.1)', border: '1px solid hsl(153 100% 50% / 0.2)' }}>
                      <span className="text-sm font-bold" style={{ color: 'hsl(153 100% 50%)' }}>{s[0]}</span>
                    </div>
                    <span className="text-xs text-[hsl(180_15%_70%)] font-medium truncate">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────── */}
        <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[hsl(153_100%_50%)] uppercase tracking-widest font-bold mb-3">Funcionalidades</p>
            <h2 className="text-4xl md:text-5xl font-black">Todo lo que necesitás</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02]"
                style={{ background: 'hsl(215 55% 6%)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'hsl(153 100% 50% / 0.1)', border: '1px solid hsl(153 100% 50% / 0.3)' }}>
                  <Icon size={22} style={{ color: 'hsl(153 100% 50%)' }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-[hsl(215_20%_55%)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────── */}
        <section className="px-6 md:px-16 py-16 border-y border-white/5">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2.400+', label: 'Gastos registrados' },
              { value: '$0', label: 'Costo de entrada' },
              { value: '100%', label: 'Open source' },
              { value: '< 2s', label: 'Carga promedio' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-black mb-1 bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, hsl(153 100% 60%), hsl(192 100% 60%))' }}>
                  {value}
                </p>
                <p className="text-sm text-[hsl(215_20%_50%)]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────── */}
        <section className="px-6 md:px-16 py-24 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[hsl(153_100%_50%)] uppercase tracking-widest font-bold mb-3">Precios</p>
            <h2 className="text-4xl md:text-5xl font-black">Simple y transparente</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PRICING.map(({ name, price, period, features, cta, highlight }) => (
              <div key={name}
                className="rounded-3xl p-8 border transition-all"
                style={{
                  background: highlight ? 'hsl(215 55% 7%)' : 'hsl(215 55% 5%)',
                  border: highlight ? '1px solid hsl(153 100% 50% / 0.4)' : '1px solid hsl(215 45% 14%)',
                  boxShadow: highlight ? '0 0 40px hsl(153 100% 50% / 0.1)' : undefined,
                }}>
                {highlight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
                    style={{ background: 'hsl(153 100% 50% / 0.15)', color: 'hsl(153 100% 60%)', border: '1px solid hsl(153 100% 50% / 0.3)' }}>
                    <Shield size={11} /> Más popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-black" style={{ color: highlight ? 'hsl(153 100% 60%)' : undefined }}>{price}</span>
                  <span className="text-[hsl(215_20%_50%)] mb-1">{period}</span>
                </div>
                <div className="space-y-3 mb-8">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <Check size={16} style={{ color: 'hsl(153 100% 50%)' }} />
                      <span className="text-sm text-[hsl(180_15%_75%)]">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-xl font-bold transition-all"
                  style={highlight
                    ? { background: 'hsl(153 100% 50%)', color: 'hsl(153 100% 5%)', boxShadow: '0 0 20px hsl(153 100% 50% / 0.4)' }
                    : { background: 'hsl(215 45% 12%)', color: 'hsl(180 15% 85%)', border: '1px solid hsl(215 45% 20%)' }
                  }>
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────── */}
        <section className="px-6 md:px-16 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <BarChart3 size={48} className="mx-auto mb-6" style={{ color: 'hsl(153 100% 50%)', filter: 'drop-shadow(0 0 12px hsl(153 100% 50% / 0.6))' }} />
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Empezá a controlar tus finanzas hoy
            </h2>
            <p className="text-lg text-[hsl(215_20%_55%)] mb-10">
              Gratis, sin tarjeta de crédito. Configurá tu primera tarjeta en menos de 2 minutos.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-xl font-black transition-all hover:scale-105"
              style={{ background: 'hsl(153 100% 50%)', color: 'hsl(153 100% 5%)', boxShadow: '0 0 40px hsl(153 100% 50% / 0.5)' }}>
              Crear cuenta gratis <ArrowRight size={22} />
            </button>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer className="border-t border-white/5 px-6 md:px-16 py-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} style={{ color: 'hsl(153 100% 50%)' }} />
              <span className="font-bold text-sm">CuotaCtrl</span>
            </div>
            <div className="flex gap-6 text-sm text-[hsl(215_20%_45%)]">
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Iniciar sesión</button>
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Registrarse</button>
            </div>
            <p className="text-xs text-[hsl(215_20%_35%)]">© {new Date().getFullYear()} CuotaCtrl. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
