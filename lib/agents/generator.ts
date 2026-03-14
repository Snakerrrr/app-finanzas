import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText } from "ai"

const SYSTEM_PROMPT = `Eres FinanzasIA. Responde SIEMPRE en español.

INSTRUCCIONES:
1. Usa los datos proporcionados arriba para responder al usuario.
2. Si el contexto dice "No se requieren datos", responde conversacionalmente.
3. Si hay montos, usa negritas (**$100**).
4. Si la lista de movimientos está vacía, díselo al usuario amablemente.`

export async function generateResponse(
  messages: Parameters<typeof convertToModelMessages>[0],
  systemContext: string
) {
  const modelMessages = await convertToModelMessages(messages)

  return streamText({
    model: openai("gpt-4o-mini"),
    system: `${SYSTEM_PROMPT}

CONTEXTO DE DATOS (Del Sistema):
--------------------------------
${systemContext}
--------------------------------`,
    messages: modelMessages,
  })
}
