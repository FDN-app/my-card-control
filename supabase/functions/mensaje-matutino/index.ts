import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const jsonHeaders = { 'Content-Type': 'application/json' };

type MetaDiaria = {
  uber_horas_objetivo: number | null;
  uber_facturacion_minima: number | null;
  gym_horas: number | null;
  gym_tipo: string | null;
  estudio_horas: number | null;
  estudio_tema: string | null;
  dieta_calorias_objetivo: number | null;
  apps_horas: number | null;
};

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function formatearMonto(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

function armarMensaje(meta: MetaDiaria | null): string {
  const lineas = ['🌅 Buen día. Este es tu plan para hoy:'];

  if (!meta) {
    return `${lineas[0]}\n\nNo hay objetivos configurados para este día.`;
  }

  if (meta.uber_horas_objetivo || meta.uber_facturacion_minima) {
    const partes = [
      meta.uber_horas_objetivo ? `${meta.uber_horas_objetivo} h` : null,
      meta.uber_facturacion_minima ? `meta ${formatearMonto(meta.uber_facturacion_minima)}` : null,
    ].filter(Boolean);
    lineas.push(`🚗 Uber: ${partes.join(' · ')}`);
  }

  if (meta.gym_horas || meta.gym_tipo) {
    const partes = [
      meta.gym_tipo,
      meta.gym_horas ? `${meta.gym_horas} h` : null,
    ].filter(Boolean);
    lineas.push(`🏋 Gym: ${partes.join(' · ')}`);
  }

  if (meta.estudio_horas || meta.estudio_tema) {
    const partes = [
      meta.estudio_tema,
      meta.estudio_horas ? `${meta.estudio_horas} h` : null,
    ].filter(Boolean);
    lineas.push(`📚 Estudio: ${partes.join(' · ')}`);
  }

  if (meta.dieta_calorias_objetivo) {
    lineas.push(`🥗 Dieta: ${meta.dieta_calorias_objetivo} kcal`);
  }

  if (meta.apps_horas) {
    lineas.push(`💻 Apps: ${meta.apps_horas} h`);
  }

  if (lineas.length === 1) {
    lineas.push('Hoy no tenés objetivos cargados en el plan semanal.');
  }

  lineas.push('', 'Un paso a la vez. 💪');
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
        const { error: rpcError } = await supabase.rpc('generar_meta_del_dia', {
          p_user_id: config.user_id,
        });
        if (rpcError) throw rpcError;

        const { data: meta, error: metaError } = await supabase
          .from('metas_diarias')
          .select([
            'uber_horas_objetivo',
            'uber_facturacion_minima',
            'gym_horas',
            'gym_tipo',
            'estudio_horas',
            'estudio_tema',
            'dieta_calorias_objetivo',
            'apps_horas',
          ].join(','))
          .eq('user_id', config.user_id)
          .eq('fecha', fecha)
          .maybeSingle();

        if (metaError) throw metaError;
        const mensaje = armarMensaje(meta as MetaDiaria | null);

        if (!dry_run) {
          await enviarTelegram(telegramToken!, String(config.telegram_chat_id), mensaje);
        }

        resultados.push({ user_id: config.user_id, ok: true, dry_run, mensaje });
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
