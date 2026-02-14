# Configuración Prisma + Supabase — FinanzasCL

Guía paso a paso para la capa de persistencia con PostgreSQL (Supabase).

---

## 1. Instalación de dependencias

En la raíz del proyecto:

```bash
pnpm add prisma @prisma/client
pnpm add -D ts-node
```

- `prisma`: CLI (migraciones, generate, etc.).
- `@prisma/client`: Cliente generado para usar en el código.
- `ts-node`: Dev dependency para scripts TypeScript con Prisma (opcional, útil para seeds).

---

## 2. Inicialización de Prisma

Si no existiera la carpeta `prisma/` ni el schema:

```bash
npx prisma init
```

En este proyecto **ya está creado** `prisma/schema.prisma` con el esquema completo; no es necesario volver a ejecutar `init` si solo quieres usar el schema actual.

---

## 3. Variables de entorno

Crea o edita el archivo **`.env`** en la raíz del proyecto (no subas este archivo a Git).

### Contenido exacto para Supabase

Supabase te da dos URLs en **Project Settings → Database**:

- **Connection string (URI)** → para `DATABASE_URL` (modo *connection pooling*, recomendado en serverless).
- **Direct connection** → para `DIRECT_URL` (usado por Prisma para migraciones y para ciertas operaciones que no van por el pool).

Pon en tu `.env`:

```env
# Prisma - Supabase PostgreSQL
# Usar "Transaction" mode en Supabase (Connection pooling) para DATABASE_URL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Reemplaza:

- `[PROJECT-REF]`: referencia del proyecto (ej. `abcdefghijklmnop`).
- `[YOUR-PASSWORD]`: contraseña de la base de datos.
- `[REGION]`: región (ej. `us-east-1`).

Ejemplo ficticio:

```env
DATABASE_URL="postgresql://postgres.abcdefgh:MiPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefgh:MiPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

- **Puerto 6543** → connection pooler (para `DATABASE_URL` en entornos serverless).
- **Puerto 5432** → conexión directa (para `DIRECT_URL`).

En el dashboard de Supabase puedes copiar ambas URLs ya armadas.

---

## 4. Subir el esquema a Supabase

Después de tener `.env` con `DATABASE_URL` y `DIRECT_URL`:

### Opción A: `db push` (rápido, sin historial de migraciones)

```bash
npx prisma db push
```

- Crea o actualiza tablas en la BD para que coincidan con `prisma/schema.prisma`.
- No genera archivos de migración.
- Útil para desarrollo o para el primer deploy.

### Opción B: Migraciones versionadas (`migrate dev`)

```bash
npx prisma migrate dev --name init
```

- Crea la carpeta `prisma/migrations` y la primera migración.
- Aplica la migración en la BD.
- Sirve para mantener historial y entornos compartidos.

Para producción más adelante:

```bash
npx prisma migrate deploy
```

---

## 5. Generar el cliente Prisma

Cada vez que cambies `schema.prisma`:

```bash
npx prisma generate
```

Genera/actualiza el cliente en `node_modules/.prisma/client` para usarlo en el código (por ejemplo en `lib/db.ts` o en API routes).

---

## Resumen de comandos

| Acción | Comando |
|--------|--------|
| Instalar deps | `pnpm add prisma @prisma/client` y `pnpm add -D ts-node` |
| Inicializar (si hiciera falta) | `npx prisma init` |
| Definir `.env` | `DATABASE_URL` + `DIRECT_URL` (ver arriba) |
| Aplicar schema a Supabase | `npx prisma db push` o `npx prisma migrate dev --name init` |
| Generar cliente | `npx prisma generate` |

El archivo `lib/types.ts` se mantiene como referencia; la fuente de verdad del modelo de datos pasa a ser `prisma/schema.prisma`.
