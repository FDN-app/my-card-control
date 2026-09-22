import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const jsonHeaders = { 'Content-Type': 'application/json' };

const campos = [
  { key: 'uber_realizado', emoji: '🚗', label: 'Uber' },
  { key: 'gym_realizado', emoji: '🏋', label: 'Gym' },
  { key: 'estudio_realizado', emoji: '📚', label: 'Estudio' },
  { key: 'dieta_realizado', emoji: '🥗', label: 'Dieta' },
  { key: 'apps_realizado', emoji: '💻', label: 'Apps' },
] as const;

type EstadoMeta = Record<(typeof campos)[number]['key'], boolean>;

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function armarTeclado(meta: Partial<EstadoMeta>) {
  const botones = campos.map(({ key, emoji, label }) => ({
    text: `${emoji} ${label} ${meta[key] ? '✅' : '◻️'}`,
    callback_data: `check:${key}`,
  }));

  return {
    inline_keyboard: [botones.slice(0, 2), botones.slice(2, 4), botones.slice(4)],
  };
}

async function enviarTelegram(
  token: string,
  chatId: string,
  meta: Partial<EstadoMeta>,
) {
  const completados = campos.filter(({ key }) => meta[key]).length;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      chat_id: chatId,
      text: `🌙 Check nocturno\n\n¿Cómo terminaste el día? Marcá lo que completaste.\n\nProgreso actual: ${completados}/${campos.length}`,
      reply_markup: armarTeclado(meta),
    }),
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
        await supabase.rpc('generar_meta_del_dia', { p_user_id: config.user_id });

        const { data: meta, error: metaError } = await supabase
          .from('metas_diarias')
          .select(campos.map(({ key }) => key).join(','))
          .eq('user_id', config.user_id)
          .eq('fecha', fecha)
          .maybeSingle();

        if (metaError) throw metaError;
        const estado = (meta ?? {}) as Partial<EstadoMeta>;

        if (!dry_run) {
          await enviarTelegram(telegramToken!, String(config.telegram_chat_id), estado);
        }

        resultados.push({ user_id: config.user_id, ok: true, dry_run });
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
