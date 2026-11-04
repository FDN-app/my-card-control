-- 5 avisos diarios de comidas por Telegram, sin n8n.
-- Usa el secreto y validar_cron_secret creados en 00006.
-- Horarios Argentina (UTC-3) → UTC: 10:00→13:00, 12:30→15:30, 14:30→17:30, 17:30→20:30, 21:30→00:30.
DO $$
DECLARE
  aviso RECORD;
BEGIN
  FOR aviso IN
    SELECT * FROM (VALUES
      (1, 'cuotactrl-comida-1-desayuno',     '0 13 * * *'),
      (2, 'cuotactrl-comida-2-media-manana', '30 15 * * *'),
      (3, 'cuotactrl-comida-3-almuerzo',     '30 17 * * *'),
      (4, 'cuotactrl-comida-4-merienda',     '30 20 * * *'),
      (5, 'cuotactrl-comida-5-cena',         '30 0 * * *')
    ) AS t(comida, nombre, horario)
  LOOP
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = aviso.nombre;

    PERFORM cron.schedule(
      aviso.nombre,
      aviso.horario,
      format($cron$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/aviso-comidas',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cuotactrl_cron_secret')
          ),
          body := '{"dry_run": false, "comida": %s}'::jsonb
        );
      $cron$, aviso.comida)
    );
  END LOOP;
END
$$;
