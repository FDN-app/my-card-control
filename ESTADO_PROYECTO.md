# ESTADO_PROYECTO — CuotaCtrl

> Archivo canónico de estado para `my-card-control`.

## Última actualización
2026-09-20 — El mensaje matutino de las 07:00 se migró de n8n a Supabase Cron + Edge Function.

## Resumen rápido para retomar
- Gestión de tarjetas, gastos, cuotas y suscripciones.
- Stack: React 18, Vite, TypeScript, Tailwind, shadcn, Framer Motion, Recharts y Supabase.
- Producción: `https://cuotactrl.vercel.app`.
- Ramas: `main` comercial y limpia; `personal` agrega Coach para Uber, gimnasio, estudio, dieta, aplicaciones y Hack The Box.
- Automatizaciones n8n: mensaje 07:00, revisión 21:00 y balance semanal los domingos.
- Documento maestro: `CUOTACTRL_MASTER.md`.

## Estado actual
- Rama activa observada: `personal`; último commit: `cc753ca` del 2026-06-26.
- Edge Function `mensaje-matutino` desplegada y activa en Supabase.
- Cron `cuotactrl-mensaje-matutino-7am`: todos los días a las 10:00 UTC (07:00 Argentina).
- Edge Function `check-nocturno` desplegada y activa en Supabase.
- Cron `cuotactrl-check-nocturno-21h`: todos los días a las 00:00 UTC (21:00 Argentina), con botones sincronizados con `metas_diarias`.
- El mensaje matutino ya no depende de n8n ni de DeepSeek.
- Los workflows semanal y de suscripciones todavía dependen de n8n.
- Módulo `Alimentación` agregado en `/alimentacion` a partir del plan personal de 1.800 kcal:
  - selector de tres menús;
  - seguimiento de cinco comidas por día;
  - preparación, pesaje y variantes de merienda;
  - sincronización automática con `metas_diarias.dieta_realizado`.
- Tabla `alimentacion_diaria` creada en Supabase con RLS y registro único por usuario/fecha.
- Riesgo crítico: el documento maestro contiene credenciales en texto plano.

## Pendiente inmediato
- Rotar token de Telegram, clave de DeepSeek y credenciales/identificadores sensibles expuestos.
- Retirar las credenciales del documento y reemplazarlas por nombres de variables de entorno.
- Verificar que esos secretos no sigan accesibles en el historial Git.

## Reglas de trabajo
- Avisar antes de rotar secretos porque puede interrumpir automatizaciones activas.
- Mantener separadas las ramas comercial y personal.
- No hacer `git commit` ni `git push` sin permiso explícito de Fernando.
- Registrar acá decisiones, cambios, pruebas y bloqueos.
