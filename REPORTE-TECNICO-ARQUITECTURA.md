# Reporte Técnico de Arquitectura — FinanzasCL

**Fecha:** Febrero 2026  
**Objetivo:** Análisis del código actual para entender el punto de partida y los puntos de extensión (Base de Datos y Asistente IA).

---

## 1. Tech Stack Actual

| Área | Tecnología |
|------|------------|
| **Lenguaje** | TypeScript 5.x |
| **Framework Frontend** | Next.js 16.0.10 (App Router) |
| **Framework Backend** | No existe backend propio; es una SPA con persistencia en cliente |
| **Base de Datos** | No hay BD configurada. Toda la persistencia es **localStorage** en el navegador |
| **UI / Componentes** | React 19.2, Radix UI (shadcn/ui estilo "new-york"), Tailwind CSS 4.x |
| **Formularios / Validación** | react-hook-form, @hookform/resolvers, Zod |
| **Gráficos** | Recharts |
| **Utilidades** | date-fns, lucide-react (iconos), next-themes (tema claro/oscuro) |
| **Otros** | Vercel Analytics, pnpm como gestor de paquetes |

**Resumen:** Aplicación Next.js del lado del cliente (CSR donde aplica), sin API ni base de datos; ideal como prototipo o punto de partida para añadir backend y persistencia real.

---

## 2. Estructura del Proyecto

```
app-finanzas/
├── app/                    # App Router de Next.js
│   ├── layout.tsx          # Layout raíz: fuentes, metadata, ThemeProvider, AuthProvider, Toaster
│   ├── template.tsx        # Template: ProtectedRoute, DataProvider, sidebar + TopBar para rutas autenticadas
│   ├── page.tsx            # Dashboard (/)
│   ├── globals.css         # Estilos globales + variables Tailwind
│   ├── login/page.tsx      # Login (público)
│   ├── registro/page.tsx   # Registro (público)
│   ├── movimientos/        # Listado y gestión de movimientos
│   ├── presupuestos/       # Presupuestos por categoría/mes
│   ├── tarjetas/           # Tarjetas de crédito
│   ├── metas/              # Metas de ahorro
│   ├── conciliacion/       # Conciliación mensual
│   ├── categorias/         # Categorías y cuentas
│   └── configuracion/      # Configuración de la app
├── components/             # Componentes React
│   ├── app-sidebar.tsx     # Menú lateral (rutas de la app)
│   ├── top-bar.tsx         # Barra superior
│   ├── protected-route.tsx # HOC que redirige a /login si no hay usuario
│   ├── theme-provider.tsx  # Proveedor de tema claro/oscuro
│   ├── *-dialog.tsx        # Diálogos para CRUD (movimiento, categoría, cuenta, meta, presupuesto, tarjeta)
│   ├── kpi-card.tsx        # Tarjeta KPI del dashboard
│   └── ui/                 # Componentes shadcn (Button, Card, Input, etc.)
├── lib/                    # Lógica de negocio y estado
│   ├── types.ts            # Tipos e interfaces de dominio
│   ├── auth-context.tsx    # Contexto de autenticación (login/register/logout)
│   ├── data-context.tsx    # Contexto de datos (CRUD de todas las entidades)
│   ├── initial-data.ts     # Categorías y cuentas iniciales para nuevos usuarios
│   ├── mock-data.ts        # Datos de demostración (movimientos, presupuestos, etc.)
│   ├── utils-finance.ts    # Cálculos financieros (formatCLP, saldos, presupuestos, flujo diario)
│   └── utils.ts            # Utilidades generales (cn, etc.)
├── hooks/
│   └── use-toast.ts        # Hook para toasts (sonner)
├── public/                 # Assets estáticos (iconos, placeholders)
├── scripts/
│   └── reset-system.ts     # Limpieza de localStorage (usuarios y datos)
├── styles/
│   └── globals.css         # (posible duplicado o legacy)
├── package.json
├── next.config.mjs
├── tsconfig.json           # Path alias: @/* -> ./*
├── postcss.config.mjs      # Tailwind PostCSS
└── components.json         # Configuración shadcn/ui
```

**Resumen:**  
- **app:** Rutas y páginas; `layout` y `template` definen providers y shell (sidebar + barra superior) para rutas protegidas.  
- **components:** UI reutilizable y diálogos de formularios.  
- **lib:** Fuente única de verdad para tipos, autenticación y datos; toda la “persistencia” está en contextos que leen/escriben `localStorage`.

---

## 3. Modelos de Datos

Definidos en **`lib/types.ts`**. No hay ORM ni tablas; son tipos TypeScript que se serializan a JSON en `localStorage`.

### Tipos enumerados (uniones de literales)

- `TipoMovimiento`: `"Ingreso" | "Gasto" | "Transferencia"`
- `TipoGasto`: `"Fijo" | "Variable" | "Ocasional"`
- `MetodoPago`: `"Débito" | "Crédito" | "Efectivo" | "Transferencia"`
- `EstadoConciliacion`: `"Pendiente" | "Conciliado"`
- `EstadoMeta`: `"Activa" | "Completada"`
- `TipoCategoria`: `"Gasto" | "Ingreso" | "Ambos"`

### Interfaces de dominio

| Interface | Descripción | Campos relevantes |
|-----------|-------------|-------------------|
| **Movimiento** | Transacción (ingreso, gasto o transferencia) | id, fecha (YYYY-MM-DD), descripcion, tipoMovimiento, categoriaId, subcategoria?, tipoGasto?, cuentaOrigenId?, cuentaDestinoId?, tarjetaCreditoId?, metodoPago, montoCLP, cuotas?, etiquetas?, notas?, estadoConciliacion, mesConciliacion (YYYY-MM) |
| **Cuenta** | Cuenta bancaria o efectivo | id, nombre, banco, saldoInicialMes, saldoFinalMesDeclarado?, saldoCalculado, activo |
| **TarjetaCredito** | Tarjeta de crédito | id, nombre, banco, cupoTotal, cupoDisponible, fechaFacturacion/fechaPago (día del mes), tasaInteresMensual, deudaActual, deudaFacturada, deudaNoFacturada |
| **MetaAhorro** | Meta de ahorro | id, nombre, objetivoCLP, fechaObjetivo, aporteMensualSugerido, acumuladoCLP, cuentaDestinoId, estado |
| **Categoria** | Categoría de movimiento | id, nombre, tipo (Gasto/Ingreso/Ambos), color, icono |
| **Presupuesto** | Presupuesto por categoría y mes | id, categoriaId, mes (YYYY-MM), montoPresupuestadoCLP |
| **User** | Usuario de la app | id, email, name, createdAt |
| **UserData** | Datos financieros de un usuario | movimientos, categorias, cuentas, tarjetasCredito, metasAhorro, presupuestos |

Los datos por usuario se guardan bajo la clave `finanzas-cl-data-{userId}` en `localStorage`; los usuarios registrados en `finanzas-cl-users` (email -> { password, user }).

---

## 4. Autenticación

Hay una implementación completa de **login y registro** solo en cliente, sin backend.

- **Archivos:**  
  - **`lib/auth-context.tsx`:** `AuthProvider` con `user`, `login`, `register`, `logout`, `isLoading`.  
  - **`app/login/page.tsx`:** Formulario de login (email + contraseña).  
  - **`app/registro/page.tsx`:** Formulario de registro (nombre, email, contraseña, confirmación).  
  - **`components/protected-route.tsx`:** Envuelve el contenido; si no hay `user` y ya se resolvió la carga, redirige a `/login`.

- **Flujo:**  
  - Usuarios en `localStorage` bajo `finanzas-cl-users` (email → `{ password, user }`).  
  - Sesión actual en `finanzas-cl-user` (objeto `User`).  
  - Login/registro son síncronos contra ese objeto; no hay JWT ni cookies ni API.

- **Protección de rutas:**  
  - En **`app/template.tsx`** se decide si la ruta es pública (`/login`, `/registro`).  
  - El resto de rutas se renderizan dentro de `<ProtectedRoute><DataProvider>...</DataProvider></ProtectedRoute>`.

**Conclusión:** Autenticación funcional para prototipo; para producción habría que sustituir por backend (API + BD) y, si aplica, sesiones o JWT.

---

## 5. Puntos de Extensión

### 5.1 Conexión a Base de Datos y persistencia

Hoy **no existe** capa de servidor ni BD. Toda la lectura/escritura pasa por:

- **`lib/data-context.tsx`**  
  - Carga inicial: `localStorage.getItem(\`finanzas-cl-data-${user.id}\`)` (y fallback a `mock-data`).  
  - Cualquier mutación (add/update/delete de movimientos, categorías, cuentas, tarjetas, metas, presupuestos) actualiza estado en React y luego persiste con `localStorage.setItem(...)` en un `useEffect`.

**Dónde introducir la lógica de Base de Datos:**

1. **`lib/data-context.tsx`**  
   - Reemplazar lectura/escritura a `localStorage` por llamadas a **API routes** o a un **servicio de backend** (p. ej. funciones que llamen a Prisma/Drizzle/TypeORM contra PostgreSQL/MySQL).  
   - Mantener la misma interfaz (`useData()`, mismos métodos CRUD) para no romper la UI.

2. **Nueva capa opcional:**  
   - **`lib/api.ts`** o **`lib/db/`**: módulos que encapsulen llamadas HTTP a `app/api/...` o acceso directo a BD si el contexto se ejecutara en servidor.  
   - Las **API routes** de Next.js irían en **`app/api/`** (hoy no existe esta carpeta). Ejemplos: `app/api/movimientos/route.ts`, `app/api/categorias/route.ts`, etc., consumidas desde `data-context.tsx`.

3. **Autenticación y datos por usuario:**  
   - **`lib/auth-context.tsx`:** Sustituir lectura/escritura en `localStorage` por login/registro contra backend y guardar token o sesión.  
   - Ajustar `DataProvider` para que las peticiones de datos incluyan el usuario (token o cookie) y el backend filtre por `userId`.

**Resumen:** El punto natural para “conectar a BD” es **`lib/data-context.tsx`** (y opcionalmente un módulo `lib/api.ts` o `lib/db/`). La creación de **`app/api/`** con rutas por recurso sería el siguiente paso para un backend en Next.js.

---

### 5.2 Nueva ruta para el “Asistente IA”

La navegación lateral está definida en **`components/app-sidebar.tsx`** en el array `menuItems`. Las rutas actuales son:

- `/` — Dashboard  
- `/movimientos` — Movimientos  
- `/presupuestos` — Presupuestos  
- `/tarjetas` — Tarjetas de Crédito  
- `/metas` — Metas de Ahorro  
- `/conciliacion` — Conciliación Mensual  
- `/categorias` — Categorías & Cuentas  
- `/configuracion` — Configuración  

**Dónde añadir la funcionalidad del Asistente IA:**

1. **Nueva ruta:**  
   - Crear **`app/asistente/page.tsx`** (o `app/ia/page.tsx`, según naming).  
   - Será una página más del App Router, protegida por el mismo `template.tsx` (ProtectedRoute + DataProvider).

2. **Menú:**  
   - En **`components/app-sidebar.tsx`**, añadir un ítem en `menuItems`, por ejemplo:  
     `{ href: "/asistente", label: "Asistente IA", icon: Bot }`  
     (o el icono que se prefiera de `lucide-react`).

3. **Lógica del asistente:**  
   - La página puede usar `useData()` y `useAuth()` para acceder a datos y usuario.  
   - Si el asistente va a llamar a un LLM o a un servicio externo, conviene crear **`app/api/asistente/route.ts`** (o similar) para no exponer API keys en el cliente y enviar desde el servidor el contexto necesario (resúmenes de movimientos, metas, etc., derivados de los tipos en `lib/types.ts`).

**Resumen:**  
- **Ruta:** Crear `app/asistente/page.tsx`.  
- **Menú:** Modificar `components/app-sidebar.tsx` (añadir entrada “Asistente IA”).  
- **Backend opcional:** `app/api/asistente/route.ts` para llamadas a IA con datos del usuario.

---

## Resumen Ejecutivo

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript, sin backend ni BD; persistencia 100% en `localStorage`.  
- **Estructura:** App Router por funcionalidad, contextos en `lib` para auth y datos, componentes UI en `components` (shadcn).  
- **Modelos:** Definidos en `lib/types.ts` (Movimiento, Cuenta, TarjetaCredito, MetaAhorro, Categoria, Presupuesto, User, UserData).  
- **Autenticación:** Login/registro en cliente vía `lib/auth-context.tsx` y rutas públicas en `template.tsx`; rutas protegidas con `ProtectedRoute`.  
- **Extensión BD:** Centralizar cambios en **`lib/data-context.tsx`** (y opcionalmente `lib/api.ts` o `lib/db/` y **`app/api/`**).  
- **Extensión Asistente IA:** Nueva página **`app/asistente/page.tsx`**, entrada en **`components/app-sidebar.tsx`** y, si aplica, **`app/api/asistente/route.ts`**.

Con esto un colega puede entender el estado actual del proyecto y dónde enganchar la base de datos y la ruta del Asistente IA sin escribir código nuevo en este reporte.
