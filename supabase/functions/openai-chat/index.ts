// Supabase Edge Function: openai-chat
// Deploy: supabase functions deploy openai-chat
// Secrets requeridos (supabase secrets set OPENAI_API_KEY=sk-...):
//   OPENAI_API_KEY — clave de OpenAI, nunca expuesta al frontend
//
// Actúa como proxy seguro: valida el JWT del usuario antes de llamar a OpenAI.
// El frontend envía los mensajes; la API key permanece solo en el servidor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  response_format?: { type: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Validar JWT del usuario autenticado
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      response_format,
    }: ChatRequest = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key no configurada en el servidor.');
    }

    const requestBody: Record<string, unknown> = { model, messages, temperature };
    if (response_format) requestBody.response_format = response_format;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message ?? 'Error al comunicarse con OpenAI');
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
