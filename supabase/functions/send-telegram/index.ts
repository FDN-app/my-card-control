// Supabase Edge Function: send-telegram
// Deploy: supabase functions deploy send-telegram
// Requires env vars (set with `supabase secrets set`):
//   TELEGRAM_BOT_TOKEN  — token from @BotFather
//   TELEGRAM_CHAT_ID    — destination chat id

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

  try {
    const { tipo, detalle }: AlertPayload = await req.json();

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')!;

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
