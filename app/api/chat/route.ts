import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { chatRateLimit, ipRateLimit } from "@/lib/rate-limit"
import { logger, logChatEvent } from "@/lib/logger"
import { getLastUserMessage } from "@/lib/types/chat"
import { classifyIntent } from "@/lib/agents/router"
import { executeIntent } from "@/lib/agents/executor"
import { generateResponse } from "@/lib/agents/generator"

export const maxDuration = 60

export async function POST(req: Request) {
  let userId: string | undefined
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }
    userId = session.user.id

    // Rate Limiting (graceful: si Redis no está disponible, se permite el request)
    const ip = req.headers.get("x-forwarded-for") ?? "unknown"
    try {
      const userLimit = await chatRateLimit.limit(userId)
      if (!userLimit.success) {
        return new Response(
          JSON.stringify({
            error: "Demasiados mensajes. Intenta de nuevo en 1 minuto.",
            retryAfter: userLimit.reset,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": userLimit.limit.toString(),
              "X-RateLimit-Remaining": userLimit.remaining.toString(),
              "X-RateLimit-Reset": new Date(userLimit.reset).toISOString(),
            },
          }
        )
      }

      const ipLimit = await ipRateLimit.limit(ip)
      if (!ipLimit.success) {
        return new Response("Too many requests from this IP", { status: 429 })
      }
    } catch (rateLimitError) {
      logger.warn({ error: rateLimitError }, "Rate limiting no disponible, permitiendo request")
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      return Response.json({ error: "Falta OPENAI_API_KEY en .env.local" }, { status: 503 })
    }
    await prisma.$connect()

    let body: { messages?: unknown }
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: "Body inválido" }, { status: 400 })
    }
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const lastUserMessage = getLastUserMessage(messages).trim() || "Hola"

    logChatEvent("request", { userId, messageCount: messages.length, lastMessage: lastUserMessage.slice(0, 100), ip })

    // Pipeline: Router → Executor → Generator
    const intention = await classifyIntent(lastUserMessage)
    logChatEvent("router", { userId, intent: intention.intent, parameters: intention.parameters })

    const { systemContext } = await executeIntent(userId, intention)
    logChatEvent("generator", { userId, systemContextLength: systemContext.length })

    const result = await generateResponse(messages, systemContext)
    return result.toUIMessageStreamResponse()
  } catch (error) {
    logger.error(
      { error, userId, stack: error instanceof Error ? error.stack : undefined },
      "Error crítico en /api/chat"
    )
    logChatEvent("error", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
