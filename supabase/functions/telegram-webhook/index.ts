// Supabase Edge Function: telegram-webhook
// Deploy: Supabase Dashboard → Edge Functions → telegram-webhook → Edit & Deploy
//
// Maneja dos tipos de updates de Telegram:
//   A) update.callback_query → Coach checks (botones inline del sistema de metas)
//   B) update.message        → vinculación multiusuario (código de 6 chars)
//
// PREREQUISITO: las columnas dieta_realizado y apps_realizado deben existir en
// metas_diarias. Si la migración 00005 no las creó, corré este SQL antes:
//   ALTER TABLE metas_diarias
//     ADD COLUMN IF NOT EXISTS dieta_realizado BOOLEAN NOT NULL DEFAULT FALSE,
//     ADD COLUMN IF NOT EXISTS apps_realizado  BOOLEAN NOT NULL DEFAULT FALSE;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const adminClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ── Whitelist de campos (previene injection en nombre de columna) ──────────────

const CAMPOS_PERMITIDOS = new Set([
  'uber_realizado',
  'gym_realizado',
  'estudio_realizado',
  'dieta_realizado',
  'apps_realizado',
]);

type CampoRealizado =
  | 'uber_realizado'
  | 'gym_realizado'
  | 'estudio_realizado'
  | 'dieta_realizado'
  | 'apps_realizado';

const CAMPO_INFO: Record<CampoRealizado, { emoji: string; label: string }> = {
  uber_realizado:    { emoji: '🚗', label: 'Uber' },
  gym_realizado:     { emoji: '🏋', label: 'Gym' },
  estudio_realizado: { emoji: '📚', label: 'Estudio' },
  dieta_realizado:   { emoji: '🥗', label: 'Dieta' },
  apps_realizado:    { emoji: '💻', label: 'Apps' },
};

const TODOS_LOS_CAMPOS = Object.keys(CAMPO_INFO) as CampoRealizado[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

async function sendMessage(token: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text: string,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

async function editMessageReplyMarkup(
  token: string,
  chatId: string | number,
  messageId: number,
  replyMarkup: object,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
  });
}

/** Construye el inline_keyboard reflejando el estado actual de cada campo */
function buildCoachKeyboard(row: Record<string, unknown>) {
  const botones = TODOS_LOS_CAMPOS.map((campo) => {
    const hecho = Boolean(row[campo]);
    const { emoji, label } = CAMPO_INFO[campo];
    return {
      text: hecho ? `${emoji} ${label} ✅` : `${emoji} ${label} ◻️`,
      callback_data: `check:${campo}`,
    };
  });

  // 2 botones por fila (última fila puede quedar con 1)
  const keyboard: (typeof botones)[] = [];
  for (let i = 0; i < botones.length; i += 2) {
    keyboard.push(botones.slice(i, i + 2));
  }
  return { inline_keyboard: keyboard };
}

// ── Rama A: callback_query → Coach checks ────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function handleCallbackQuery(update: Record<string, any>, botToken: string): Promise<void> {
  const cq                        = update.callback_query;
  const callbackQueryId: string   = String(cq.id);
  const chatId: string            = String(cq.message?.chat?.id ?? cq.from?.id ?? '');
  const messageId: number | undefined = cq.message?.message_id;
  const data: string              = String(cq.data ?? '');

  // Solo procesamos "check:CAMPO"
  if (!data.startsWith('check:')) {
    await answerCallbackQuery(botToken, callbackQueryId, '❓ Acción desconocida');
    return;
  }

  const campo = data.slice('check:'.length);

  if (!CAMPOS_PERMITIDOS.has(campo)) {
    await answerCallbackQuery(botToken, callbackQueryId, '❌ Campo inválido');
    return;
  }

  // Resolver user_id desde chat_id (service role para bypass RLS)
  const { data: config } = await adminClient
    .from('configuracion_usuario')
    .select('user_id')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  if (!config?.user_id) {
    await answerCallbackQuery(
      botToken,
      callbackQueryId,
      '❌ No estás vinculado a CuotaCtrl. Vinculá tu cuenta desde la app.',
    );
    return;
  }

  const userId: string = config.user_id;
  const hoy = getHoyArgentina();

  // Leer fila de hoy para conocer el estado actual
  const { data: metaActual, error: readError } = await adminClient
    .from('metas_diarias')
    .select('id, uber_realizado, gym_realizado, estudio_realizado, dieta_realizado, apps_realizado')
    .eq('user_id', userId)
    .eq('fecha', hoy)
    .maybeSingle();

  if (readError) {
    console.error('Error leyendo metas_diarias:', readError);
    await answerCallbackQuery(botToken, callbackQueryId, '❌ Error al leer la meta del día');
    return;
  }

  let nuevoValor: boolean;
  let estadoFinal: Record<string, unknown>;

  if (metaActual) {
    // Toggle del valor actual
    const valorActual = Boolean((metaActual as Record<string, unknown>)[campo]);
    nuevoValor = !valorActual;

    const { error: updateError } = await adminClient
      .from('metas_diarias')
      .update({ [campo]: nuevoValor, updated_at: new Date().toISOString() })
      .eq('id', metaActual.id);

    if (updateError) {
      console.error('Error actualizando metas_diarias:', updateError);
      await answerCallbackQuery(botToken, callbackQueryId, '❌ Error al actualizar');
      return;
    }

    estadoFinal = { ...(metaActual as Record<string, unknown>), [campo]: nuevoValor };
  } else {
    // No hay fila para hoy: insertarla con este campo en true y el resto en false
    nuevoValor = true;

    const newRow: Record<string, unknown> = {
      user_id: userId,
      fecha: hoy,
      uber_realizado: false,
      gym_realizado: false,
      estudio_realizado: false,
      dieta_realizado: false,
      apps_realizado: false,
      [campo]: true,
    };

    const { error: insertError } = await adminClient
      .from('metas_diarias')
      .insert(newRow);

    if (insertError) {
      console.error('Error insertando metas_diarias:', insertError);
      await answerCallbackQuery(botToken, callbackQueryId, '❌ Error al crear la meta del día');
      return;
    }

    estadoFinal = newRow;
  }

  // Feedback visible en el banner de Telegram
  const { label } = CAMPO_INFO[campo as CampoRealizado];
  await answerCallbackQuery(
    botToken,
    callbackQueryId,
    nuevoValor ? `✅ ${label} marcado` : `◻️ ${label} desmarcado`,
  );

  // Actualizar el teclado inline para reflejar el nuevo estado visualmente
  if (messageId && chatId) {
    await editMessageReplyMarkup(botToken, chatId, messageId, buildCoachKeyboard(estadoFinal));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const update = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

    // ── Rama A: callback_query (Coach checks) ─────────────────────────────
    if (update?.callback_query) {
      await handleCallbackQuery(update, botToken);
      return new Response('ok', { status: 200 });
    }

    // ── Rama B: message (vinculación multiusuario — lógica original intacta)
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) {
      return new Response('ok', { status: 200 });
    }

    const chatId = String(message.chat.id);
    const codigo = message.text.trim().toUpperCase();

    const { data: vinc } = await adminClient
      .from('telegram_vinculaciones')
      .select('id, user_id')
      .eq('codigo', codigo)
      .is('vinculado_at', null)
      .gt('expira_en', new Date().toISOString())
      .maybeSingle();

    if (!vinc) {
      await sendMessage(botToken, chatId,
        '❌ Código inválido o expirado. Generá uno nuevo desde la app CuotaCtrl.');
      return new Response('ok', { status: 200 });
    }

    const ahora = new Date().toISOString();

    await adminClient
      .from('telegram_vinculaciones')
      .update({ vinculado_at: ahora })
      .eq('id', vinc.id);

    await adminClient
      .from('configuracion_usuario')
      .upsert(
        { user_id: vinc.user_id, telegram_chat_id: chatId },
        { onConflict: 'user_id' },
      );

    await sendMessage(botToken, chatId,
      '✅ ¡Telegram vinculado correctamente a CuotaCtrl!\n\nVas a recibir alertas de tus gastos y presupuestos por acá.');

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('telegram-webhook error:', err);
    return new Response('ok', { status: 200 });
  }
});
