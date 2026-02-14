# API REST v1 y arquitectura (Service Layer + App Móvil)

Documentación de la configuración realizada: capa de servicios, refactor de Server Actions y endpoints REST para consumo desde una app móvil.

---

## Parte 1 — Lo que hicimos (configuración en el proyecto)

### 1.1 Arquitectura: Service Layer

Se extrajo toda la lógica de negocio y acceso a datos (Prisma) a una capa de servicios reutilizable:

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| **Servicio** | `lib/services/finance.service.ts` | Lógica de negocio y Prisma. Funciones puras: reciben `userId` + datos y devuelven resultados. Sin `auth()`, sin `revalidatePath`. |
| **Web (Server Actions)** | `app/actions/finance.ts` | Solo para la web: 1) `auth()`, 2) validación (Zod), 3) llamada al servicio, 4) `revalidatePath`, 5) retorno al frontend. |
| **API REST (móvil)** | `app/api/v1/*` | Solo para la API: 1) obtener usuario (header `x-user-id`), 2) validación, 3) llamada al mismo servicio, 4) respuesta JSON. |

Ventaja: la misma lógica se usa desde la web (Next.js) y desde la app móvil (HTTP), sin duplicar código.

---

### 1.2 Estructura de la API v1

```
app/api/v1/
├── movimientos/
│   ├── route.ts           → GET (lista), POST (crear)
│   └── [id]/route.ts      → GET (uno), PUT (actualizar), DELETE (eliminar)
├── cuentas/
│   ├── route.ts           → GET, POST
│   └── [id]/route.ts      → GET, PUT, DELETE
└── categorias/
    ├── route.ts           → GET, POST
    └── [id]/route.ts      → GET, PUT, DELETE
```

Cada ruta:

- Obtiene el usuario con el header **`x-user-id`** (provisional; ver sección móvil).
- Valida el body con Zod cuando aplica (POST/PUT).
- Llama a funciones de `@/lib/services/finance.service`.
- Devuelve JSON con formato `{ data: ... }` en éxito.
- En errores: `try/catch` → 500 con mensaje en JSON; errores de validación o negocio → 400.

---

### 1.3 Autenticación actual (provisional)

- **Web:** sigue usando sesión con NextAuth (`auth()`, cookies).
- **API (móvil):** no hay cookies, así que por ahora el `userId` se toma de un header:
  - Header: **`x-user-id`** (valor = id del usuario en la BD).
  - En cada archivo de ruta hay un comentario:  
    `// TODO: Implementar validación de Token JWT (app móvil sin cookies de sesión)`.

Cuando se implemente login por token en la app móvil, se sustituirá la lectura de `x-user-id` por la validación del JWT y la extracción del `userId` del payload.

---

### 1.4 Resumen de archivos tocados

| Archivo | Cambio |
|---------|--------|
| `lib/services/finance.service.ts` | Creado. Toda la lógica Prisma y tipos (getDashboardData, createMovimiento, CRUD cuentas/categorías, etc.). |
| `app/actions/finance.ts` | Refactorizado: solo auth, Zod, llamada al servicio, revalidatePath, return. Sin Prisma. |
| `app/api/v1/movimientos/route.ts` | GET, POST. Respuestas con `{ data: ... }`, try/catch, header `x-user-id`. |
| `app/api/v1/movimientos/[id]/route.ts` | GET, PUT, DELETE por id. |
| `app/api/v1/cuentas/route.ts` | GET, POST. |
| `app/api/v1/cuentas/[id]/route.ts` | GET, PUT, DELETE. |
| `app/api/v1/categorias/route.ts` | GET, POST. |
| `app/api/v1/categorias/[id]/route.ts` | GET, PUT, DELETE. |

---

## Parte 2 — Para la app móvil (qué tener en cuenta)

### 2.1 Base URL

En desarrollo:

```
http://localhost:3000/api/v1
```

En producción, reemplazar por la URL base de tu despliegue (por ejemplo `https://tu-dominio.com/api/v1`).

---

### 2.2 Autenticación (provisional)

En **todas** las peticiones hay que enviar el header:

```
x-user-id: <id-del-usuario>
```

El `<id-del-usuario>` es el mismo que se usa en la base de datos (por ejemplo el `id` de la tabla `User`).  
Mientras no haya JWT, la app móvil debe obtener este id tras un login propio (por ejemplo login por email/contraseña que devuelva el `userId`) y guardarlo para enviarlo en cada request.

**Próximo paso:** implementar emisión y validación de **JWT** (o sesión por token) y reemplazar este header por algo como:

```
Authorization: Bearer <token>
```

El servidor validará el token y obtendrá el `userId` internamente; el comentario `TODO: Implementar validación de Token JWT` en el código indica dónde hacer ese cambio.

---

### 2.3 Endpoints y métodos

| Recurso | GET (lista/uno) | POST (crear) | PUT (actualizar) | DELETE |
|---------|------------------|--------------|------------------|--------|
| **Movimientos** | `GET /movimientos` → lista + balance<br>`GET /movimientos/:id` → uno | `POST /movimientos` | `PUT /movimientos/:id` | `DELETE /movimientos/:id` |
| **Cuentas** | `GET /cuentas`<br>`GET /cuentas/:id` | `POST /cuentas` | `PUT /cuentas/:id` | `DELETE /cuentas/:id` |
| **Categorías** | `GET /categorias`<br>`GET /categorias/:id` | `POST /categorias` | `PUT /categorias/:id` | `DELETE /categorias/:id` |

Todas las URLs son relativas a la base de la API (por ejemplo `https://tu-dominio.com/api/v1`).

---

### 2.4 Formato de respuestas

- **Éxito (200):** el cuerpo viene envuelto en `data`:

  ```json
  { "data": { ... } }
  ```

  En listas, `data` puede ser un array o un objeto (por ejemplo `data: { movimientos, movimientosMes, balanceTotal }` en `GET /movimientos`).  
  En creación a veces se devuelve además un `id`: `{ "data": { "success": true, "id": "..." } }`.

- **Error (4xx / 5xx):** cuerpo con mensaje en `error`:

  ```json
  { "error": "Mensaje legible" }
  ```

  Códigos típicos: **401** (falta o inválido `x-user-id`), **400** (validación o regla de negocio), **404** (recurso no encontrado), **500** (error interno).

---

### 2.5 Ejemplos de body (POST/PUT)

**POST /movimientos**

```json
{
  "fecha": "2025-02-01",
  "descripcion": "Supermercado",
  "tipoMovimiento": "Gasto",
  "categoriaId": "<uuid>",
  "metodoPago": "Débito",
  "montoCLP": 25000,
  "mesConciliacion": "2025-02",
  "cuentaOrigenId": "<uuid>"
}
```

Opcionales: `subcategoria`, `tipoGasto` ("Fijo" | "Variable" | "Ocasional"), `cuotas`, `notas`, `cuentaDestinoId`, `tarjetaCreditoId`, `estadoConciliacion` ("Pendiente" | "Conciliado").

**POST /cuentas**

```json
{
  "nombre": "Cuenta Corriente",
  "banco": "Banco X",
  "saldoInicialMes": 0
}
```

**POST /categorias**

```json
{
  "nombre": "Comida",
  "tipo": "Gasto",
  "color": "#f59e0b",
  "icono": "ShoppingCart"
}
```

`tipo` puede ser `"Gasto"`, `"Ingreso"` o `"Ambos"`.

Para **PUT** se envían solo los campos a actualizar (mismo formato que el recurso, pero todos opcionales).

---

### 2.6 Resumen para el equipo móvil

1. **Base URL:** `https://tu-dominio.com/api/v1` (o `http://localhost:3000/api/v1` en desarrollo).
2. **Header obligatorio (provisional):** `x-user-id: <userId>`.
3. **Respuestas:** éxito en `data`, errores en `error`; usar códigos HTTP para distinguir 401, 400, 404, 500.
4. **Próximo paso:** sustituir `x-user-id` por **JWT** en `Authorization: Bearer <token>` cuando el backend lo soporte.

Si necesitas el detalle exacto de campos obligatorios/opcionales para cada endpoint, están definidos en los schemas Zod dentro de cada `app/api/v1/.../route.ts`.
