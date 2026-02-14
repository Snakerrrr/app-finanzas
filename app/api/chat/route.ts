import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getDashboardData, getMovimientos } from "@/lib/services/finance.service"
import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, generateObject, streamText } from "ai"
import { z } from "zod"
import { chatRateLimit, ipRateLimit } from "@/lib/rate-limit"
import { logger, logChatEvent } from "@/lib/logger"

export const maxDuration = 60

/**
 * Extrae el texto del último mensaje del usuario.
 *
 * AI SDK v6 (UIMessage): los mensajes llegan con `parts` (array de { type, text })
 * Versiones anteriores: los mensajes podían tener `content` (string o array)
 *
 * Esta función soporta ambos formatos para robustez.
 */
function getLastUserMessageContent(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) return ""

  // Buscar el último mensaje con role "user"
  const userMsg = [...messages]
    .reverse()
    .find((m) => (m as { role?: string }).role === "user")

  if (!userMsg) return ""
  return extractContent(userMsg)
}

function extractContent(message: unknown): string {
  if (!message || typeof message !== "object") return ""
  const msg = message as Record<string, unknown>

  // Formato AI SDK v6 (UIMessage): { parts: [{ type: "text", text: "..." }] }
  if (Array.isArray(msg.parts)) {
    const text = msg.parts
      .filter((p: unknown) => p && typeof p === "object" && (p as { type?: string }).type === "text")
      .map((p: unknown) => String((p as { text: string }).text || ""))
      .join(" ")
    if (text.trim()) return text
  }

  // Formato legacy: { content: "string" }
  if (typeof msg.content === "string") return msg.content

  // Formato legacy: { content: [{ type: "text", text: "..." }] }
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((p: unknown) => (p && typeof p === "object" && "text" in (p as object) ? String((p as { text: string }).text) : ""))
      .join(" ")
  }

  return ""
}

export async function POST(req: Request) {
  try {
    // 1. Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }
    const userId = session.user.id

    // 2. Rate Limiting por Usuario
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

    // 3. Rate Limiting por IP (protección adicional)
    const ip = req.headers.get("x-forwarded-for") ?? "unknown"
    const ipLimit = await ipRateLimit.limit(ip)
    if (!ipLimit.success) {
      return new Response("Too many requests from this IP", { status: 429 })
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
    const lastUserMessage = getLastUserMessageContent(messages).trim() || "Hola"

    logChatEvent("request", {
      userId,
      messageCount: messages.length,
      lastMessage: lastUserMessage.slice(0, 100),
      ip,
    })

    // ---------------------------------------------------------
    // PASO 1: ROUTER (Clasificación de Intención)
    // Schema estricto: .nullable() para OpenAI Structured Outputs (no .optional())
    // ---------------------------------------------------------
    const { object: intention } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        intent: z
          .enum(["BALANCE", "MOVIMIENTOS", "SALUDO", "AYUDA", "OTRO"])
          .describe("Clasifica la intención principal del usuario."),
        parameters: z.object({
          category: z.string().nullable().describe("Categoría de gasto (ej: comida, super) o null si no aplica"),
          startDate: z.string().nullable().describe("Fecha inicial YYYY-MM-DD o null"),
          endDate: z.string().nullable().describe("Fecha final YYYY-MM-DD o null"),
        }),
      }),
      prompt: `Analiza el mensaje y extrae la intención y parámetros.
Hoy es: ${new Date().toLocaleDateString("es-CL")}

Usuario: "${lastUserMessage}"

Guía:
- "balance", "resumen", "cómo voy", "saldo" -> BALANCE
- "gastos", "comida", "ayer", "movimientos" -> MOVIMIENTOS
- "hola", "gracias" -> SALUDO
- Cualquier otra cosa -> OTRO`,
    })

    logChatEvent("router", {
      userId,
      intent: intention.intent,
      parameters: intention.parameters,
    })

    // ---------------------------------------------------------
    // PASO 2: EJECUTOR (Lógica de Negocio)
    // ---------------------------------------------------------
    let systemContext = "No se requieren datos financieros para esta respuesta."

    switch (intention.intent) {
      case "BALANCE":
        try {
          const balanceData = await getDashboardData(userId)
          const ingresosMes = balanceData.movimientosMes
            .filter((m) => m.tipoMovimiento === "Ingreso")
            .reduce((s, m) => s + m.montoCLP, 0)
          const gastosMes = balanceData.movimientosMes
            .filter((m) => m.tipoMovimiento === "Gasto")
            .reduce((s, m) => s + m.montoCLP, 0)
          const resumen = {
            balanceTotal: balanceData.balanceTotal,
            ingresosDelMes: ingresosMes,
            gastosDelMes: gastosMes,
            cantidadMovimientosMes: balanceData.movimientosMes.length,
          }
          logChatEvent("executor", {
            userId,
            intent: "BALANCE",
            success: true,
            dataSize: JSON.stringify(resumen).length,
          })
          systemContext = `DATOS DE BALANCE ACTUAL: ${JSON.stringify(resumen, null, 2)}`
        } catch (error) {
          logger.error({ userId, error, intent: "BALANCE" }, "Error en executor")
          logChatEvent("error", {
            userId,
            intent: "BALANCE",
            error: error instanceof Error ? error.message : String(error),
          })
          systemContext = "Hubo un error técnico al consultar el balance."
        }
        break

      case "MOVIMIENTOS":
        try {
          const filters = {
            startDate: intention.parameters.startDate ?? undefined,
            endDate: intention.parameters.endDate ?? undefined,
          }

          const movimientos = await getMovimientos(userId, filters)

          let resultados = movimientos
          if (intention.parameters.category != null && intention.parameters.category !== "") {
            const cat = intention.parameters.category.toLowerCase()
            resultados = movimientos.filter((m) =>
              JSON.stringify({ desc: m.descripcion, cat: m.categoria?.nombre }).toLowerCase().includes(cat)
            )
          }

          const preview = resultados.slice(0, 10).map((m) => ({
            fecha: m.fecha,
            descripcion: m.descripcion,
            tipo: m.tipoMovimiento,
            monto: m.montoCLP,
            categoria: m.categoria?.nombre,
          }))

          logChatEvent("executor", {
            userId,
            intent: "MOVIMIENTOS",
            success: true,
            total: resultados.length,
            shown: preview.length,
            filters,
          })

          systemContext = `LISTADO DE MOVIMIENTOS (${preview.length} mostrados):
${JSON.stringify(preview, null, 2)}`
        } catch (error) {
          logger.error({ userId, error, intent: "MOVIMIENTOS" }, "Error en executor")
          logChatEvent("error", {
            userId,
            intent: "MOVIMIENTOS",
            error: error instanceof Error ? error.message : String(error),
          })
          systemContext = "Hubo un error técnico al consultar los movimientos."
        }
        break

      default:
        logChatEvent("executor", {
          userId,
          intent: intention.intent,
          success: true,
          note: "No requiere consulta a BD",
        })
    }

    // ---------------------------------------------------------
    // PASO 3: GENERADOR (Respuesta Final)
    // ---------------------------------------------------------
    logChatEvent("generator", {
      userId,
      systemContextLength: systemContext.length,
    })

    const modelMessages = await convertToModelMessages(messages)
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `Eres FinanzasIA. Responde SIEMPRE en español.

CONTEXTO DE DATOS (Del Sistema):
--------------------------------
${systemContext}
--------------------------------

INSTRUCCIONES:
1. Usa los datos proporcionados arriba para responder al usuario.
2. Si el contexto dice "No se requieren datos", responde conversacionalmente.
3. Si hay montos, usa negritas (**$100**).
4. Si la lista de movimientos está vacía, díselo al usuario amablemente.`,
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    logger.error(
      {
        error,
        userId: session?.user?.id,
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Error crítico en /api/chat"
    )
    logChatEvent("error", {
      userId: session?.user?.id,
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
