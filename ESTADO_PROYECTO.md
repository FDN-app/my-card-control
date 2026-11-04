# ESTADO_PROYECTO — CuotaCtrl

> Archivo canónico de estado para `my-card-control`.

## 🔁 Último traspaso
- **Fecha / IA:** 2026-11-04 · Claude (rama `personal`). En `main` ya se publicaron: menú agrupado + cuotas Pagar/parcial/detalle (`d882b5f`); el traspaso y la lista de pendientes completa están en el `ESTADO_PROYECTO.md` de `main`.
- **Hecho:** aviso de suscripciones por vencer sin n8n → `supabase/functions/aviso-suscripciones/index.ts` + `supabase/migrations/00009_aviso_suscripciones_cron.sql` (20:00 AR) + `config.toml`. Avisa las `Activa` que vencen entre hoy y `dias_alerta` (3 por defecto). **Deployado y probado: el mensaje llegó.** Cron cargado a mano en el SQL Editor.
- **Deploy de funciones:** la CLI logueada es otra cuenta. Se usa un token de proyecto (7 días): `env SUPABASE_ACCESS_TOKEN=... supabase functions deploy <fn> --project-ref bvudjigocyxrgqplcghd --no-verify-jwt`. Supabase de cuotactrl = login con GitHub (`tanomanfer's Org`).
- **Ojo:** `main` → `personal` NO está mezclado (conflictos en App.tsx, AppLayout.tsx, Alimentacion): es una tarea aparte.
- **Avisos de comidas (deployado y probado, llegó; falta commit):** `supabase/functions/aviso-comidas/index.ts` (recibe `comida` 1-5; usa el menú del último registro de `alimentacion_diaria`; si ya marcó esa comida hoy no avisa; sin registro no avisa) + `00010_aviso_comidas_cron.sql` (10:00, 12:30, 14:30, 17:30, 21:30 AR) + `config.toml`. El menú está copiado de `src/lib/planAlimentacion.ts`: si cambia el plan, actualizar ambos. `deno check` OK.
- **Próximo paso:** commit de avisos de comidas (cron 00010 ya cargado en SQL Editor). Después: Conductor, Renovar, mezclar main→personal.

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
