# Configuración NextAuth.js (Auth.js) + Google + Supabase — FinanzasCL

Guía para la autenticación real con Google, persistencia en Supabase (PostgreSQL) vía Prisma, y pasos para producción.

---

## 1. Instalación

En la raíz del proyecto:

```bash
pnpm add next-auth @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

- **next-auth**: Auth.js v5 (compatible con App Router y route handlers).
- **@auth/prisma-adapter**: Persistencia de User, Account y Session en la BD (Prisma).
- **bcryptjs**: Hash de contraseñas para Credentials (registro y login con email/contraseña).

---

## 2. Archivos de la capa de autenticación

| Archivo | Rol |
|--------|-----|
| **`auth.ts`** (raíz) | Configuración central: PrismaAdapter, Google provider, sesión en BD, callbacks (p. ej. `session.user.id`). |
| **`app/api/auth/[...nextauth]/route.ts`** | API Route que exporta `GET` y `POST` para `/api/auth/*` (signin, signout, callback, etc.). |
| **`lib/db.ts`** | Instancia única de `PrismaClient` usada por el adapter. |
| **`lib/auth-context.tsx`** | Contexto que expone `useAuth()` usando `useSession`, `signIn`, `signOut` de NextAuth (sin localStorage). |
| **`types/next-auth.d.ts`** | Extensión de tipos para que `session.user` tenga `id`. |
| **`app/layout.tsx`** | Envuelve la app con `SessionProvider` (next-auth/react) y `AuthProvider`. |
| **`app/login/page.tsx`** | Login con formulario email/contraseña (Credentials) y botón "Ingresar con Google". |
| **`app/registro/page.tsx`** | Registro con formulario (Server Action) y botón "Crear cuenta con Google". |
| **`app/actions/register.ts`** | Server Action: validación Zod, verificación de email existente, hash bcrypt, creación de User en Prisma. |
| **Prisma `User.password`** | Campo opcional `password String?` para usuarios con Credentials; usuarios Google no lo tienen. |

---

## 3. Variables de entorno

Añade estas variables a tu archivo **`.env`** (además de `DATABASE_URL` y `DIRECT_URL` de Prisma/Supabase):

```env
# NextAuth.js (Auth.js)
AUTH_SECRET="un-string-largo-y-aleatorio-minimo-32-caracteres"

# Google OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
```

### Cómo obtener los valores

- **AUTH_SECRET**  
  Clave secreta para firmar cookies y tokens. Generar con:
  ```bash
  openssl rand -base64 32
  ```
  En producción usa un valor distinto y guárdalo en el gestor de secretos del hosting.

- **GOOGLE_CLIENT_ID** y **GOOGLE_CLIENT_SECRET**  
  1. [Google Cloud Console](https://console.cloud.google.com/) → Crear proyecto o elegir uno.  
  2. APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0.  
  3. Tipo: "Aplicación web".  
  4. Orígenes JavaScript autorizados: `http://localhost:3000` (desarrollo) y tu dominio en producción (ej. `https://tudominio.com`).  
  5. URIs de redirección autorizados:  
     - Desarrollo: `http://localhost:3000/api/auth/callback/google`  
     - Producción: `https://tudominio.com/api/auth/callback/google`  
  6. Copiar Client ID y Client Secret a `.env`.

---

## 4. Flujo de sesión

1. Usuario hace clic en "Ingresar con Google" → `signIn("google")`.  
2. NextAuth redirige a Google; el usuario autoriza.  
3. Google redirige a `/api/auth/callback/google`.  
4. NextAuth (con PrismaAdapter) crea o actualiza `User` y `Account` en Supabase y crea una `Session` en la tabla `Session`.  
5. Se establece una cookie de sesión; el cliente obtiene la sesión vía `useSession()`.  
6. `AuthProvider` mapea la sesión a `user` (con `id`) y expone `login`, `logout`, `isLoading` para no romper el resto de la app.

La sesión persiste en la base de datos (tabla `Session`); no se usa localStorage para auth.

---

## 5. Producción: qué revisar antes de desplegar

### 5.1 Variables de entorno

- **AUTH_SECRET**: Valor fuerte y único en producción (no reutilizar el de desarrollo).  
- **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET**: Mismos que en Google Cloud o credenciales específicas de producción.  
- **DATABASE_URL** / **DIRECT_URL**: URLs de Supabase de producción (connection pooling y direct).

### 5.2 Google Cloud Console

- Añadir el dominio de producción en "Orígenes JavaScript autorizados" (ej. `https://tudominio.com`).  
- Añadir en "URIs de redirección autorizados":  
  `https://tudominio.com/api/auth/callback/google`

### 5.3 NextAuth (auth.ts)

- **trustHost**: Ya está en `true` para que NextAuth confíe en el host en serverless/proxy.  
- **pages.signIn**: Actualmente `/login`; se puede cambiar si se usa otra ruta.  
- **session.maxAge** / **updateAge**: Ajustar si quieres sesiones más cortas o largas.

### 5.4 Cambiar de Google a otro proveedor (o añadir más)

En **`auth.ts`**:

1. Importar el proveedor: `import GitHub from "next-auth/providers/github"` (o el que corresponda).  
2. Añadirlo al array `providers`: `GitHub({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! })`.  
3. Añadir en `.env`: `GITHUB_ID`, `GITHUB_SECRET` (y configurar en GitHub OAuth App).  
4. En **`lib/auth-context.tsx`**, en `login`, permitir el nuevo proveedor: `signIn("github")` (y/o exponerlo en la UI).

El PrismaAdapter sigue siendo el mismo; User/Account/Session se rellenan según el proveedor.

### 5.5 Cambiar estrategia de sesión (JWT en lugar de BD)

Si en el futuro quieres sesiones JWT en lugar de base de datos:

1. En **`auth.ts`**: quitar `session: { strategy: "database", ... }` o poner `strategy: "jwt"`.  
2. El adapter puede seguir siendo PrismaAdapter (para User/Account); las sesiones no se guardarán en la tabla `Session`.  
3. Revisar la doc de Auth.js para callbacks con JWT (`jwt`, `session`).

---

## 6. Resumen de variables .env (desarrollo y producción)

```env
# Base de datos (Prisma / Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth.js
AUTH_SECRET="generar-con-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

En producción, usar valores de producción para todas y no commitear `.env`.

Opcional en producción: si el host no se detecta bien (proxy, dominio custom), puedes definir:

```env
AUTH_URL="https://tudominio.com"
```

Con `trustHost: true` en `auth.ts` suele bastar sin esta variable.
