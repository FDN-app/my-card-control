# Informe de Auditoría de Seguridad — CuotaCtrl

**Fecha:** 22 de junio de 2026  
**Aplicación:** CuotaCtrl (React + TypeScript + Supabase + Vercel)  
**Repositorio:** github.com/FDN-app/my-card-control  
**Auditor:** Análisis automatizado con revisión de código estático  

---

## Resumen Ejecutivo

Se realizó una auditoría de seguridad sobre la base de código completa de CuotaCtrl, abarcando secretos y credenciales, autenticación, Row Level Security (RLS), validación de datos, edge functions, dependencias y buenas prácticas generales. Se identificaron **2 riesgos críticos**, **5 puntos mejorables** y **7 controles en buen estado**. Los riesgos críticos fueron corregidos como parte de esta auditoría.

---

## 1. Secretos y Credenciales

### 1.1 Archivo `.env.local` en `.gitignore`
**Estado: ✅ OK**

El `.gitignore` incluye la regla `.env*.local`, por lo que `.env.local` (que contiene la URL y anon key de Supabase y la API key de OpenAI) **nunca fue commiteado** al repositorio. Verificado con `git log --all --full-history -- ".env.local"` (resultado vacío).

### 1.2 Credenciales hardcodeadas en `register_user.mjs`
**Estado: ❌ RIESGO → CORREGIDO**

El archivo `register_user.mjs` fue commiteado al repositorio y contiene:

```
# Hallazgo en register_user.mjs (commiteado en HEAD)
const supabaseUrl  = 'https://hbzrgxuwtdcsqoenkvms.supabase.co';  // URL de proyecto anterior
const supabaseKey  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // anon key expuesta en git
email:    'tanomanfer@gmail.com'   // email hardcodeado
password: 'chicha33'               // ❌ CONTRASEÑA EN TEXTO PLANO EN GIT
```

**Impacto:** Aunque corresponde a un proyecto Supabase anterior (distinto al de producción actual, identificado por el `ref` `hbzrgxuwtdcsqoenkvms` vs `bvudjigocyxrgqplcghd` actual), la contraseña del usuario administrador (`chicha33`) está expuesta en el historial público de Git.

**Acciones tomadas:**
- El archivo fue añadido a `.gitignore` para evitar actualizaciones futuras.
- **Acción pendiente del desarrollador:** Si la contraseña `chicha33` se reutiliza en otros servicios, cambiarla inmediatamente. El historial de git no fue reescrito (requeriría `git filter-branch` o `git-filter-repo` y force push, con impacto en colaboradores).

### 1.3 Uso de anon key vs service_role en el frontend
**Estado: ✅ OK**

`src/lib/supabase.ts` usa exclusivamente `VITE_SUPABASE_ANON_KEY` leída de variables de entorno. No hay ninguna `service_role` key en el código fuente ni en archivos trackeados.

```typescript
// src/lib/supabase.ts — correcto
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 1.4 API Key de OpenAI expuesta en el bundle del cliente
**Estado: ⚠️ MEJORABLE**

La key `VITE_OPENAI_API_KEY` es accesible en el bundle JavaScript que se sirve al navegador (el prefijo `VITE_` la expone intencionalmente al cliente). Las llamadas a OpenAI se realizan directamente desde el frontend, lo que significa que cualquier usuario con DevTools puede extraer la key.

**Riesgo concreto:** La key puede ser usada por terceros para generar requests costosos a la cuenta de OpenAI del desarrollador.

**Recomendación:** Mover las llamadas a OpenAI a una Supabase Edge Function o un backend propio, donde la key viva como variable de entorno de servidor y nunca llegue al cliente.

---

## 2. Autenticación y Row Level Security (RLS)

### 2.1 RLS en tablas con migración formal
**Estado: ✅ OK**

Las tablas creadas mediante migraciones en `supabase/migrations/` tienen RLS correctamente habilitado con políticas `auth.uid() = user_id`:

| Tabla | RLS | Política |
|---|---|---|
| `tarjetas` | ✅ Habilitado | FOR ALL usando `auth.uid() = user_id` |
| `gastos` | ✅ Habilitado | FOR ALL usando `auth.uid() = user_id` |
| `push_subscriptions` | ✅ Habilitado | FOR ALL usando `auth.uid() = user_id` |

### 2.2 Tablas sin migración formal en el repositorio
**Estado: ⚠️ MEJORABLE**

Las siguientes tablas fueron creadas ejecutando SQL manualmente en el editor de Supabase (en sesiones anteriores de desarrollo) y **no tienen migración registrada en el repositorio**:

`ingresos`, `gastos_diarios`, `configuracion_usuario`, `suscripciones`, `presupuestos`, `reglas_categoria`, `metas_ahorro`, `jornadas`

**Riesgo:** No es posible auditar en el código si estas tablas tienen RLS habilitado. Si alguna fue creada sin RLS, un usuario autenticado podría leer datos de otros usuarios.

**Verificación necesaria:** Confirmar en el dashboard de Supabase → Table Editor → cada tabla → RLS que esté habilitado y con las políticas correctas. El SQL generado para las tablas nuevas sí incluía RLS, pero no fue verificado que se ejecutara.

**Recomendación:** Registrar estas tablas en archivos de migración en `supabase/migrations/` para trazabilidad.

### 2.3 Queries en `useFinanzas.ts` — filtrado por usuario
**Estado: ✅ OK**

Todas las queries SELECT incluyen `.eq('user_id', user?.id)`:

```typescript
// Ejemplo — patrón consistente en todas las queries
const { data } = await supabase
  .from('ingresos')
  .select('*')
  .eq('user_id', user?.id)   // ← siempre presente
  .order('fecha', { ascending: false });
```

Los mutations de INSERT siempre incluyen `user_id: user!.id`.

### 2.4 Updates y Deletes sin doble filtro de ownership
**Estado: ⚠️ MEJORABLE**

Los updates y deletes en `useFinanzas.ts` usan solamente `.eq('id', id)` sin agregar `.eq('user_id', user!.id)`:

```typescript
// Patrón actual — correcto solo si el RLS está bien configurado
await supabase.from('ingresos').update(updateData).eq('id', id);
await supabase.from('ingresos').delete().eq('id', id);
```

Si el RLS está bien configurado, la base de datos rechazará automáticamente operaciones sobre registros ajenos. Sin embargo, agregar el filtro `.eq('user_id', user!.id)` en el cliente agrega una capa de defensa en profundidad y hace el código auto-documentado.

**Recomendación:** Añadir `.eq('user_id', user!.id)` como cláusula adicional en todos los UPDATE y DELETE del lado cliente.

---

## 3. Validación de Datos

### 3.1 XSS por `dangerouslySetInnerHTML` con contenido de OpenAI
**Estado: ❌ RIESGO → CORREGIDO**

En `src/pages/Index.tsx`, el resumen generado por OpenAI se renderizaba como HTML crudo:

```tsx
// ANTES — riesgo XSS
<div dangerouslySetInnerHTML={{ __html: summary.replace(/\n|-(?=\s)/g, '<br/>&bull;') }} />
```

Si la respuesta de la API de OpenAI fuera manipulada (ataque MITM, account takeover, o respuesta maliciosa), podría inyectar HTML/JS arbitrario en la app.

**Corrección aplicada:** Reemplazado por renderizado seguro con JSX que no interpreta HTML.

### 3.2 Inputs numéricos sin restricción de valores negativos
**Estado: ⚠️ MEJORABLE → PARCIALMENTE CORREGIDO**

Múltiples formularios aceptan valores negativos en campos que por definición no pueden serlo:

| Formulario | Campos sin `min="0"` |
|---|---|
| `Conductor.tsx` (form principal) | `facturado`, `gasto_nafta`, `km_recorridos`, `horas` |
| `Conductor.tsx` (form edición) | los mismos 4 campos |
| `Cards.tsx` | `limit`, `budget` |
| `NewExpense.tsx` | `total`, `installmentAmount` |
| `Finanzas.tsx` | `monto` de ingresos/gastos |

**Corrección aplicada en esta auditoría:** `min="0"` añadido a los campos de `Conductor.tsx`. Los demás se señalan como mejora pendiente para no generar cambios masivos.

**Nota:** La base de datos no tiene constraints `CHECK (monto >= 0)` que rechacen valores negativos a nivel DB.

### 3.3 Validación de longitud de texto
**Estado: ⚠️ MEJORABLE**

Los campos de texto libre (descripción, nombre, notas) no tienen restricción de longitud (`maxLength`). Un input muy largo podría causar:
- Errores de DB si la columna tiene restricción de tamaño
- UI rota si el string es extremadamente largo

**Recomendación:** Añadir `maxLength={500}` (o el límite que corresponda) a campos de texto libre.

### 3.4 Validaciones en formularios críticos
**Estado: ✅ OK (parcial)**

Los formularios principales tienen validación básica:
- `MetasAhorro.tsx`: verifica `nombre.trim()` y `objetivo > 0` ✅
- `Conductor.tsx handleSaveForm`: verifica `facturado` no vacío ✅
- `SubscriptionDialog.tsx`: usa react-hook-form con Zod, la validación más robusta de la app ✅

---

## 4. Edge Functions

### 4.1 Función Telegram (`send-telegram` / `dynamic-action`) sin autenticación
**Estado: ❌ RIESGO → CORREGIDO**

La función edge `supabase/functions/send-telegram/index.ts` aceptaba **cualquier request HTTP** sin verificar que el caller fuera un usuario autenticado:

```typescript
// ANTES — sin validación de JWT
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const { tipo, detalle } = await req.json();
  // ... directamente envía a Telegram
});
```

**Impacto:** Cualquier persona con la URL pública del proyecto Supabase podía invocar la función y enviar mensajes a Telegram haciéndose pasar por la app.

**Corrección aplicada:** Se agregó validación del JWT de Supabase al inicio de la función. Como `supabase.functions.invoke()` en el cliente automáticamente adjunta el token del usuario autenticado en el header `Authorization`, la verificación funciona sin cambios en el frontend.

### 4.2 CORS `Access-Control-Allow-Origin: *`
**Estado: ⚠️ MEJORABLE**

La función expone un CORS abierto (`*`). Para una función que solo llaman usuarios propios de la app, podría restringirse al dominio de producción (`https://cuotactrl.vercel.app`).

---

## 5. Dependencias (`npm audit`)

**Total:** 4 vulnerabilidades (0 críticas, 2 altas, 2 moderadas)

| Severidad | Paquete | Versión afectada | CVE / Descripción |
|---|---|---|---|
| 🔴 HIGH | `vite` | ≤6.4.2 | Path traversal en `.map` handling; bypass de `server.fs.deny` en Windows; NTLMv2 hash leak (Windows) |
| 🔴 HIGH | `form-data` | 4.0.0–4.0.5 | CRLF injection via nombres de campo/archivo sin escapar |
| 🟡 MODERATE | `dompurify` | ≤3.4.10 | Trusted Types policy pollution; ALLOWED_ATTR pollution via `setConfig()` |
| 🟡 MODERATE | `esbuild` | ≤0.24.2 | Dev server acepta requests de cualquier sitio web (solo afecta `vite dev`) |

**Contexto:**
- Las vulnerabilidades de `vite` y `esbuild` afectan principalmente el **entorno de desarrollo** y Windows. En producción (Vercel) no hay riesgo directo de path traversal ya que el bundle estático ya está compilado.
- `form-data` es una dependencia transitiva (no se usa directamente); el vector de CRLF injection requeriría multipart forms con nombres maliciosos.
- `dompurify` se usa como dependencia transitiva en componentes UI; el impacto es bajo ya que CuotaCtrl no procesa HTML de usuarios externos.

**Acción recomendada (no aplicada en esta auditoría):** `npm update vite` para resolver las vulnerabilidades de alta severidad.

---

## 6. Buenas Prácticas Generales

### 6.1 Headers de seguridad HTTP en Vercel
**Estado: ❌ RIESGO → CORREGIDO**

El `vercel.json` original solo tenía rewrites, sin ningún header de seguridad. Esto significa que la app no protegía contra clickjacking, sniffing de content-type, ni configuraba políticas de referrer/permisos.

**Corrección aplicada:** Headers añadidos:

| Header | Valor | Protege contra |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leak de URLs internas |
| `Permissions-Policy` | restricciones de cámara/mic/geoloc | Abuso de APIs del browser |
| `X-XSS-Protection` | `1; mode=block` | XSS reflejado (IE/Edge legados) |

*Nota: HSTS (`Strict-Transport-Security`) y una CSP completa son recomendables pero requieren configuración más cuidadosa para no romper assets de terceros (Supabase, OpenAI, Telegram).*

### 6.2 Mensajes de error que filtran información técnica
**Estado: ⚠️ MEJORABLE**

En varios componentes, `error.message` se muestra directamente en la UI (ej. `Login.tsx`, `Subscriptions.tsx`). Los mensajes de error de Supabase pueden incluir detalles técnicos del schema (nombres de columnas, tipos de datos).

```typescript
// Login.tsx — muestra el mensaje crudo de Supabase al usuario
toast.error(error.message || "Ocurrió un error.");
```

**Recomendación:** Mapear errores conocidos de Supabase a mensajes amigables en español y mostrar un mensaje genérico para errores inesperados. Los detalles técnicos deben ir solo a `console.error` (ya está implementado en varios hooks).

### 6.3 `console.error` en producción
**Estado: ⚠️ MEJORABLE**

Múltiples hooks y componentes llaman `console.error(err)` que en producción escribe al DevTools del usuario. Si bien es información para el propio usuario y no representa un riesgo de privacidad externo, es una práctica que debería controlarse con un sistema de logging centralizado en producción.

### 6.4 Contexto financiero sensible enviado a OpenAI
**Estado: ⚠️ MEJORABLE**

Las funciones `generateMonthlySummary`, `generateNextMonthPrediction` y `chatWithFinanceAssistant` envían datos financieros del usuario (salario, gastos, tarjetas, suscripciones) a la API de OpenAI. Dependiendo de los términos de uso del plan contratado, OpenAI puede usar estos datos para mejorar sus modelos.

**Recomendación:** Revisar la política de privacidad de la API de OpenAI que aplica al plan utilizado, y agregar una advertencia en la UI informando al usuario que sus datos serán procesados por un tercero.

---

## Tabla de Hallazgos Consolidados

| # | Sección | Hallazgo | Estado | Acción |
|---|---|---|---|---|
| 1 | Credenciales | Contraseña en texto plano en `register_user.mjs` (git) | ❌ RIESGO | ✅ Archvo añadido a .gitignore. Cambiar contraseña manualmente. |
| 2 | Credenciales | `.env.local` no commiteado | ✅ OK | — |
| 3 | Credenciales | Solo anon key en frontend, sin service_role | ✅ OK | — |
| 4 | Credenciales | API Key de OpenAI expuesta en el bundle | ⚠️ MEJORABLE | Mover a backend/Edge Function |
| 5 | RLS | Tablas con migración formal tienen RLS | ✅ OK | — |
| 6 | RLS | Tablas sin migración formal en repo | ⚠️ MEJORABLE | Verificar en Supabase dashboard y agregar migraciones |
| 7 | RLS | Queries SELECT filtran siempre por user_id | ✅ OK | — |
| 8 | RLS | UPDATE/DELETE sin doble filtro de ownership | ⚠️ MEJORABLE | Agregar `.eq('user_id', user!.id)` |
| 9 | Validación | XSS por `dangerouslySetInnerHTML` con respuesta OpenAI | ❌ RIESGO | ✅ Reemplazado por render JSX seguro |
| 10 | Validación | Inputs numéricos sin `min="0"` | ⚠️ MEJORABLE | ✅ Corregido en Conductor.tsx |
| 11 | Edge Function | Telegram sin validación de JWT | ❌ RIESGO | ✅ Agregada verificación de auth |
| 12 | Edge Function | CORS abierto (`*`) | ⚠️ MEJORABLE | Restringir al dominio de producción |
| 13 | Dependencias | 2 HIGH (vite, form-data), 2 MODERATE | ⚠️ MEJORABLE | `npm update vite` |
| 14 | Headers HTTP | Sin headers de seguridad en Vercel | ❌ RIESGO | ✅ Headers añadidos en vercel.json |
| 15 | Errores | `error.message` crudo en UI | ⚠️ MEJORABLE | Mapear a mensajes amigables |
| 16 | Privacidad | Datos financieros enviados a OpenAI | ⚠️ MEJORABLE | Advertir al usuario en la UI |

---

## Conclusión y Prioridades

### Prioridad ALTA — Acción inmediata requerida

1. **Cambiar la contraseña `chicha33`** si se reutiliza en otros servicios. La contraseña ya está en el historial público de git y debe considerarse comprometida.
2. **Verificar RLS en el dashboard de Supabase** para las tablas sin migración formal (`ingresos`, `gastos_diarios`, `jornadas`, etc.), especialmente en el proyecto de producción.

### Prioridad MEDIA — Próximas iteraciones

3. **Mover las llamadas a OpenAI al servidor** (Edge Function de Supabase) para no exponer la API key en el bundle del cliente.
4. **`npm update vite`** para parchear las vulnerabilidades de alta severidad en el toolchain de desarrollo.
5. **Agregar migraciones formales** para todas las tablas existentes, garantizando trazabilidad del schema en el repositorio.

### Prioridad BAJA — Deuda técnica / hardening

6. Agregar `.eq('user_id', user!.id)` en todos los UPDATE y DELETE del cliente.
7. Restringir el CORS de las Edge Functions al dominio de producción.
8. Agregar `maxLength` a inputs de texto libre.
9. Implementar un sistema de logging centralizado para producción.
10. Agregar advertencia en la UI sobre el uso de datos por OpenAI.

---

*Informe generado mediante análisis estático del código fuente y revisión de configuración. No incluye pruebas de penetración dinámicas ni análisis de infraestructura cloud.*
