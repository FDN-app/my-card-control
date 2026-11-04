# Estado — CuotaCtrl

## 🔁 Último traspaso
- **Fecha / IA:** 2026-11-04 · Claude — rediseño del menú en `main` (sin commit): 9 ítems → 4 grupos. Finanzas = pestañas Mis Finanzas · Nuevo Gasto · Medios de Pago · Suscripciones; Metas y Conductor = pestañas; Alimentación sola. Importar pasó a ser botón dentro de Nuevo Gasto. Las URLs no cambiaron.
- **Archivos:** `src/components/SectionLayout.tsx` (nuevo: grupos + barra de pestañas), `src/App.tsx`, `src/components/AppLayout.tsx`, `src/pages/NewExpense.tsx`, `.claude/launch.json`.
- **Quedó a medias:** falta que Tano lo vea en local (`npm run dev`, puerto 8081 porque 8080 lo usa Open WebUI) y apruebe. Build OK.
- **Próximo paso:** según lo que diga Tano, ajustar o commitear. Sigue pendiente 🚨 credenciales expuestas (ver Pendientes).

## Cómo está hoy
- Funciona en producción. Funcionalidades: ver tabla de la sección 3 de `CUOTACTRL_MASTER.md`.
- Auditoría de seguridad cerrada (RLS en 12 tablas, headers, XSS, OpenAI key movida a Edge Function).

## Pendientes
- [ ] 🚨 **`CUOTACTRL_MASTER.md` tiene credenciales en texto plano y ESTÁ VERSIONADO en git** (token de Telegram, key de DeepSeek, IDs de Supabase). Rotar las claves, sacarlas del doc y reemplazarlas por "ver gestor de secretos". Ojo: siguen en el historial de git aunque se borren.
- [ ] n8n: resumen semanal por Telegram (domingos).
- [ ] n8n: recordatorios de servicios (luz, gas, agua, internet).
- [ ] Verificar si el workflow viejo de suscripciones usa un chat ID fijo y adaptarlo a multiusuario.
- [ ] Verificar alerta Telegram al 80% del presupuesto por categoría.
- [ ] Actualizar `CUOTACTRL_MASTER.md` (última actualización: julio).
