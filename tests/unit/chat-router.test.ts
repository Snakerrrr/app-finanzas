import { describe, it, expect } from "vitest"
import {
  isUIMessage,
  isLegacyMessage,
  isUIMessageArray,
  extractMessageContent,
  getLastUserMessage,
} from "@/lib/types/chat"

describe("Chat Type Guards", () => {
  describe("isUIMessage", () => {
    it("should return true for valid UIMessage", () => {
      const msg = { id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }
      expect(isUIMessage(msg)).toBe(true)
    })

    it("should return false for legacy message", () => {
      const msg = { role: "user", content: "hello" }
      expect(isUIMessage(msg)).toBe(false)
    })

    it("should return false for non-object", () => {
      expect(isUIMessage("string")).toBe(false)
      expect(isUIMessage(null)).toBe(false)
      expect(isUIMessage(undefined)).toBe(false)
    })
  })

  describe("isLegacyMessage", () => {
    it("should return true for string content", () => {
      const msg = { role: "user", content: "hello" }
      expect(isLegacyMessage(msg)).toBe(true)
    })

    it("should return true for array content", () => {
      const msg = { role: "user", content: [{ type: "text", text: "hello" }] }
      expect(isLegacyMessage(msg)).toBe(true)
    })

    it("should return false for UIMessage format", () => {
      // UIMessage also matches LegacyMessage if it has content, but without content it should not
      const msg = { id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }
      expect(isLegacyMessage(msg)).toBe(false)
    })
  })

  describe("isUIMessageArray", () => {
    it("should return true for array of valid messages", () => {
      const msgs = [
        { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
        { role: "assistant", content: "hello" },
      ]
      expect(isUIMessageArray(msgs)).toBe(true)
    })

    it("should return false for non-array", () => {
      expect(isUIMessageArray("not array")).toBe(false)
    })

    it("should return false if any element is invalid", () => {
      const msgs = [{ id: "1", role: "user", parts: [] }, "invalid"]
      expect(isUIMessageArray(msgs)).toBe(false)
    })
  })
})

describe("Chat Message Extraction", () => {
  describe("extractMessageContent", () => {
    it("should extract text from UIMessage parts", () => {
      const msg = { id: "1", role: "user", parts: [{ type: "text", text: "hello world" }] }
      expect(extractMessageContent(msg)).toBe("hello world")
    })

    it("should extract text from legacy string content", () => {
      const msg = { role: "user", content: "hello world" }
      expect(extractMessageContent(msg)).toBe("hello world")
    })

    it("should extract text from legacy array content", () => {
      const msg = { role: "user", content: [{ type: "text", text: "hello" }, { type: "text", text: " world" }] }
      expect(extractMessageContent(msg)).toBe("hello world")
    })

    it("should return empty string for invalid message", () => {
      expect(extractMessageContent(null)).toBe("")
      expect(extractMessageContent(42)).toBe("")
    })
  })

  describe("getLastUserMessage", () => {
    it("should find the last user message", () => {
      const msgs = [
        { id: "1", role: "user", parts: [{ type: "text", text: "first" }] },
        { id: "2", role: "assistant", parts: [{ type: "text", text: "response" }] },
        { id: "3", role: "user", parts: [{ type: "text", text: "second" }] },
      ]
      expect(getLastUserMessage(msgs)).toBe("second")
    })

    it("should return empty string if no user messages", () => {
      const msgs = [
        { id: "1", role: "assistant", parts: [{ type: "text", text: "hello" }] },
      ]
      expect(getLastUserMessage(msgs)).toBe("")
    })

    it("should return empty string for non-array", () => {
      expect(getLastUserMessage("not array")).toBe("")
      expect(getLastUserMessage(null)).toBe("")
    })
  })
})
