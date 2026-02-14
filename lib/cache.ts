/**
 * Capa de caché con Upstash Redis.
 *
 * - Reutiliza la misma instancia Redis que el rate limiter.
 * - TTL por defecto: 30 segundos (ideal para datos financieros que cambian poco).
 * - Si Redis falla, la app sigue funcionando (cache miss silencioso).
 */

import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

// ---------------------------------------------------------------------------
// Funciones principales
// ---------------------------------------------------------------------------

/**
 * Lee un valor del cache. Retorna `null` si no existe o si Redis falla.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    if (data) {
      // Cache HIT - log en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log(`[cache] ✅ HIT: ${key}`)
      }
      return data
    }
    // Cache MISS
    if (process.env.NODE_ENV === "development") {
      console.log(`[cache] ⚠️ MISS: ${key}`)
    }
    return null
  } catch (error) {
    console.warn("[cache] ❌ Error al leer:", key, error)
    return null
  }
}

/**
 * Guarda un valor en cache con TTL en segundos (default 30s).
 */
export async function setCached<T>(key: string, value: T, ttlSeconds = 30): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds })
    if (process.env.NODE_ENV === "development") {
      console.log(`[cache] 💾 SET: ${key} (TTL: ${ttlSeconds}s)`)
    }
  } catch (error) {
    console.warn("[cache] ❌ Error al escribir:", key, error)
  }
}

/**
 * Invalida (elimina) una o más claves del cache.
 * Acepta claves exactas. Para patrones usa `invalidateUserCache`.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await redis.del(...keys)
  } catch (error) {
    console.warn("[cache] Error al invalidar:", keys, error)
  }
}

/**
 * Invalida todas las claves de cache asociadas a un usuario.
 * Borra dashboard + movimientos de un userId específico.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    // Claves conocidas para este usuario
    const keys = [
      `dashboard:${userId}`,
      `movimientos:${userId}`,
    ]

    // Buscar claves de movimientos con filtros (movimientos:userId:*)
    const filterKeys = await redis.keys(`movimientos:${userId}:*`)
    if (filterKeys.length > 0) {
      keys.push(...filterKeys)
    }

    if (keys.length > 0) {
      await redis.del(...keys)
      if (process.env.NODE_ENV === "development") {
        console.log(`[cache] 🗑️ INVALIDATE: ${keys.length} claves de usuario ${userId}`)
      }
    }
  } catch (error) {
    console.warn("[cache] ❌ Error al invalidar cache de usuario:", userId, error)
  }
}

// ---------------------------------------------------------------------------
// Helpers para generar claves consistentes
// ---------------------------------------------------------------------------

export const cacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,

  movimientos: (userId: string, filters?: { startDate?: string; endDate?: string; categoryId?: string }) => {
    if (!filters || (!filters.startDate && !filters.endDate && !filters.categoryId)) {
      return `movimientos:${userId}`
    }
    // Clave determinista basada en los filtros
    const parts = [
      `movimientos:${userId}`,
      filters.startDate ?? "_",
      filters.endDate ?? "_",
      filters.categoryId ?? "_",
    ]
    return parts.join(":")
  },
} as const
