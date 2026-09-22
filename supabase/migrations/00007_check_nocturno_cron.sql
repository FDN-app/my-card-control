DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'cuotactrl-check-nocturno-21h';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END
$$;

-- 00:00 UTC = 21:00 del día anterior en Argentina (UTC-3).
SELECT cron.schedule(
  'cuotactrl-check-nocturno-21h',
  '0 0 * * *',
  $cron$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'project_url'
      ) || '/functions/v1/check-nocturno',
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
