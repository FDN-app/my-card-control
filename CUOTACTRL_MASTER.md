# 📒 CuotaCtrl — Documento Maestro

> Última actualización: 8 de julio de 2026 (Telegram multiusuario + auditoría de seguridad)
> App de control de gastos, tarjetas y suscripciones personales. Objetivo: uso personal y, eventualmente, venta comercial.

---

## 1. Información del proyecto

| Dato | Valor |
|------|-------|
| **Nombre** | CuotaCtrl |
| **Repo** | github.com/FDN-app/my-card-control |
| **URL producción** | cuotactrl.vercel.app |
| **Ruta local** | `~/Proyectos/my-card-control` (clonado desde GitHub) |
| **Stack frontend** | React + TypeScript + Tailwind CSS + Vite |
| **Backend / Auth / DB** | Supabase (ref: `bvudjigocyxrgqplcghd`, proyecto "cuotactrl") |
| **Hosting** | Vercel (auto-deploy vía GitHub) |
| **Automatizaciones** | n8n en VPS HostGator (Easypanel) — URL: `n8n-n8n.fihebt.easypanel.host` |
| **Notificaciones** | Bot de Telegram `@cardcontrol_alertas_bot` |

### Tablas de Supabase
`gastos`, `gastos_diarios`, `ingresos`, `suscripciones`, `tarjetas`, `configuracion_usuario`, `push_subscriptions`, `presupuestos`, `reglas_categoria`, `metas_ahorro`, `jornadas`, `telegram_vinculaciones`

**Campos agregados recientemente:**
- `ingresos.tipo` ('fijo' / 'variable')
- `gastos.tasa_interes` (cuotas; `total_cuotas` y `cuota_actual` ya existían)
- `jornadas`: `facturado`, `gasto_nafta`, `km_recorridos`, `horas`, `notas`
- `configuracion_usuario.telegram_chat_id` (text, nullable) — vincula Telegram por usuario

### Campos relevantes de `suscripciones`
`id`, `user_id`, `tarjeta_id`, `nombre`, `monto`, `periodicidad`, `fecha_proximo_cobro`, `estado` (valor "Activa"), `notas`, `dias_alerta`, `created_at`

---

## 2. Infraestructura y credenciales

- **Edge Functions desplegadas:**
  - `dynamic-action` (display: `send-telegram`) — JWT activado. Manda alertas a Telegram usando el `telegram_chat_id` del usuario autenticado.
  - `telegram-webhook` — JWT desactivado. Recibe mensajes del bot y vincula el chat_id del usuario al recibir su código.
  - `openai-chat` — JWT activado. Proxy seguro a OpenAI (la API key vive solo acá, no en el frontend).
- **Secrets en Supabase:** `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY`, `VAPID_PRIVATE_KEY` (más los defaults `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Env vars en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` (sin flag "Sensitive" para que Vite las lea). `VITE_OPENAI_API_KEY` ya NO está — fue eliminada por seguridad.
- **Telegram Bot:** `@cardcontrol_alertas_bot`. Webhook registrado apuntando a `telegram-webhook`. Multi-usuario funcional.

### Notas operativas importantes
- El disco externo NTFS ("Nuevo vol") tiene errores de filesystem → el proyecto ahora vive en el disco interno (`~/Proyectos`).
- El plan Free de Supabase pausa el proyecto tras ~1 semana de inactividad → resuelto con **ping automático en n8n cada 3 días**.
- Supabase CLI tiene fricción de auth → las Edge Functions se deployan vía el editor del dashboard.
- Build local suele trabarse por I/O del disco → preferir push directo y dejar que Vercel buildee.

---

## 3. Funcionalidades implementadas ✅

| Feature | Estado | Notas |
|---------|--------|-------|
| Gestión de tarjetas / medios de pago | ✅ | |
| Gastos, gastos diarios, ingresos | ✅ | Vía hook `useFinanzas` |
| Suscripciones | ✅ | Con periodicidad y días de alerta |
| Editar / eliminar en todos los módulos | ✅ | |
| Navegación inferior mobile | ✅ | |
| Toggle bidireccional cuota pagada/impaga | ✅ | |
| Balance neto | ✅ | |
| Gráfico circular de presupuesto | ✅ | Recharts |
| Calendario de gastos | ✅ | |
| Exportar PDF | ✅ | jspdf + html2canvas |
| Multi-moneda (ARS/USD/EUR) | ✅ | Tasas manuales |
| Landing page comercial | ✅ | |
| Notificación Telegram: gasto > $50.000 ARS | ✅ | En `addGastoDiario` (onSuccess) |
| Workflow n8n: aviso de vencimiento de suscripciones | ✅ | 5 días antes hasta el día del cobro |
| Ping automático anti-pausa de Supabase | ✅ | n8n cada 3 días |
| Presupuesto por categoría | ✅ | Tabla `presupuestos` + CRUD + UI en Configuración |
| Categorización automática de gastos | ✅ | Tabla `reglas_categoria` (patrón → categoría) |
| Comparativa mes actual vs anterior | ✅ | Componente `ComparativaMensual.tsx` en Dashboard |
| Metas de ahorro | ✅ | Tabla `metas_ahorro` + página `/metas` con barra de progreso |
| Cuotas e intereses de tarjeta | ✅ | Campos `total_cuotas`, `cuota_actual`, `tasa_interes` + `DeudaFutura.tsx` |
| Módulo Conductor (Uber) | ✅ | Tabla `jornadas` + página `/conductor` con neto, $/km, $/hora, vista semanal, apartado para impuestos |
| Ingresos fijo vs variable | ✅ | Campo `tipo` en `ingresos` (sueldo en blanco vs Uber) |
| Jornadas Uber conectadas al balance | ✅ | Facturado → ingresos, nafta → gastos. Fuente de verdad única en `NetBalance.tsx` |
| Usuario de prueba para profesor | ✅ | `test@appafer.com` — RLS confirma que ve la app vacía |
| **Telegram multiusuario** | ✅ | Cada usuario vincula su Telegram con código único de 6 chars. Bot único `@cardcontrol_alertas_bot` sirve para todos |
| **Auditoría de seguridad completa** | ✅ | Ver `INFORME_SEGURIDAD.md` en el repo |

---

## 4. Automatizaciones en n8n

### Workflow 1 — Ping anti-pausa
- **Trigger:** cada 3 días
- **Acción:** GET a `…/rest/v1/gastos?limit=1` con headers `apikey` + `Authorization`
- **Objetivo:** mantener Supabase activo

### Workflow 2 — Aviso de vencimiento de suscripciones
- **Trigger:** diario, 9am
- **HTTP Request:** GET suscripciones activas (`estado=eq.Activa`)
- **Code (JS):** filtra las que vencen en 0–5 días
- **HTTP Request → Telegram:** manda mensaje "Vence en X días" / "Vence HOY"

---

## 5. Historial de implementación (ya completado ✅)

Las siguientes fases ya están implementadas y figuran en la tabla de la sección 3:
- **Fase 1:** Presupuesto por categoría + categorización automática de gastos
- **Fase 2:** Comparativa mes vs mes anterior + metas de ahorro
- **Fase 3:** Cuotas e intereses de tarjeta (deuda futura)
- **Fase 6:** Módulo Conductor (jornadas Uber, ingresos fijo/variable, rentabilidad, apartado impuestos) + conexión de jornadas al balance del dashboard

> Detalle completo de cada fase y sus tablas en la sección 3 y en los archivos de migración SQL del repo.

---

## 6. 🚧 PRÓXIMA SESIÓN — Estado de pendientes

### ✅ Cerrado en esta sesión
- **Telegram multiusuario** — implementado completo. Cada usuario vincula su propio Telegram con código de 6 chars, webhook automático en Supabase. Tabla `telegram_vinculaciones` + campo `telegram_chat_id` en `configuracion_usuario`.
- **Auditoría de seguridad cerrada (3/3):**
  1. ✅ RLS verificado en las 12 tablas (todas activas).
  2. ✅ API key de OpenAI movida a Edge Function `openai-chat`. La key ya NO está en el frontend ni en Vercel.
  3. ✅ `npm update vite` corrido — vulnerabilidades del toolchain parcheadas.

### 🔜 Pendientes activos
1. **Workflow n8n: Resumen semanal por Telegram** (domingos a la noche, total gastado, top categorías, comparación semana anterior, suscripciones próximas). Pendiente: actualizar el workflow de avisos de suscripciones existente para que use `telegram_chat_id` por usuario (hoy puede estar todavía con el chat ID fijo).
2. **Workflow n8n: Recordatorios de servicios** (luz, gas, agua, internet) — mismo mecanismo que vencimiento de suscripciones.
3. **Verificar workflow viejo de avisos de suscripciones** — confirmar si quedó usando el chat ID hardcodeado. Hay que adaptarlo para multi-usuario igual que la Edge Function.
4. **Alerta Telegram cuando categoría llega al 80% del presupuesto** — verificar si quedó wireado tras la Fase 1.1.

---

## 7. Notas para venta comercial

### Límites del plan Free de Supabase (sobra para empezar)
- 500 MB de base de datos
- 50.000 usuarios activos mensuales (MAU)
- 2 GB de transferencia/mes
- Se pausa por inactividad → ya resuelto con ping n8n
- Migrar a Pro ($25/mes) recién cuando haya varios usuarios pagos

### Telegram → WhatsApp
- API oficial de WhatsApp (Meta Cloud API): tramo gratis limitado, mensajes iniciados por la app son pagos.
- Librerías no oficiales (Baileys, whatsapp-web.js): gratis pero **riesgo de baneo del número** y van contra los ToS. No recomendado para producto comercial.
- **Decisión:** quedarse con Telegram (gratis, confiable, sin límites). Evaluar WhatsApp solo si un cliente lo exige.

### Cómo cobrar (cuando esté validado)
- **Mercado Pago** (ideal Argentina): suscripciones recurrentes mensuales, tiene API.
- Modelo **Free/Pro**: básico gratis, avanzado (módulo conductor, PDF, alertas) de pago.
- Orden recomendado: 1) Telegram multiusuario → 2) que 2 amigos conductores lo usen gratis y den feedback → 3) recién ahí integrar pagos.

### Estrategia de producto
- Diferenciador fuerte: **módulo Conductor** (hay miles de conductores en Argentina sin una buena app de esto).
- Validar con usuarios reales gratis ANTES de cobrar.

---

## 8. Roadmap — Features pendientes 🔜

Pendientes en n8n (no requieren cocla):
- **Resumen semanal/mensual por Telegram** — workflow nuevo, domingos a la noche: total gastado, top categorías, comparación con semana anterior, suscripciones próximas.
- **Recordatorios de pago de servicios** (luz, gas, agua, internet) — mismo mecanismo que el aviso de vencimiento de suscripciones.

### Alertas dependientes (Fase 1.1 ya implementada)
- ⚠️ Alerta Telegram cuando una categoría alcanza el 80% de su presupuesto (verificar si quedó wireado).

---

## 9. Convenciones de trabajo

- **Claude Code ("cocla")** siempre en modo autónomo: `--dangerously-skip-permissions`, sin confirmaciones
- Comandos y prompts **en español**
- Comandos entregados como bloques limpios de copy-paste
- Implementación de features **en batch** (varios cambios por prompt cuando se puede)
- Skipear `npm run build` local si traba; push directo → Vercel buildea
