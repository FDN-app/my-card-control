# Estado — CuotaCtrl

## 🔁 Último traspaso
- **Fecha / IA:** 2026-11-04 · Claude — (1) menú agrupado en 4 secciones con pestañas: commits `e82da52` + `0b0ddcd`, publicado. (2) Cuotas: botón **Pagar** en cada gasto (también con 1 cuota) → dialog "Pagar todo" o **pago parcial** (`modificaciones_cuotas[n].pagado_parcial`, sin migración); lo parcial se descuenta de proyección y pendiente; "Pagado" queda visible hasta eliminar. Cada gasto muestra "Vence <fecha>" y la flechita (ahora en todos los gastos) abre un panel **Detalle** (medio de pago, fecha de compra, próximo vencimiento, cuotas, interés) + desglose. Arreglado `nextMonthTotal` en `store.tsx` (sumaba gastos de 1 cuota ya pagos).
- **Archivos (2, sin commit):** `src/pages/CardDetail.tsx`, `src/lib/data.ts`, `src/lib/store.tsx`. Build y tests OK; falta que Tano lo pruebe en local.
- **Quedó a medias:** Renovar (Tano tiene que definir qué es). Dashboard (`Index.tsx`) y `useFinanzas.ts` no consideran pagos parciales.
- **Próximo paso:** OK de Tano → commit. Después, uno por vez: Conductor (borrar días con resumen mensual), avisos de suscripciones por Supabase, 5 avisos de comidas. Ver Pendientes. Sigue 🚨 credenciales.

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

### Mejoras de interfaz que pidió Tano (2026-11-04) — anotadas, sin empezar
- [ ] **Cuotas en Medios de Pago** (`src/pages/CardDetail.tsx`): botón **Pagar** visible en cada gasto, también si tiene 1 sola cuota (hoy solo se marca dentro de la flechita y no aparece con 1 cuota). Queda como "Pagado" hasta que Tano lo elimine, y se descuenta de la deuda. **Pago parcial** ("Pagado $X · Falta $Y"). **Renovar**: falta que Tano defina qué significa (¿refinanciar lo que falta en un plan nuevo?). Se puede guardar en `modificaciones_cuotas` (JSON) sin migración. Revisar que Dashboard/Finanzas descuenten igual (hoy calculan las cuotas restantes de formas distintas: `Index.tsx`, `useFinanzas.ts`, `store.tsx`).
- [ ] **Conductor — jornadas**: poder eliminar días, pero que quede el **resumen del mes** (cuánta plata hizo en el mes) aunque se borren los días. Probablemente necesite una tabla o registro de resumen mensual (migración nueva).
- [ ] **Telegram — avisos de suscripciones dejaron de llegar**: antes llegaban, ahora solo llegan los de inicio/fin de jornada. Quiere aviso cuando una suscripción está por vencer. Sospecha: el workflow de n8n de suscripciones (VPS) usa un chat ID fijo y se rompió con el bot multiusuario (ver pendiente de arriba), o está desactivado. Revisar n8n primero. **Alternativa sin n8n** (Tano la prefiere): pasarlo a Supabase con `pg_cron` + Edge Function, como ya hacen `mensaje-matutino` y `check-nocturno` en la rama `personal` (migraciones 00006/00007).
- [ ] **Telegram — aviso de cada comida** (rama `personal`): un mensaje por comida (ej. 10:00 desayuno) con lo que toca comer según el menú elegido (`src/lib/planAlimentacion.ts`) + un consejo (proteína, etc.). Mismo esquema `pg_cron` + Edge Function. Son **5 avisos** (desayuno, media mañana, almuerzo, merienda, cena); falta definir los horarios con Tano.
