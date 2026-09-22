import { Check, ChefHat, Info, Scale, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { useAlimentacion } from '@/hooks/useAlimentacion';
import { GUIA_PESAJE, MENUS_ALIMENTACION, VARIANTES_MERIENDA } from '@/lib/planAlimentacion';

export default function Alimentacion() {
  const { fecha, registro, isLoading, isSaving, guardar } = useAlimentacion();
  const menuId = registro?.menu ?? 1;
  const completadas = registro?.comidas_completadas ?? [];
  const menu = MENUS_ALIMENTACION.find(item => item.id === menuId) ?? MENUS_ALIMENTACION[0];
  const progreso = completadas.length * 20;

  const cambiarMenu = async (nuevoMenu: 1 | 2 | 3) => {
    try {
      await guardar({ menu: nuevoMenu, comidas: completadas });
      toast.success('Menú del día actualizado');
    } catch {
      toast.error('No se pudo guardar el menú');
    }
  };

  const toggleComida = async (numero: number) => {
    const nuevas = completadas.includes(numero)
      ? completadas.filter(item => item !== numero)
      : [...completadas, numero];

    try {
      const resultado = await guardar({ menu: menuId, comidas: nuevas });
      if (resultado.dietaCompleta) {
        toast.success('¡Día completado! Dieta marcada en tus metas.');
      }
    } catch {
      toast.error('No se pudo actualizar la comida');
    }
  };

  const fechaLabel = new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isLoading) {
    return <div className="max-w-4xl mx-auto text-muted-foreground">Cargando tu plan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[hsl(153_100%_50%/0.1)] border border-[hsl(153_100%_50%/0.3)]">
            <UtensilsCrossed className="text-[hsl(153_100%_50%)]" size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Alimentación</h1>
            <p className="text-sm text-muted-foreground capitalize">{fechaLabel} · objetivo 1.800 kcal</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Elegí un menú y marcá cada comida. Al completar las cinco, se actualiza Dieta en Metas Diarias.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-3" aria-label="Elegir menú del día">
        {MENUS_ALIMENTACION.map(item => {
          const activo = item.id === menuId;
          return (
            <button
              key={item.id}
              type="button"
              disabled={isSaving}
              onClick={() => cambiarMenu(item.id)}
              aria-pressed={activo}
              className={`text-left rounded-2xl border p-4 transition-all disabled:opacity-60 ${activo
                ? 'border-[hsl(153_100%_50%/0.55)] bg-[hsl(153_100%_50%/0.09)]'
                : 'border-border/40 bg-card/60 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Menú {item.id}</span>
                {activo ? <Check size={16} className="text-[hsl(153_100%_50%)]" /> : null}
              </div>
              <p className="font-semibold text-sm mt-1">{item.nombre}</p>
              <p className="text-xs text-muted-foreground mt-2">{item.descripcion}</p>
            </button>
          );
        })}
      </section>

      <section className="surface-elevated rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Menú {menu.id}</p>
            <h2 className="text-xl font-black">{menu.nombre}</h2>
            <p className="text-xs text-muted-foreground mt-1">{menu.total}</p>
          </div>
          <span className="text-sm font-bold text-[hsl(153_100%_50%)]">{completadas.length}/5 comidas</span>
        </div>

        <div className="h-2 rounded-full bg-secondary overflow-hidden" aria-label={`${progreso}% completado`}>
          <div
            className="h-full rounded-full transition-all duration-500 bg-[hsl(153_100%_50%)]"
            style={{ width: `${progreso}%`, boxShadow: '0 0 12px hsl(153 100% 50% / 0.55)' }}
          />
        </div>

        <div className="space-y-3">
          {menu.comidas.map((comida, index) => {
            const numero = index + 1;
            const completa = completadas.includes(numero);
            return (
              <button
                key={comida.nombre}
                type="button"
                disabled={isSaving}
                onClick={() => toggleComida(numero)}
                className={`w-full flex items-start gap-4 text-left rounded-xl border p-4 transition-all disabled:opacity-60 ${completa
                  ? 'border-[hsl(153_100%_50%/0.4)] bg-[hsl(153_100%_50%/0.07)]'
                  : 'border-border/40 bg-secondary/20 hover:bg-secondary/35'
                }`}
              >
                <span className={`mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${completa
                  ? 'bg-[hsl(153_100%_50%)] border-[hsl(153_100%_50%)] text-[hsl(153_100%_5%)]'
                  : 'border-border text-muted-foreground'
                }`}>
                  {completa ? <Check size={16} strokeWidth={3} /> : numero}
                </span>
                <span>
                  <span className={`block font-bold ${completa ? 'text-[hsl(153_100%_60%)]' : 'text-foreground'}`}>{comida.nombre}</span>
                  <span className="block text-sm text-muted-foreground mt-1 leading-relaxed">{comida.alimentos}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="surface-elevated rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat size={18} className="text-[hsl(192_100%_50%)]" />
            <h2 className="font-bold">Preparar todo de una vez</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {menu.preparacion.map(item => <li key={item} className="flex gap-2"><span className="text-[hsl(192_100%_50%)]">•</span>{item}</li>)}
          </ul>
          <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">
            Brócoli: 150 g + 200 g + 200 g. Arroz: 150 g al almuerzo y 100 g a la cena.
          </p>
        </article>

        <article className="surface-elevated rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[hsl(192_100%_50%)]" />
            <h2 className="font-bold">Guía rápida de pesaje</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {GUIA_PESAJE.map(item => <li key={item} className="flex gap-2"><span className="text-[hsl(192_100%_50%)]">•</span>{item}</li>)}
          </ul>
        </article>
      </section>

      <details className="surface-elevated rounded-2xl p-5 group">
        <summary className="font-bold cursor-pointer">Variantes para la merienda</summary>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {VARIANTES_MERIENDA.map(item => <li key={item} className="flex gap-2"><span className="text-[hsl(153_100%_50%)]">•</span>{item}</li>)}
        </ul>
      </details>

      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/20 p-4 text-xs text-muted-foreground">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>Esta sección organiza tu plan personal. No reemplaza una indicación médica o nutricional individual.</p>
      </div>
    </div>
  );
}
