// Supabase Edge Function: send-telegram (desplegada como "dynamic-action")
// Deploy: supabase functions deploy dynamic-action
// Requires env vars:
//   TELEGRAM_BOT_TOKEN       — token from @BotFather
//   SUPABASE_SERVICE_ROLE_KEY — para leer configuracion_usuario sin RLS
//
// Obtiene el telegram_chat_id del usuario autenticado (JWT) desde configuracion_usuario.
// Si no está vinculado, devuelve { ok: false, reason: "telegram_no_vinculado" }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  tipo: string;
  detalle: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verificar JWT y obtener user
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const { data: { user }, error: authError } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ ok: false, error: 'Token inválido o expirado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { tipo, detalle }: AlertPayload = await req.json();

    // Buscar el chat_id del usuario en configuracion_usuario usando service role (bypass RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: config } = await adminClient
      .from('configuracion_usuario')
      .select('telegram_chat_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const chatId = config?.telegram_chat_id;

    if (!chatId) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'telegram_no_vinculado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const text = `💳 CuotaCtrl\n${tipo}\n${detalle}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.description ?? 'Error al enviar mensaje a Telegram');

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
