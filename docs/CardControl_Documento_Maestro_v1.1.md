# 💳 Card Control (CuotaCtrl)
**Documento Maestro · v1.1**

> Control inteligente de gastos en tarjeta de crédito

---

## 1. Visión General

| Campo | Detalle |
|---|---|
| Nombre | Card Control (CuotaCtrl) |
| Versión | 1.1 — Prototipo funcional |
| Plataforma | Web (browser) — responsive desktop y mobile |
| Stack | React 18 · Vite · TypeScript · Tailwind CSS · Shadcn UI · Supabase · Vercel |
| Autor | Tano |

### Problema
Usar tarjetas de crédito en cuotas hace difícil saber cuánto dinero realmente se va a deber el mes siguiente. Cuando hay múltiples compras en cuotas activas, es muy fácil perder de vista el total comprometido y terminar gastando de más.

### Solución
Card Control es una aplicación web que centraliza todas las tarjetas y compras en cuotas del usuario. Calcula automáticamente la deuda proyectada para el próximo resumen, muestra cuánto espacio de presupuesto queda disponible y alerta cuando el usuario se acerca a su límite o cuando una cuota larga está por terminar. Incluye además un módulo de suscripciones para controlar servicios recurrentes.

---

## 2. Funcionalidades del MVP

### 2.1 Dashboard Principal
- Cards por tarjeta: nombre, banco, deuda próximo mes, espacio disponible, barra de progreso
- Sección "Cuotas que terminan pronto" (1–2 cuotas restantes)
- Sección "Suscripciones próximas" (cobros en los próximos 7 días)
- Gráfico de gastos por categoría (pie chart)
- Panel de alertas al tope si hay presupuesto superado o cerca del límite

### 2.2 Gestión de Tarjetas
- Agregar, editar y eliminar tarjetas
- Configurar: nombre, banco, límite del banco, presupuesto propio, día de cierre y vencimiento
- Visualización tipo tarjeta física con gradiente y color personalizable

### 2.3 Carga de Gastos
- Manual: formulario con tarjeta, descripción, monto, cuotas, fecha y categoría
- OCR: foto del resumen físico → revisión y confirmación (UI simulada en v1.0, real en v1.1)
- Importación: PDF o CSV del resumen bancario → revisión y confirmación (idem)

### 2.4 Módulo de Suscripciones
- Lista de suscripciones con: nombre, monto, tarjeta, fecha de próximo cobro, días restantes, estado
- Badge de color según urgencia: verde (+7 días), naranja (≤3 días), rojo (hoy)
- Totalizador "Total mensual en suscripciones"
- Formulario: nombre, monto, tarjeta, fecha cobro, periodicidad (mensual/anual), estado

### 2.5 Lógica de Proyección
- Deuda próximo mes: suma de cuotas activas que caen en el próximo resumen
- Cuotas pendientes: `cuotas_total − cuota_actual` por cada gasto
- Espacio disponible: `presupuesto_propio − cuotas proyectadas`
- Proyección mes a mes: vista de los próximos 6 meses por tarjeta

### 2.6 Sistema de Alertas
- Alerta naranja cuando el espacio disponible cae por debajo del % configurable (default 80%)
- Alerta roja cuando el presupuesto ya está superado
- Badge "Última cuota" cuando un gasto tiene solo 1 cuota restante
- Alerta de suscripción X días antes del cobro (configurable, default 3 días)
- % de alerta configurable desde /configuracion

---

## 3. Modelo de Datos (Supabase)

### 3.1 Tabla: `tarjetas`

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| user_id | uuid (FK) | Referencia a auth.users |
| nombre | text | Ej: "Visa Santander" |
| banco | text | Nombre del banco emisor |
| limite_banco | numeric | Límite otorgado por el banco |
| presupuesto_propio | numeric | Límite personal del usuario |
| dia_cierre | int | Día del mes de cierre del resumen |
| dia_vencimiento | int | Día del mes de vencimiento |
| color | text | Color hex para identificar la tarjeta |

### 3.2 Tabla: `gastos`

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| tarjeta_id | uuid (FK) | Referencia a tarjetas |
| descripcion | text | Descripción del gasto |
| monto_total | numeric | Monto total de la compra |
| cuotas_total | int | Cantidad total de cuotas (1 = débito) |
| cuota_actual | int | Cuota en la que se está actualmente |
| fecha_primera_cuota | date | Fecha de acreditación de la cuota 1 |
| monto_cuota | numeric | monto_total ÷ cuotas_total |
| categoria | text | Enum: Alimentación, Transporte, etc. |

### 3.3 Tabla: `suscripciones`

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| user_id | uuid (FK) | Referencia a auth.users |
| tarjeta_id | uuid (FK) | Tarjeta en la que se cobra |
| nombre | text | Ej: "Netflix", "ChatGPT Plus" |
| monto | numeric | Monto del cobro |
| fecha_proximo_cobro | date | Próxima fecha de renovación |
| periodicidad | text | mensual / anual |
| estado | text | activa / cancelada |

### 3.4 Categorías disponibles

`🍔 Alimentación` · `🚗 Transporte` · `👕 Indumentaria` · `💻 Tecnología` · `❤️ Salud` · `🎬 Entretenimiento` · `📡 Servicios` · `📦 Otros`

---

## 4. Pantallas y Rutas

| Ruta | Pantalla | Descripción |
|---|---|---|
| `/` | Dashboard General | Resumen de tarjetas, suscripciones próximas, alertas y gráfico |
| `/tarjetas` | Gestión de Tarjetas | Lista con opción de agregar, editar y eliminar |
| `/tarjetas/[id]` | Detalle de Tarjeta | Gastos activos, proyección 6 meses y cuotas pendientes |
| `/gastos/nuevo` | Carga Manual | Formulario de nuevo gasto con cuotas y categoría |
| `/gastos/importar` | Importación | Subir foto o archivo → revisar → confirmar gastos |
| `/suscripciones` | Suscripciones | Lista, totalizador mensual y gestión de servicios recurrentes |
| `/configuracion` | Configuración | Presupuestos, % de alerta, días de anticipación y perfil |
| `/login` | Autenticación | Login y registro con email/contraseña vía Supabase Auth |

---

## 5. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| Estilos | Tailwind CSS 3 + tailwindcss-animate |
| Componentes UI | Shadcn UI / Radix UI |
| Animaciones | Framer Motion |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| Enrutamiento | React Router DOM 6 |
| Estado async | TanStack React Query 5 |
| Íconos | Lucide React |
| Base de datos | Supabase (PostgreSQL + Row Level Security) |
| Autenticación | Supabase Auth (email/contraseña) |
| Deploy | Vercel |
| Testing | Vitest + Playwright |

---

## 6. Prompt para Lovable (seguimiento — módulo suscripciones)

```
Agregá un módulo de Suscripciones a la aplicación CuotaCtrl ya existente.
Debe integrarse de forma consistente con el diseño actual
(fondo #0F172A, cards #1E293B, accent #1A56DB, Lucide React, sidebar).

CAMBIOS EN EL DASHBOARD ( / )
Agregá una nueva sección llamada "Suscripciones próximas" que muestre
las suscripciones que se cobran en los próximos 7 días, con: nombre,
monto, tarjeta y días restantes.

NUEVA RUTA: /suscripciones
Agregá el link en el sidebar con ícono Bell o CreditCard de Lucide.
La pantalla debe tener:
- Cards por suscripción: nombre, ícono/emoji, monto, tarjeta, fecha
  próximo cobro, días restantes (badge verde >7 días, naranja ≤3, rojo hoy),
  estado Activa/Cancelada
- Totalizador: "Total mensual en suscripciones: $X.XXX"
- Botón para agregar nueva suscripción

Formulario agregar/editar:
- Nombre, monto, tarjeta (selector), fecha próximo cobro,
  periodicidad (Mensual/Anual), estado (Activa/Cancelada)

ALERTAS
- Panel del dashboard: alerta cuando una suscripción se cobra en ≤3 días
- En /configuracion: campo "Alertar suscripciones con X días de anticipación"
  (default 3, rango 1–7)
- En /suscripciones: banner "Resumen del mes" con total de cobros del mes en curso

DATOS DE EJEMPLO
Cargar al menos 5 suscripciones: Netflix, Spotify, ChatGPT Plus, Claude Pro
y Disney+, con fechas distintas y vinculadas a las tarjetas de ejemplo.
Que al menos una esté a 2 días de cobrar para ver la alerta en acción.
```

---

## 7. Roadmap

### v1.0 — Prototipo completado en Lovable ✅
- Autenticación básica (Supabase Auth)
- Gestión de tarjetas de crédito
- Carga manual de gastos en cuotas
- Importación OCR / PDF / CSV (UI simulada)
- Dashboard con proyección y alertas
- Módulo de suscripciones
- Configuración de presupuesto y % de alerta
- Datos de ejemplo precargados
- Clonado en Antigravity/Cursor — listo para desarrollo

### v1.1 — Integración real (en curso)
- Conectar Supabase real (tablas + RLS)
- Activar autenticación real
- Reemplazar datos mock por TanStack Query + Supabase
- OCR real con Tesseract.js
- Importación PDF/CSV real con pdf-parse y Papa Parse
- Deploy en Vercel

### v2.0 — Avanzado
- Notificaciones por email (Resend)
- Exportar resumen mensual a PDF
- Historial de meses cerrados
- Integración con APIs bancarias (cuando estén disponibles en Argentina)
- App mobile con React Native / Expo

---

## 8. Próximos Pasos en Antigravity / Cursor

### 8.1 Conectar Supabase real
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Crear las tablas `tarjetas`, `gastos` y `suscripciones` con los campos del modelo de datos
3. Activar Row Level Security (RLS) en todas las tablas
4. Crear `.env.local` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```
5. Reemplazar el estado local/mock por hooks que llamen a Supabase vía TanStack Query

### 8.2 Activar autenticación
1. Habilitar Auth por email en el panel de Supabase
2. Conectar el formulario de login a `supabase.auth.signInWithPassword` y `signUp`
3. Agregar protección de rutas: redirigir a `/login` si no hay sesión activa
4. Vincular `user_id` de `auth.users` a las tablas `tarjetas` y `suscripciones`

### 8.3 Implementar OCR real
1. Instalar: `npm install tesseract.js`
2. En `/gastos/importar`, procesar la foto con `Tesseract.recognize()`
3. Parsear el texto para extraer descripción, monto y cuotas
4. Mostrar resultados en la tabla de revisión ya existente

### 8.4 Importación PDF / CSV real
1. Instalar: `npm install papaparse pdf-parse`
2. Para CSV: usar `Papa.parse()` sobre el archivo subido
3. Para PDF: usar `pdf-parse` para extraer el texto del resumen bancario
4. Normalizar los datos al formato de la tabla `gastos`

### 8.5 Deploy en Vercel
1. Conectar el repositorio GitHub (FDN-app) a Vercel
2. Configurar las variables de entorno en el panel de Vercel
3. Cada push a `main` dispara un deploy automático

---

*Card Control (CuotaCtrl) — Documento Maestro v1.1 — Uso personal*
