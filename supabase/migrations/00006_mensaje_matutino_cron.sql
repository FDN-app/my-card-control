-- Mensaje matutino sin n8n.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret(
      'https://bvudjigocyxrgqplcghd.supabase.co',
      'project_url',
      'URL del proyecto para tareas programadas'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cuotactrl_cron_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'cuotactrl_cron_secret',
      'Autenticación interna de Supabase Cron'
    );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.validar_cron_secret(p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'cuotactrl_cron_secret'
      AND decrypted_secret = p_secret
  );
$$;

REVOKE ALL ON FUNCTION public.validar_cron_secret(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_cron_secret(TEXT) TO service_role;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'cuotactrl-mensaje-matutino-7am';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END
$$;

-- pg_cron usa UTC: 10:00 UTC = 07:00 en Argentina (UTC-3).
SELECT cron.schedule(
  'cuotactrl-mensaje-matutino-7am',
  '0 10 * * *',
  $cron$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'project_url'
      ) || '/functions/v1/mensaje-matutino',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'cuotactrl_cron_secret'
        )
      ),
      body := '{"dry_run": false}'::jsonb
    );
  $cron$
);
