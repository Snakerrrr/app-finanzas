import { auth } from "@/auth"
import { getDashboardData, getMovimientos } from "@/lib/services/finance.service"
import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, tool, zodSchema } from "ai"
import { z } from "zod"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { error: "No autorizado. Inicia sesión." },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      console.error("[POST /api/chat] OPENAI_API_KEY no definida en .env o .env.local")
      return Response.json(
        {
          error:
            "Falta la API key de OpenAI. Añade OPENAI_API_KEY en .env.local en la raíz del proyecto y reinicia el servidor (npm run dev).",
        },
        { status: 503 }
      )
    }

    const model = openai("gpt-4o-mini")

    let body: { messages?: unknown }
    try {
      body = await req.json()
    } catch {
      return Response.json(
        { error: "Cuerpo de la petición inválido o vacío. Envía JSON con { messages: [...] }." },
        { status: 400 }
      )
    }

    const rawMessages = Array.isArray(body?.messages) ? body.messages : []
    const emptySchema = zodSchema(z.object({}))
    const tools = {
      getBalance: tool({
        description: "Obtiene el balance total actual, ingresos y gastos del mes.",
        inputSchema: emptySchema,
        execute: async () => getDashboardData(userId),
      }),
      getTransactions: tool({
        description: "Busca movimientos específicos filtrando por fechas o categorías.",
        inputSchema: zodSchema(
          z.object({
            startDate: z.string().optional().describe("Fecha inicio YYYY-MM-DD"),
            endDate: z.string().optional().describe("Fecha fin YYYY-MM-DD"),
          })
        ),
        execute: async ({ startDate, endDate }: { startDate?: string; endDate?: string }) =>
          getMovimientos(userId, { startDate, endDate }),
      }),
    }

    let messages: Awaited<ReturnType<typeof convertToModelMessages>>
    try {
      messages = await convertToModelMessages(rawMessages, { tools })
    } catch (convertErr) {
      console.error("[POST /api/chat] convertToModelMessages:", convertErr)
      return Response.json(
        { error: "Formato de mensajes inválido. Se espera un array de { role, content }." },
        { status: 400 }
      )
    }

    const result = streamText({
      model,
      system: `Eres un asistente financiero personal, inteligente y empático.
Tu nombre es FinanzasIA.
Fecha actual: ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

INSTRUCCIONES DE COMPORTAMIENTO:
1. **Charla Casual:** Si el usuario saluda ("Hola"), agradece o se despide, responde amablemente y con naturalidad SIN llamar a herramientas. No inventes datos.

2. **Consultas Vagas:** Si el usuario pregunta "¿Cómo voy?", "Resumen", "¿Tengo plata?", o "¿Qué tal mi mes?", ASUME INTELIGIENTEMENTE que quiere ver su BALANCE y llama a la herramienta 'getBalance'.

3. **Consultas Específicas:** Si pregunta por "gastos en comida" o "ingresos de enero", usa 'getTransactions' con los filtros adecuados.

4. **Formato:**
   - Usa negritas para resaltar montos (ej: **$15.000 CLP**).
   - Sé conciso pero amable.
   - Si encuentras un gasto alto, puedes hacer un comentario breve (ej: "Parece que gastaste bastante en Supermercado").`,
      messages,
      maxSteps: 5,
      tools,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Error en chat API:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return Response.json(
      {
        error: "Error interno del asistente",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    )
  }
}
