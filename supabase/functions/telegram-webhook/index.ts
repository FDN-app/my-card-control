// Supabase Edge Function: telegram-webhook
// Deploy: supabase functions deploy telegram-webhook
// Registrar como webhook del bot:
//   curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
//     -d url=https://<project>.supabase.co/functions/v1/telegram-webhook
//
// Cuando un usuario manda un código de 6 chars al bot, esta función:
//   1. Busca el código en telegram_vinculaciones (no expirado y no vinculado aún)
//   2. Actualiza configuracion_usuario con el chat_id del usuario
//   3. Responde al usuario con un mensaje de confirmación

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const adminClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) {
      return new Response('ok', { status: 200 });
    }

    const chatId = String(message.chat.id);
    const codigo = message.text.trim().toUpperCase();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

    // Buscar código válido: no expirado y no vinculado aún
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

    // Marcar la vinculación como completada
    await adminClient
      .from('telegram_vinculaciones')
      .update({ vinculado_at: ahora })
      .eq('id', vinc.id);

    // Guardar chat_id en configuracion_usuario (upsert por si la fila no existe aún)
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
    // Telegram requiere siempre 200 para no reintentar
    return new Response('ok', { status: 200 });
  }
});

async function sendMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
