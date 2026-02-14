import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getDashboardData, getMovimientos } from "@/lib/services/finance.service"
import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, generateObject, streamText } from "ai"
import { z } from "zod"

export const maxDuration = 60

/** Extrae el texto del último mensaje del usuario (soporta content string o array de partes) */
function getLastUserMessageContent(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) return ""
  const last = messages[messages.length - 1]
  if (!last || (last as { role?: string }).role !== "user") {
    const userMsg = [...messages].reverse().find((m) => (m as { role?: string }).role === "user")
    if (!userMsg) return ""
    return extractContent((userMsg as { content?: unknown }).content)
  }
  return extractContent((last as { content?: unknown }).content)
}

function extractContent(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: string }).text) : ""))
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

    console.log("------------------------------------------------")
    console.log(`📨 Nuevo Mensaje Usuario: "${lastUserMessage}"`)

    // ---------------------------------------------------------
    // PASO 1: ROUTER (Clasificación de Intención)
    // Schema estricto: .nullable() para OpenAI Structured Outputs (no .optional())
    // ---------------------------------------------------------
    const { object: intention } = await generateObject({
      model: openai("gpt-4o-mini", { structuredOutputs: true }),
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

    console.log(`🧭 Intención Detectada: [${intention.intent}]`)
    console.log(`🔍 Parámetros extraídos:`, intention.parameters)

    // ---------------------------------------------------------
    // PASO 2: EJECUTOR (Lógica de Negocio)
    // ---------------------------------------------------------
    let systemContext = "No se requieren datos financieros para esta respuesta."

    switch (intention.intent) {
      case "BALANCE":
        console.log("⚡ Ejecutando: getDashboardData...")
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
          console.log("✅ Datos obtenidos (Balance):", resumen ? "OK" : "Vacío")
          systemContext = `DATOS DE BALANCE ACTUAL: ${JSON.stringify(resumen, null, 2)}`
        } catch (error) {
          console.error("❌ Error obteniendo balance:", error)
          systemContext = "Hubo un error técnico al consultar el balance."
        }
        break

      case "MOVIMIENTOS":
        console.log("⚡ Ejecutando: getMovimientos...")
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
          console.log(`✅ Movimientos encontrados: ${preview.length}`)

          systemContext = `LISTADO DE MOVIMIENTOS (${preview.length} mostrados):
${JSON.stringify(preview, null, 2)}`
        } catch (error) {
          console.error("❌ Error obteniendo movimientos:", error)
          systemContext = "Hubo un error técnico al consultar los movimientos."
        }
        break

      default:
        console.log("ℹ️ No se requiere consulta a base de datos.")
    }

    // ---------------------------------------------------------
    // PASO 3: GENERADOR (Respuesta Final)
    // ---------------------------------------------------------
    console.log("🎙️ Generando respuesta final...")

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
    console.error("🔥 Error CRÍTICO en route.ts:", error)
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
