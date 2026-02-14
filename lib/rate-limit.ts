import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Límite: 10 mensajes por minuto por usuario
export const chatRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@finanzas/chat",
})

// Límite agresivo para IPs sospechosas
export const ipRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "@finanzas/ip",
})
