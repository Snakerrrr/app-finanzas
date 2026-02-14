import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

/**
 * Schema de intención del Router Agent.
 * Usar .nullable() (no .optional()) para compatibilidad con OpenAI Structured Outputs.
 */
const intentionSchema = z.object({
  intent: z
    .enum(["BALANCE", "MOVIMIENTOS", "SALUDO", "AYUDA", "OTRO"])
    .describe("Clasifica la intención principal del usuario."),
  parameters: z.object({
    category: z
      .string()
      .nullable()
      .describe("Categoría de gasto (ej: comida, super) o null si no aplica"),
    startDate: z
      .string()
      .nullable()
      .describe("Fecha inicial YYYY-MM-DD o null"),
    endDate: z
      .string()
      .nullable()
      .describe("Fecha final YYYY-MM-DD o null"),
  }),
})

export type Intention = z.infer<typeof intentionSchema>

/**
 * Paso 1 del Router Agent: clasifica la intención del usuario.
 */
export async function classifyIntent(userMessage: string): Promise<Intention> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: intentionSchema,
    prompt: `Analiza el mensaje y extrae la intención y parámetros.
Hoy es: ${new Date().toLocaleDateString("es-CL")}

Usuario: "${userMessage}"

Guía:
- "balance", "resumen", "cómo voy", "saldo" -> BALANCE
- "gastos", "comida", "ayer", "movimientos" -> MOVIMIENTOS
- "hola", "gracias" -> SALUDO
- Cualquier otra cosa -> OTRO`,
  })

  return object
}
