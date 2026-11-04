-- Aviso diario de suscripciones por vencer, sin n8n.
-- Usa el secreto y validar_cron_secret creados en 00006.
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'cuotactrl-aviso-suscripciones-20h';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END
$$;

-- 23:00 UTC = 20:00 en Argentina (UTC-3).
SELECT cron.schedule(
  'cuotactrl-aviso-suscripciones-20h',
  '0 23 * * *',
  $cron$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'project_url'
      ) || '/functions/v1/aviso-suscripciones',
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
