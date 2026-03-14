/**
 * Telemetría & Analytics con PostHog
 *
 * Tracking de uso del chatbot y funcionalidades clave.
 * Se inicializa solo en el cliente (browser) y solo si NEXT_PUBLIC_POSTHOG_KEY está configurada.
 */

import posthog from "posthog-js"

let initialized = false

function ensureInitialized() {
  if (initialized) return true
  if (typeof window === "undefined") return false

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return false

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug()
    },
    autocapture: false,
    capture_pageview: false,
  })
  initialized = true
  return true
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!ensureInitialized()) return
  posthog.identify(userId, properties)
}

export function trackChatMessage(data: {
  messageLength: number
  conversationLength: number
}) {
  if (!ensureInitialized()) return
  posthog.capture("chat_message_sent", data)
}

export function trackIntentClassified(data: {
  intent: string
  hasCategory: boolean
  hasDateFilter: boolean
}) {
  if (!ensureInitialized()) return
  posthog.capture("chat_intent_classified", data)
}

export function trackChatResponse(data: {
  intent: string
  responseTimeMs: number
  success: boolean
  error?: string
}) {
  if (!ensureInitialized()) return
  posthog.capture("chat_response", data)
}

export function trackPageView(pageName: string) {
  if (!ensureInitialized()) return
  posthog.capture("$pageview", { page: pageName })
}

export function trackFeatureUsed(feature: string, properties?: Record<string, unknown>) {
  if (!ensureInitialized()) return
  posthog.capture("feature_used", { feature, ...properties })
}

export function resetAnalytics() {
  if (!ensureInitialized()) return
  posthog.reset()
}
