# 📒 CuotaCtrl — Documento Maestro

> Última actualización: 22 de junio de 2026
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
`gastos`, `gastos_diarios`, `ingresos`, `suscripciones`, `tarjetas`, `configuracion_usuario`, `push_subscriptions`

### Campos relevantes de `suscripciones`
`id`, `user_id`, `tarjeta_id`, `nombre`, `monto`, `periodicidad`, `fecha_proximo_cobro`, `estado` (valor "Activa"), `notas`, `dias_alerta`, `created_at`

---

## 2. Infraestructura y credenciales

- **Edge Function Telegram:** slug `dynamic-action` (nombre display: `send-telegram`)
- **Secrets en Supabase:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `VAPID_PRIVATE_KEY`
- **Env vars en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` (sin flag "Sensitive" para que Vite las lea)
- **Telegram Chat ID:** `1694629692`

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

## 5. Roadmap — Features pendientes 🔜

Plan de implementación ordenado por dependencias e impacto.

### Fase 1 — Cimientos de datos (van primero porque otras dependen de ellos)

**1.1 Presupuesto por categoría**
- Nueva tabla `presupuestos` (`id`, `user_id`, `categoria`, `limite_mensual`, `moneda`)
- UI en Configuración para definir límite por categoría
- Cálculo de % usado por categoría en el mes actual
- *Habilita: alerta de 80%, comparativas, dashboard de presupuesto*

**1.2 Categorización automática de gastos**
- Tabla `reglas_categoria` (`id`, `user_id`, `patron`, `categoria`) — mapea texto del comercio → categoría
- Lógica en `useFinanzas`: al crear un gasto, si el nombre/descripción matchea un patrón, asigna la categoría sola
- Seed inicial con patrones comunes (super, farmacia, combustible, streaming, etc.)
- UI para que el usuario cree/edite sus propias reglas

### Fase 2 — Visualización y metas

**2.1 Comparativa mes actual vs mes anterior**
- Componente que calcula totales del mes actual y anterior
- Muestra delta absoluto y porcentual por categoría y total
- Indicador visual (verde/rojo) según gastaste más o menos

**2.2 Metas de ahorro**
- Nueva tabla `metas_ahorro` (`id`, `user_id`, `nombre`, `objetivo`, `fecha_limite`, `ahorrado_actual`, `moneda`)
- UI para crear meta con objetivo y fecha
- Barra de progreso + proyección ("a este ritmo llegás el…")
- Opcional: aporte manual a la meta

### Fase 3 — Lo diferencial (argentino)

**3.1 Cuotas e intereses de tarjeta**
- Extender gastos con campos `total_cuotas`, `cuota_actual`, `tasa_interes` (si aplica)
- Proyección: cuánto queda por pagar de cada compra en cuotas
- Vista consolidada de "deuda futura" por tarjeta y por mes
- Calendario de vencimientos de cuotas

**3.2 Recordatorios de pago de servicios**
- Reusar tabla `suscripciones` o crear `servicios` (luz, gas, agua, internet…)
- Mismo mecanismo de aviso por Telegram que las suscripciones

### Fase 4 — Engagement (aprovecha el bot existente)

**4.1 Resumen semanal/mensual automático por Telegram**
- Workflow n8n nuevo: domingos a la noche
- Trae gastos de la semana desde Supabase
- Arma un resumen: total gastado, top categorías, comparación con semana anterior, suscripciones próximas
- Manda mensaje formateado al bot

### Alertas dependientes (se activan al completar Fase 1.1)
- ⚠️ Alerta Telegram cuando una categoría alcanza el 80% de su presupuesto

---

## 6. Backlog futuro (para venta comercial)

- Modo multi-usuario / familiar (compartir gastos)
- Onboarding para usuarios nuevos
- Sistema de planes Free/Pro
- Migración de Supabase Free a Pro (o proveedor con mejor escala) cuando haya usuarios reales
- Actualización automática de tasas de cambio ARS/USD/EUR

---

## 7. Convenciones de trabajo

- **Claude Code ("cocla")** siempre en modo autónomo: `--dangerously-skip-permissions`, sin confirmaciones
- Comandos y prompts **en español**
- Comandos entregados como bloques limpios de copy-paste
- Implementación de features **en batch** (varios cambios por prompt cuando se puede)
- Skipear `npm run build` local si traba; push directo → Vercel buildea
