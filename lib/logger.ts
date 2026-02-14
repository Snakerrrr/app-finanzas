/**
 * Sistema de logging estructurado con Pino.
 *
 * - Desarrollo: Logs bonitos y coloreados con pino-pretty
 * - Producción: JSON estructurado para Vercel Logs / Axiom
 * - Niveles: trace, debug, info, warn, error, fatal
 */

import pino from "pino"

const isDev = process.env.NODE_ENV === "development"

// En desarrollo, usamos un logger simple sin workers para evitar problemas con Next.js
export const logger = isDev
  ? pino({
      level: process.env.LOG_LEVEL || "info",
      // Sin transport en desarrollo para evitar worker threads
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() }
        },
      },
      base: {
        env: process.env.NODE_ENV,
        app: "finanzas-cl",
      },
    })
  : pino({
      level: process.env.LOG_LEVEL || "info",
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() }
        },
      },
      base: {
        env: process.env.NODE_ENV,
        app: "finanzas-cl",
      },
    })

// ---------------------------------------------------------------------------
// Helpers específicos para el chatbot
// ---------------------------------------------------------------------------

export type ChatEventType = "request" | "router" | "executor" | "generator" | "error" | "cache"

/**
 * Log estructurado para eventos del chatbot.
 * Incluye timestamp, userId, y metadata específica del evento.
 */
export function logChatEvent(event: ChatEventType, data: Record<string, unknown>) {
  const logData = {
    event: `chat:${event}`,
    timestamp: new Date().toISOString(),
    ...data,
  }

  if (event === "error") {
    logger.error(logData, `[CHAT] ${event.toUpperCase()}`)
  } else {
    logger.info(logData, `[CHAT] ${event.toUpperCase()}`)
  }
}

// ---------------------------------------------------------------------------
// Helpers para otras áreas de la app
// ---------------------------------------------------------------------------

/**
 * Log para operaciones de base de datos.
 */
export function logDbOperation(
  operation: "query" | "mutation" | "transaction",
  data: Record<string, unknown>
) {
  logger.info(
    {
      operation: `db:${operation}`,
      timestamp: new Date().toISOString(),
      ...data,
    },
    `[DB] ${operation.toUpperCase()}`
  )
}

/**
 * Log para operaciones de autenticación.
 */
export function logAuthEvent(
  event: "login" | "logout" | "register" | "error",
  data: Record<string, unknown>
) {
  const logData = {
    event: `auth:${event}`,
    timestamp: new Date().toISOString(),
    ...data,
  }

  if (event === "error") {
    logger.error(logData, `[AUTH] ${event.toUpperCase()}`)
  } else {
    logger.info(logData, `[AUTH] ${event.toUpperCase()}`)
  }
}

/**
 * Log para operaciones de cache.
 */
export function logCacheEvent(
  event: "hit" | "miss" | "set" | "invalidate",
  data: Record<string, unknown>
) {
  logger.debug(
    {
      event: `cache:${event}`,
      timestamp: new Date().toISOString(),
      ...data,
    },
    `[CACHE] ${event.toUpperCase()}`
  )
}
