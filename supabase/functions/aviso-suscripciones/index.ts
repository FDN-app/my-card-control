import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Aviso diario por Telegram de suscripciones activas que vencen pronto (reemplaza el workflow de n8n).

const jsonHeaders = { 'Content-Type': 'application/json' };
const DIAS_ALERTA_DEFAULT = 3;

type Suscripcion = {
  nombre: string;
  monto: number;
  fecha_proximo_cobro: string;
  dias_alerta: number | null;
};

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

// Días entre dos fechas 'YYYY-MM-DD' (sin horas, para que no influya la zona horaria)
function diasEntre(desde: string, hasta: string): number {
  const a = Date.parse(`${desde.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${hasta.slice(0, 10)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function formatearMonto(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

function cuando(dias: number, fecha: string): string {
  const [, mes, dia] = fecha.slice(0, 10).split('-');
  if (dias === 0) return `vence HOY (${dia}/${mes})`;
  if (dias === 1) return `vence mañana (${dia}/${mes})`;
  return `vence en ${dias} días (${dia}/${mes})`;
}

function armarMensaje(items: { sub: Suscripcion; dias: number }[]): string {
  const total = items.reduce((acc, { sub }) => acc + Number(sub.monto), 0);
  const lineas = ['🔔 Suscripciones por vencer:', ''];
  for (const { sub, dias } of items) {
    lineas.push(`• ${sub.nombre} — ${formatearMonto(Number(sub.monto))} — ${cuando(dias, sub.fecha_proximo_cobro)}`);
  }
  lineas.push('', `Total: ${formatearMonto(total)}`);
  return lineas.join('\n');
}

async function enviarTelegram(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.description ?? 'Telegram rechazó el mensaje');
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const { dry_run = false } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: secretValido, error: secretError } = await supabase.rpc(
      'validar_cron_secret',
      { p_secret: req.headers.get('x-cron-secret') ?? '' },
    );

    if (secretError || secretValido !== true) {
      return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!telegramToken && !dry_run) {
      throw new Error('Falta configurar TELEGRAM_BOT_TOKEN');
    }

    const { data: configuraciones, error: configError } = await supabase
      .from('configuracion_usuario')
      .select('user_id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null);

    if (configError) throw configError;

    const fecha = hoyArgentina();
    const resultados = [];

    for (const config of configuraciones ?? []) {
      try {
        const { data: subs, error: subsError } = await supabase
          .from('suscripciones')
          .select('nombre, monto, fecha_proximo_cobro, dias_alerta')
          .eq('user_id', config.user_id)
          .eq('estado', 'Activa')
          .not('fecha_proximo_cobro', 'is', null);

        if (subsError) throw subsError;

        const porVencer = ((subs ?? []) as Suscripcion[])
          .map(sub => ({ sub, dias: diasEntre(fecha, sub.fecha_proximo_cobro) }))
          .filter(({ sub, dias }) => dias >= 0 && dias <= (sub.dias_alerta ?? DIAS_ALERTA_DEFAULT))
          .sort((a, b) => a.dias - b.dias);

        // Sin suscripciones por vencer no se manda nada
        if (porVencer.length === 0) {
          resultados.push({ user_id: config.user_id, ok: true, enviado: false });
          continue;
        }

        const mensaje = armarMensaje(porVencer);

        if (!dry_run) {
          await enviarTelegram(telegramToken!, String(config.telegram_chat_id), mensaje);
        }

        resultados.push({ user_id: config.user_id, ok: true, enviado: !dry_run, dry_run, mensaje });
      } catch (error) {
        resultados.push({ user_id: config.user_id, ok: false, error: String(error) });
      }
    }

    const errores = resultados.filter((resultado) => !resultado.ok).length;
    return new Response(JSON.stringify({
      ok: errores === 0,
      fecha,
      procesados: resultados.length,
      errores,
      resultados,
    }), { status: errores === 0 ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
