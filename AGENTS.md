# CuotaCtrl (my-card-control) — EN PRODUCCIÓN

> Reglas del proyecto. Las leen Codex y Claude Code (Claude vía `CLAUDE.md` → `@AGENTS.md`).
> Reglas generales de Tano: `~/.codex/AGENTS.md`. Estado y traspaso: `ESTADO_PROYECTO.md`.
> Doc maestro largo: `CUOTACTRL_MASTER.md` (desactualizado desde julio; ⚠️ tiene credenciales: **no copiar nada de la sección 2** a otro archivo ni al chat).
> Seguridad: `INFORME_SEGURIDAD.md`.

## Qué es
Control de gastos, tarjetas, cuotas, suscripciones, ingresos, presupuestos, metas de ahorro y módulo Conductor (jornadas Uber). Uso personal con idea de venta comercial.
Producción: `cuotactrl.vercel.app` (auto-deploy desde GitHub). Repo: `github.com/FDN-app/my-card-control`.

## Ramas
- `main` → versión comercial, limpia.
- `personal` → suma el sistema "Coach" (Uber/Gym/Estudio/Dieta/Apps + HackTheBox, plan de alimentación, alertas).
- Antes de tocar código, confirmar en qué rama se está trabajando (`git branch --show-current`).

## Stack
React 18 + Vite + TypeScript + Tailwind + shadcn + Framer Motion + Recharts. Supabase (proyecto "cuotactrl", 12 tablas con RLS). Playwright + Vitest.
Automatizaciones: n8n en VPS (avisos de suscripciones, ping anti-pausa, mensajes del Coach) + bot de Telegram multiusuario (vinculación por código). IA en Edge Functions (nunca claves en el frontend).

## Comandos
`npm run dev` · `npm run build` · `npm run lint` · `npm test`

## Reglas críticas
- RLS activa en toda tabla; cada usuario ve solo sus datos.
- Claves (OpenAI, DeepSeek, Telegram, service_role) solo como secretos de Supabase/Edge Functions. Nunca en el frontend, el repo ni la documentación.
- Cambios de schema con migraciones nuevas en `supabase/migrations/`.
- Ignorar `register_user.mjs` y `runMigration.mjs` salvo que la tarea sea sobre ellos.
