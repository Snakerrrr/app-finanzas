/**
 * Extrae el texto del último mensaje del usuario.
 *
 * AI SDK v6 (UIMessage): { parts: [{ type: "text", text: "..." }] }
 * Legacy:                 { content: "string" | [{ text: "..." }] }
 */
export function getLastUserMessageText(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) return ""

  const userMsg = [...messages]
    .reverse()
    .find((m) => (m as { role?: string }).role === "user")

  if (!userMsg) return ""
  return extractTextFromMessage(userMsg)
}

function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") return ""
  const msg = message as Record<string, unknown>

  // AI SDK v6: message.parts[]
  if (Array.isArray(msg.parts)) {
    const text = msg.parts
      .filter((p: unknown) => p && typeof p === "object" && (p as { type?: string }).type === "text")
      .map((p: unknown) => String((p as { text: string }).text || ""))
      .join(" ")
    if (text.trim()) return text
  }

  // Legacy: message.content (string)
  if (typeof msg.content === "string") return msg.content

  // Legacy: message.content (array)
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((p: unknown) =>
        p && typeof p === "object" && "text" in (p as object)
          ? String((p as { text: string }).text)
          : ""
      )
      .join(" ")
  }

  return ""
}
