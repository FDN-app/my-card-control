# 📒 CuotaCtrl — Documento Maestro

> Última actualización: 26 de junio de 2026
> App de control de gastos, tarjetas y suscripciones (rama `main`, comercial) + sistema personal de productividad "Coach" (rama `personal`, no comercial).

---

## 1. Información del proyecto

| Dato | Valor |
|------|-------|
| **Nombre** | CuotaCtrl |
| **Repo** | github.com/FDN-app/my-card-control |
| **URL producción (comercial)** | cuotactrl.vercel.app |
| **URL rama personal (Coach)** | cardcontrol-git-personal-fernandonicoletti1979-4959s-projects.vercel.app |
| **Ruta local** | `~/Proyectos/my-card-control` (disco interno) |
| **Stack frontend** | React + TypeScript + Tailwind CSS + Vite |
| **Backend / Auth / DB** | Supabase (ref: `bvudjigocyxrgqplcghd`, proyecto "cuotactrl") |
| **Hosting** | Vercel (auto-deploy vía GitHub) |
| **Automatizaciones** | n8n en VPS HostGator (Easypanel) — `n8n-n8n.fihebt.easypanel.host` |
| **Notificaciones / IA** | Bot Telegram `@cardcontrol_alertas_bot` + DeepSeek API |

### Separación de ramas (IMPORTANTE)
- **`main`** = versión comercial limpia (lo que se vende). NO debe contener features del Coach.
- **`personal`** = versión personal de Fernando, con todo el sistema Coach. Ambas ramas usan la MISMA base de datos Supabase, por eso se entra con el mismo usuario en las dos. La diferencia es el código que muestra cada una.

---

## 2. Infraestructura y credenciales

- **Telegram Bot:** `@cardcontrol_alertas_bot`, token `8529912682:AAF...` (en secret `TELEGRAM_BOT_TOKEN` de Supabase)
- **Telegram Chat ID (Fernando):** `1694629692`
- **User ID Supabase (Fernando):** `c9729c52-9e65-46a4-8c2b-b271cd0ff9e4`
- **Edge Function Telegram alertas:** slug `dynamic-action` (display: `send-telegram`)
- **Edge Function webhook Telegram:** `telegram-webhook` → `https://bvudjigocyxrgqplcghd.supabase.co/functions/v1/telegram-webhook`
- **Edge Function IA:** `openai-chat` (OpenAI key segura en backend)
- **DeepSeek API:** endpoint `https://api.deepseek.com/chat/completions`, modelo `deepseek-chat`, key `sk-906061...` (saldo cargado, costo ínfimo por mensaje). OpenAI-compatible.
- **Env vars en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` (sin flag "Sensitive")

### Notas operativas importantes
- **n8n + Supabase: SIEMPRE usar `service_role` key** (no la anon key). Con anon key, la RLS bloquea las consultas porque `auth.uid()` es null en contextos de backend → devuelve vacío. La service_role saltea RLS.
- **Header Authorization en n8n:** debe ser `Bearer ` + key (con espacio). El nombre del header es `Authorization` (con h).
- El plan Free de Supabase pausa el proyecto tras ~1 semana de inactividad → resuelto con ping automático en n8n cada 3 días.
- Edge Functions se deployan vía el editor del dashboard (Supabase CLI tiene fricción de auth). Para copiar el código sin errores: `cat ~/Proyectos/my-card-control/supabase/functions/<slug>/index.ts`.
- Build local suele trabarse por I/O del disco → push directo, Vercel buildea.
- **Zona horaria:** la app usa helper `src/lib/dateAR.ts` (`getHoyArgentina`, `getDiaSemanaArgentina`, `getHoyArDate`, `formatYMD`) para forzar `America/Argentina/Buenos_Aires` (UTC-3) en TODA la app. El server de n8n está en otra timezone → en las expresiones se usa `new Date(new Date().toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'})).getDay()`. Los workflows tienen el timezone seteado a Argentina en Settings.

---

## 3. Base de datos — Tablas de Supabase

### Comerciales (rama main)
`gastos`, `gastos_diarios`, `ingresos`, `suscripciones`, `tarjetas`, `configuracion_usuario`, `push_subscriptions`, `presupuestos`, `reglas_categoria`, `metas_ahorro`, `jornadas`, `telegram_vinculaciones`

### Personales (sistema Coach, rama personal)
- **`metas_diarias`** — registro diario. Campos: `id`, `user_id`, `fecha`, `uber_horas_objetivo`, `uber_facturacion_minima`, `gym_horas`, `gym_tipo`, `estudio_horas`, `estudio_tema`, `dieta_calorias_objetivo`, `apps_horas`, `energia_nivel`, `notas`, + los 5 toggles `uber_realizado`, `gym_realizado`, `estudio_realizado`, `dieta_realizado`, `apps_realizado`. UNIQUE(user_id, fecha).
- **`plan_semanal`** — plantilla base de los 7 días. Campos: `dia_semana` (0=Dom...6=Sáb), `uber_horas`, `uber_facturacion_objetivo`, `gym_activo`, `gym_tipo`, `gym_horas`, `estudio_horas`, `estudio_tema`, `dieta_calorias_objetivo`, `apps_horas`. UNIQUE(user_id, dia_semana).
- **`objetivos_mensuales`** — meta de apps por mes. UNIQUE(user_id, mes, anio).
- **`proyectos`** — seguimiento de apps/proyectos. Campos: `nombre`, `descripcion`, `estado` (Idea/En progreso/Terminada/Mejorando), `fecha_inicio`, `fecha_fin`.
- **`htb_maquinas`** — máquinas de HackTheBox resueltas. Campos: `nombre`, `dificultad` (Easy/Medium/Hard/Insane), `sistema_operativo` (Linux/Windows), `tecnicas`, `writeup_url`, `ip`, `notas`, `fecha_resolucion`.
- **`htb_config`** — meta semanal de máquinas. Campo: `maquinas_objetivo_semanal` (default 2, editable). UNIQUE(user_id).

### Función SQL
- **`generar_meta_del_dia(p_user_id UUID)`** — crea la fila de `metas_diarias` del día copiando el `plan_semanal` del día de la semana actual (hora Argentina). Si ya existe meta para hoy, no la pisa. SECURITY DEFINER. Llamada vía RPC desde el workflow matutino.

---

## 4. Funcionalidades implementadas ✅

### App comercial (rama main)
Gestión de tarjetas, gastos/gastos diarios/ingresos (hook `useFinanzas`), suscripciones, balance neto, gráfico circular (Recharts), calendario de gastos, exportar PDF (jspdf+html2canvas), multi-moneda (ARS/USD/EUR), landing page, presupuestos por categoría, categorización automática, comparativa mensual, metas de ahorro, cuotas e intereses, módulo Conductor (jornadas Uber: facturación/nafta/km/horas → neto/$km/$hr), Telegram multiusuario (código 6 chars → telegram_chat_id por usuario), auditoría de seguridad completa (RLS en 12 tablas, OpenAI key en Edge Function, vite parcheado, 0 vulnerabilidades).

### Sistema Coach (rama personal)
| Feature | Estado |
|---------|--------|
| Metas Diarias — 5 pilares (Uber/Gym/Estudio/Dieta/Apps) con toggles | ✅ |
| Plan Semanal — rutina base editable de los 7 días | ✅ |
| Objetivos/Proyectos — seguimiento con estados de color | ✅ |
| Módulo HackTheBox — registro de máquinas + meta semanal editable | ✅ |
| Auto-generación de meta diaria desde el plan (función SQL en workflow 7am) | ✅ |
| Navegación mobile — botón "Más" (bottom sheet con todas las secciones) | ✅ |
| Fix zona horaria Argentina en toda la app (helper dateAR) | ✅ |
| Modales con portals (z-index sobre sidebar, no se tapan) | ✅ |

---

## 5. Automatizaciones en n8n

### Comerciales (rama main)
1. **Ping anti-pausa** — cada 3 días, GET a Supabase para mantenerlo activo.
2. **Aviso vencimiento suscripciones** — diario 9am, GET suscripciones activas → filtra 0-5 días → Telegram.

### Sistema Coach (rama personal) — TODOS PUBLISHED y andando
3. **"mensaje matutino coach"** — Schedule 7:00 (TZ Argentina) → RPC `generar_meta_del_dia` (crea meta del día desde plan) → GET `plan_semanal` del día (service_role) → POST DeepSeek (mensaje estilo "Estratega de Alto Rendimiento") → POST Telegram. Nodos en orden: Schedule → HTTP Request3 (RPC) → HTTP Request (plan) → HTTP Request1 (DeepSeek) → HTTP Request2 (Telegram).
4. **"Check Noche Coach"** — Schedule 21:00 → POST Telegram con `reply_markup.inline_keyboard` (5 botones ✅/❌, callback_data `check:<campo>_realizado`). Los toques los recibe el Edge Function `telegram-webhook` (rama callback_query), que hace toggle del campo en `metas_diarias` del día y edita los botones visualmente. Sincroniza con la app al instante.
5. **"Balance Semanal Coach"** — Schedule domingo 23:00 → GET `metas_diarias` últimos 7 días → GET `htb_maquinas` últimos 7 días (con "Execute Once" ON para no duplicar) → nodo Code (arma resumen: cumplimiento por pilar X/Y + máquinas) → POST DeepSeek (balance honesto/motivador con objetivos) → POST Telegram.

### Edge Function `telegram-webhook` (extendido)
Maneja DOS tipos de update sin romper el multiusuario:
- **Rama B (original):** `message.text` → valida código 6 chars en `telegram_vinculaciones` → guarda `telegram_chat_id` en `configuracion_usuario`.
- **Rama A (nueva):** `callback_query` → parsea `check:<campo>` (whitelist CAMPOS_PERMITIDOS) → resuelve user por `telegram_chat_id` → toggle en `metas_diarias` del día Argentina → `answerCallbackQuery` + `editMessageReplyMarkup`.

---

## 6. Aprendizajes y principios clave

- **n8n + Supabase:** usar SIEMPRE `service_role` key (saltea RLS). La anon key hace que las queries devuelvan vacío en backend.
- **Header `Authorization`:** `Bearer ` + key (con espacio, bien escrito con h).
- **Nombres de payload deben coincidir EXACTO con columnas de la tabla** en upserts (ej. `uber_horas_objetivo`, no `uber_horas`). El mismatch rompe silenciosamente (error 42703 o guarda null).
- **`onConflict` debe incluir TODAS las columnas del unique constraint** (ej. `user_id,mes,anio`, no solo `user_id,mes` → error 42P10).
- **Body JSON complejo en n8n con variables:** envolver TODO el body en una expresión `{{ JSON.stringify({...}) }}` (modo expresión, sin `=` al inicio si el campo ya tiene `fx` activo). El `\n` dentro de strings rompe el JSON crudo; `JSON.stringify` lo escapa.
- **Body JSON simple (un solo valor variable):** ahí sí funciona `{{ JSON.stringify($json.campo) }}` directo en el campo.
- **n8n "Execute Once"** (en pestaña Settings del nodo): evita que un HTTP Request se ejecute una vez por cada item de entrada (que duplicaba resultados).
- **Edge Function `telegram-webhook`:** un bot solo puede tener UN webhook. Extender el existente (no crear otro) para no romper el multiusuario. El webhook ya está registrado, no hay que re-correr setWebhook.
- **Modales tapados por sidebar:** causa = stacking context (`z-10` en `<main>` atrapaba los modales). Solución = `createPortal(modal, document.body)` + quitar z-index del main.
- **Zona horaria:** todo en `America/Argentina/Buenos_Aires`. Helper `dateAR.ts` en front; expresión `toLocaleString` en n8n; función SQL usa `now() AT TIME ZONE 'America/Argentina/Buenos_Aires'`.

---

## 7. Convenciones de trabajo

- **Claude Code ("cocla")** siempre en modo autónomo: `--dangerously-skip-permissions`, sin confirmaciones, todo en español. Cerrar prompts con "no me preguntes nada, decí que sí a todo, ejecutá de corrido".
- **cocla corre solo en la PC** (no en el celu). El celu es para usar la app.
- Fernando avisa **"ok"** cuando algo (SQL, deploy) sale bien.
- Comandos entregados como bloques limpios de copy-paste. Cero fricción, decisiones tomadas por él.
- No correr `npm run build` local (traba el disco) → push directo, Vercel buildea.
- Push estándar rama personal: `cd ~/Proyectos/my-card-control && git add . && git commit -m "..." && git push origin personal`

---

## 8. Roadmap — Pendientes 🔜

### Sistema Coach (rama personal)
- *(El sistema central está completo: matutino + check noche + balance semanal + HTB)*
- Posible: afinar prompts de DeepSeek según gusto (más duro/suave).
- Posible: estadísticas acumuladas de HTB (total por dificultad, temas dominados).
- Posible: check de mediodía (se decidió solo noche por ahora).

### App comercial (rama main)
- Verificar que el workflow viejo de avisos de suscripciones use el `telegram_chat_id` de CADA usuario (no hardcodeado).
- Verificar alerta de 80% del presupuesto por categoría (que esté bien cableada).
- Recordatorios de pago de servicios (luz, gas, agua, internet).
- Resumen semanal/mensual de gastos por Telegram (para usuarios comerciales).

### Monetización (futuro comercial)
- Modo multi-usuario/familiar, onboarding, planes Free/Pro con Mercado Pago (mercado argentino), venta a conductores de app, actualización automática de tasas de cambio, migración Supabase Free → Pro cuando haya usuarios reales.
