# 🚀 Configurar Upstash Redis (Rate Limiting)

## ¿Qué es Upstash?

Upstash es un servicio de Redis serverless que funciona perfecto con Vercel y Next.js. Lo usamos para:
- ✅ **Rate Limiting**: Limitar cuántos mensajes puede enviar un usuario al chatbot (10/minuto)
- ✅ **Cache**: Guardar datos financieros temporalmente para respuestas más rápidas (próximo paso)

---

## 📝 Pasos de Configuración

### 1. Crear Cuenta en Upstash (2 minutos)

1. Ve a https://upstash.com
2. Haz clic en "Sign up" (puedes usar GitHub o Google)
3. Verifica tu email

### 2. Crear Base de Datos Redis (1 minuto)

1. Una vez en el dashboard, haz clic en **"Create Database"**
2. Configuración recomendada:
   - **Name:** `finanzas-ratelimit`
   - **Type:** Regional (más rápido)
   - **Region:** Selecciona la más cercana a tu región (ej: `us-east-1` si estás en USA)
   - **Primary Region:** Deja el default
   - **Read Regions:** Ninguno (Free tier no lo necesita)
3. Haz clic en **"Create"**

### 3. Copiar Credenciales (30 segundos)

1. Una vez creada la base de datos, verás la página de detalles
2. En la sección **"REST API"**, encontrarás:
   - `UPSTASH_REDIS_REST_URL`: Algo como `https://us1-fine-xyz-12345.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN`: Un token largo tipo `AYa...xyz`
3. Copia ambos valores

### 4. Actualizar `.env` (30 segundos)

Abre tu archivo `.env` y reemplaza las líneas:

```env
# ANTES (placeholders)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# DESPUÉS (con tus valores reales)
UPSTASH_REDIS_REST_URL="https://us1-fine-xyz-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYa8ASQgNmY2..."
```

### 5. Reiniciar Servidor (10 segundos)

1. Detén el servidor de desarrollo (Ctrl+C en la terminal)
2. Vuelve a ejecutar:
   ```bash
   npm run dev
   ```

---

## ✅ Verificar que Funciona

### Test 1: Rate Limiting Básico

1. Abre tu aplicación en `http://localhost:3000`
2. Abre el chatbot
3. **Envía 10 mensajes rápidamente** (uno tras otro)
4. **Intenta enviar el mensaje 11**

**Resultado esperado:**
- Los primeros 10 mensajes deberían funcionar normal
- El mensaje 11 debería mostrar: **"Demasiados mensajes. Intenta de nuevo en 1 minuto."**
- Después de 1 minuto, puedes volver a enviar mensajes

### Test 2: Verificar en Upstash Dashboard

1. Ve a tu dashboard de Upstash
2. Haz clic en tu base de datos
3. Ve a la pestaña **"Data Browser"**
4. Deberías ver claves como:
   - `@finanzas/chat:tu-user-id`
   - `@finanzas/ip:tu-ip`

### Test 3: Headers de Rate Limit

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña **Network**
3. Envía un mensaje al chatbot
4. Busca el request a `/api/chat`
5. En la pestaña **Headers**, deberías ver:
   ```
   X-RateLimit-Limit: 10
   X-RateLimit-Remaining: 9
   X-RateLimit-Reset: 2026-02-14T03:15:00.000Z
   ```

---

## 🎯 Límites Configurados

| Tipo | Límite | Ventana | Descripción |
|------|--------|---------|-------------|
| **Usuario** | 10 mensajes | 1 minuto | Por `userId` (session) |
| **IP** | 20 mensajes | 1 minuto | Por dirección IP (protección extra) |

Puedes ajustar estos límites editando `lib/rate-limit.ts`:

```typescript
// Aumentar límite de usuario a 15 mensajes/minuto
export const chatRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(15, "1 m"), // <- Cambiar aquí
  analytics: true,
  prefix: "@finanzas/chat",
})
```

---

## 💰 Costos

**Plan Free (Suficiente para MVP):**
- ✅ 10,000 requests/día
- ✅ 10 MB de almacenamiento
- ✅ 100 conexiones concurrentes

**Si superas el límite gratuito:**
- Plan Pay-as-you-go: $0.20 por 100K requests
- Típicamente $5-10/mes para una app con 100 usuarios activos

---

## 🐛 Problemas Comunes

### Error: "Connection refused"

**Causa:** Las credenciales de Upstash están incorrectas o no están configuradas.

**Solución:**
1. Verifica que copiaste bien `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
2. Asegúrate de que NO tienen espacios al inicio/final
3. Reinicia el servidor (`npm run dev`)

### Error: "Rate limit is not working"

**Causa:** El servidor no se reinició después de agregar las credenciales.

**Solución:**
1. Detén el servidor (Ctrl+C)
2. Ejecuta `npm run dev` de nuevo
3. Las variables de entorno solo se cargan al iniciar

### Los límites no se resetean

**Causa:** Upstash usa "sliding window", no ventanas fijas.

**Explicación:**
- ✅ Correcto: Si envías 10 mensajes en el minuto 0:00, podrás enviar otro en el minuto 0:01
- ❌ Incorrecto: No es que se resetee completamente cada minuto, sino que cada request "expira" 60 segundos después

---

## 🔜 Próximo Paso: Caching

Una vez que tengas Rate Limiting funcionando, el siguiente paso es implementar **Caching** para hacer las respuestas del chatbot 10x más rápidas.

Revisa la sección **1.2.A: Caching de Datos** en `docs/AUDITORIA-TECNICA-ENTERPRISE.md`.

---

✅ **¡Listo!** Ahora tu aplicación está protegida contra abusos de API y costos descontrolados de OpenAI.
