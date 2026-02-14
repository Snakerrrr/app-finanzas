/**
 * Caché en memoria con TTL (Time-To-Live).
 *
 * Para MVP: caché in-process (se pierde entre cold-starts, pero elimina
 * queries repetitivas dentro de la misma instancia serverless).
 *
 * Para escalar: reemplazar con Upstash Redis (misma interfaz).
 *
 * Uso en el chatbot:
 *   const data = await cached(`balance:${userId}`, 30, () => getDashboardData(userId))
 */

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Ejecuta `fn()` y cachea el resultado por `ttlSeconds`.
 * Si hay un valor en caché no expirado, lo devuelve sin ejecutar `fn`.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const entry = store.get(key) as CacheEntry<T> | undefined

  if (entry && entry.expiresAt > now) {
    return entry.data
  }

  const data = await fn()
  store.set(key, { data, expiresAt: now + ttlSeconds * 1000 })
  return data
}

/**
 * Invalida una clave específica (ej: cuando el usuario crea un movimiento).
 */
export function invalidateCache(key: string): void {
  store.delete(key)
}

/**
 * Invalida todas las claves que empiezan con un prefijo.
 * Ej: invalidateCacheByPrefix(`balance:${userId}`) borra todo el caché del usuario.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}
