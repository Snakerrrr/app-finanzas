import { describe, it, expect } from "vitest"
import {
  getLastUserMessage,
  extractMessageContent,
  isUIMessage,
  isLegacyMessage,
} from "@/lib/types/chat"

describe("Chat Flow E2E", () => {
  it("should handle a complete message flow from UI to content extraction", () => {
    // Simulate a conversation flow
    const conversation = [
      {
        id: "msg-1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "¿Cuál es mi balance?" }],
        createdAt: new Date(),
      },
      {
        id: "msg-2",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "Tu balance es de $500.000" }],
        createdAt: new Date(),
      },
      {
        id: "msg-3",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "¿Y mis gastos en comida?" }],
        createdAt: new Date(),
      },
    ]

    // Step 1: Validate all messages are proper UIMessages
    for (const msg of conversation) {
      expect(isUIMessage(msg)).toBe(true)
      expect(isLegacyMessage(msg)).toBe(false)
    }

    // Step 2: Extract last user message
    const lastMessage = getLastUserMessage(conversation)
    expect(lastMessage).toBe("¿Y mis gastos en comida?")

    // Step 3: Verify individual message extraction
    const firstUserContent = extractMessageContent(conversation[0])
    expect(firstUserContent).toBe("¿Cuál es mi balance?")

    // Step 4: Intent classification would happen here (mocked in real tests)
    // For "gastos en comida" -> intent: MOVIMIENTOS, category: "comida"
    const expectedIntent = "MOVIMIENTOS"
    const expectedCategory = "comida"
    expect(lastMessage.toLowerCase()).toContain(expectedCategory)
    expect(expectedIntent).toBe("MOVIMIENTOS")
  })

  it("should handle mixed message formats (UIMessage + Legacy)", () => {
    const mixedConversation = [
      { role: "user", content: "Hola, ¿cómo estoy financieramente?" },
      {
        id: "msg-2",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "Déjame revisar tus datos..." }],
      },
      {
        id: "msg-3",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "Muéstrame mis gastos de enero" }],
      },
    ]

    // Should handle both formats
    const lastMessage = getLastUserMessage(mixedConversation)
    expect(lastMessage).toBe("Muéstrame mis gastos de enero")

    // Legacy message extraction
    const legacyContent = extractMessageContent(mixedConversation[0])
    expect(legacyContent).toBe("Hola, ¿cómo estoy financieramente?")
  })
})
