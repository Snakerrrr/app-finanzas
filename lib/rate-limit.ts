import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Requiere UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN en .env.local
// Gratis en: https://upstash.com (10k requests/día en free tier)

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Rate limit para el chatbot (endpoint más costoso: 2 llamadas a OpenAI por mensaje).
 * Sliding window: 10 mensajes por minuto por usuario.
 */
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:chat",
})

/**
 * Rate limit para API v1 (móvil): 60 requests por minuto.
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "ratelimit:api",
})

/**
 * Rate limit para login (anti fuerza bruta): 5 intentos por minuto por IP.
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
})
