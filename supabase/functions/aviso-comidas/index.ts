import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Aviso por Telegram de cada comida del plan (5 por día). El cron manda { comida: 1..5 }.
// Usa el menú elegido hoy en Alimentación; si hoy no hay registro, el último elegido.

const jsonHeaders = { 'Content-Type': 'application/json' };

// Copia de MENUS_ALIMENTACION (src/lib/planAlimentacion.ts): si cambia el plan, actualizar acá también.
const desayuno = '2 huevos enteros + 2 claras, 20 g de Roquefort y 100 g de espinaca.';
const MENUS: Record<number, { nombre: string; comidas: string[] }> = {
  1: {
    nombre: 'Todo pechuga',
    comidas: [
      desayuno,
      '80 g de pechuga, 150 g de brócoli y 50 g de palta.',
      '90 g de pechuga, 150 g de arroz, 200 g de brócoli y 50 g de palta.',
      '1 manzana grande (~180 g), 15 g de nueces, 1 huevo entero + 4 claras.',
      '80 g de pechuga, 100 g de arroz, 200 g de brócoli y 50 g de palta.',
    ],
  },
  2: {
    nombre: 'Todo pata-muslo',
    comidas: [
      desayuno,
      '100 g de pata-muslo, 150 g de brócoli y 30 g de palta.',
      '100 g de pata-muslo, 150 g de arroz, 200 g de brócoli y 25 g de palta.',
      '1 manzana grande (~180 g), 10 g de nueces y 4 claras.',
      '100 g de pata-muslo, 100 g de arroz, 200 g de brócoli y 25 g de palta.',
    ],
  },
  3: {
    nombre: 'Mixto',
    comidas: [
      desayuno,
      '75 g de pechuga, 150 g de brócoli y 35 g de palta.',
      '75 g de pata-muslo, 150 g de arroz, 200 g de brócoli y 35 g de palta.',
      '1 manzana grande (~180 g), 15 g de nueces y 4 claras.',
      '75 g de pechuga + 75 g de pata-muslo, 100 g de arroz, 200 g de brócoli y 30 g de palta.',
    ],
  },
};

const COMIDAS = [
  { nombre: 'Desayuno', emoji: '🍳' },
  { nombre: 'Media mañana', emoji: '🥑' },
  { nombre: 'Almuerzo', emoji: '🍗' },
  { nombre: 'Merienda', emoji: '🍎' },
  { nombre: 'Cena', emoji: '🥦' },
];

const CONSEJOS = [
  'Empezá por la proteína: te deja saciado más tiempo.',
  'Tomá un vaso de agua antes de comer.',
  'Pesá los alimentos cocidos para no pasarte.',
  'Comé despacio, sin pantalla: 15-20 minutos.',
  'Si tenés hambre entre comidas, sumá verdura, no pan.',
  'Llegar a la proteína del día (~150 g) es lo más importante.',
  'Dejá la próxima comida preparada así no improvisás.',
];

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function armarMensaje(comida: number, menu: number): string {
  const { nombre, emoji } = COMIDAS[comida - 1];
  const plan = MENUS[menu] ?? MENUS[1];
  // Un consejo distinto según el día y la comida
  const dia = Math.floor(Date.now() / 86_400_000);
  const consejo = CONSEJOS[(dia + comida) % CONSEJOS.length];
  return [
    `${emoji} Hora de: ${nombre}`,
    '',
    plan.comidas[comida - 1],
    '',
    `💡 ${consejo}`,
    `(Menú: ${plan.nombre})`,
  ].join('\n');
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
    const { dry_run = false, comida } = await req.json().catch(() => ({}));
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

    if (!Number.isInteger(comida) || comida < 1 || comida > 5) {
      return new Response(JSON.stringify({ ok: false, error: 'comida debe ser 1 a 5' }), {
        status: 400,
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
        // Último registro de alimentación (hoy o el día más reciente)
        const { data: registro, error: registroError } = await supabase
          .from('alimentacion_diaria')
          .select('fecha, menu, comidas_completadas')
          .eq('user_id', config.user_id)
          .lte('fecha', fecha)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (registroError) throw registroError;

        // Solo avisa a quien usa el plan de alimentación
        if (!registro) {
          resultados.push({ user_id: config.user_id, ok: true, enviado: false, motivo: 'sin plan' });
          continue;
        }

        // Si ya marcó esa comida hoy, no hace falta recordarla
        if (registro.fecha === fecha && (registro.comidas_completadas ?? []).includes(comida)) {
          resultados.push({ user_id: config.user_id, ok: true, enviado: false, motivo: 'ya comida' });
          continue;
        }

        const mensaje = armarMensaje(comida, registro.menu);

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
      comida,
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
