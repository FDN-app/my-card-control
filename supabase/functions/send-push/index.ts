// Supabase Edge Function: send-push
// Deploy: supabase functions deploy send-push
// Requires env vars:
//   VAPID_SUBJECT   = mailto:you@example.com
//   VAPID_PUBLIC_KEY  (generate with: npx web-push generate-vapid-keys)
//   VAPID_PRIVATE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload: PushPayload = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription_json');

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@cuotactrl.app';

    // Import web-push from esm.sh
    const webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const results = await Promise.allSettled(
      subscriptions.map(({ subscription_json }) => {
        const sub = JSON.parse(subscription_json);
        return webpush.default.sendNotification(
          sub,
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' }),
        );
      }),
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
