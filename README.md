# 💳 Card Control

Card Control es una plataforma web moderna y dinámica diseñada para la **gestión integral de tarjetas, control de gastos financieros y suscripciones**. Desarrollada con React y Supabase, permite llevar un registro detallado del consumo por tarjeta, optimizando las finanzas personales mediante un panel de control consolidado y amigable.

## ✨ Características Principales

- **Gestión Multi-Tarjeta**: Administra diversas tarjetas de crédito y débito. Visualiza saldo, límite disponible y consumos de forma individual.
- **Registro de Gastos**: Carga manual de transacciones con opciones de categorización. Funciones de edición y borrado rápido (inline).
- **Importación Masiva**: Facilita la carga de gastos mediante la importación de datos de fuentes externas.
- **Control de Suscripciones**: Módulo dedicado para seguir pagos recurrentes (servicios de streaming, membresías, etc.) para evitar cargos inesperados.
- **Dashboard Estadístico**: Panel consolidado con gráficos interactivos que muestran la distribución y el estado financiero en tiempo real.
- **Autenticación Segura**: Sistema de inicio de sesión gestionado globalmente por Supabase, con manejo de sesiones protegidas.
- **Tema General**: Diseño Premium moderno con animaciones fluidas, y soporte para esquema de colores dinámicos (Claro/Oscuro).

## 🛠️ Stack Tecnológico

**Frontend**:
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI y UX**: [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Manejo de Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) para validación estricta de esquemas.
- **Gráficos**: [Recharts](https://recharts.org/)
- **Enrutamiento**: [React Router](https://reactrouter.com/)
- **Peticiones/Estados**: [React Query (TanStack)](https://tanstack.com/query/latest)

**Backend as a Service (BaaS)**:
- [Supabase](https://supabase.com/): Provee Autenticación, Base de datos PostgreSQL (almacenando datos persistentes) y almacenamiento seguro (Storage).

## 🚀 Cómo Empezar Localmente

Sigue estos pasos rápidos para levantar el entorno de desarrollo en tu máquina local.

### Prerrequisitos
- [Node.js](https://nodejs.org/) instalado (versión 18 o superior recomendada).
- Una cuenta y proyecto disponible en [Supabase](https://supabase.com/).

### Instrucciones de Instalación

1. Clona/Descarga el repositorio localmente y navega a la carpeta raíz del proyecto:
   ```bash
   cd my-card-control
   ```

2. Instala las dependencias requeridas del proyecto (puedes usar `npm`, `yarn`, o `bun`):
   ```bash
   npm install
   ```

3. Configura las variables de entorno de la base de datos:
   - Usa el archivo base `.env.example` como guía.
   - Crea tú mismo un archivo `.env.local` en la raíz del proyecto y añade tus credenciales proporcionadas por tu proyecto de Supabase:
     ```env
     VITE_SUPABASE_URL=tu_url_de_supabase_aqui
     VITE_SUPABASE_ANON_KEY=tu_anon_key_publica_aqui
     ```

4. Inicia el servidor local de desarrollo interactivo:
   ```bash
   npm run dev
   ```
   La aplicación se procesará e iniciará inmediatamente en el navegador, por defecto suele ser `http://localhost:8080` (o el puerto que vite asigne como `5173`).

## 📁 Arquitectura / Estructura del Código

El código de los módulos principales que manejan la aplicación se localiza dentro de la carpeta `/src`:

- `components/`: Bloques de interfaz reutilizables (Botones, Selectores, Alertas de Diálogo modales con Shadcn UI).
- `pages/`: Arquitectura principal de las vistas de la aplicación (`Cards.tsx`, `Index.tsx`, `Login.tsx`, `Settings.tsx`).
- `hooks/`: Custom hooks de React aislando la lógica asíncrona compartida (ej. consultas e integraciones directas a Supabase).
- `lib/`: Archivos universales de utilidades (como los clientes de acceso al backend o utilidades integradas de Tailwind).
- `test/`: Entorno de evaluación de código para correr validaciones y pruebas automáticas con herramientas como Playwright y Vitest.

## 📜 Scripts de Terminal Disponibles

Desde una consola puedes ejecutar las siguientes acciones:
- `npm run dev` - Arranca un mini-servidor local con Hot-Module-Replacement para pruebas instantáneas mientras programas.
- `npm run build` - Transpila y estructura todos los archivos listos para un despliegue optimizado en producción.
- `npm run lint` - Analiza estáticamente tu código ayudando a detectar potenciales errores.
- `npm run test` - Ejecuta todas las pruebas para asegurar la calidad de los cambios nuevos.
