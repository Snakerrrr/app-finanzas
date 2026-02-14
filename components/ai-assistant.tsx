"use client"

import { useChat } from "@ai-sdk/react"
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { UIMessage } from "ai"

/**
 * AiAssistant - Chatbot Financiero
 *
 * Arquitectura: Router Agent (Server-side)
 * - El backend clasifica la intención, ejecuta queries y sintetiza la respuesta
 * - Este componente solo recibe y muestra el texto final del stream
 *
 * IMPORTANTE (AI SDK v6):
 * - UIMessage NO tiene .content — el texto está en message.parts[]
 * - Cada parte de texto es { type: "text", text: string }
 */

// ─── Helpers para extraer texto de UIMessage (SDK v6) ─────────────────────────

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function hasVisibleText(message: UIMessage): boolean {
  return message.parts.some((part) => part.type === "text" && part.text.trim().length > 0)
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    onError: (err) => {
      console.error("Error en el chat:", err)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto-scroll cuando llegan nuevos mensajes o cambia el streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setInput("")
    sendMessage({ text: trimmed })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  // Filtrar: solo mensajes con texto visible (oculta tool-calls intermedios si los hubiera)
  const visibleMessages = messages.filter(
    (m) => m.role === "user" || (m.role === "assistant" && hasVisibleText(m))
  )

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-4 right-4 z-[100]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-tr from-primary to-primary/80"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-[90vw] md:w-[420px] h-[650px] max-h-[85vh] bg-background/95 backdrop-blur-xl border shadow-2xl rounded-2xl flex flex-col z-[99] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="relative px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Asistente Financiero</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>IA Activa</span>
                  </div>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-primary/40" />
            </div>
          </div>

          {/* Área de Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background/50 to-muted/20"
          >
            {/* Estado Vacío */}
            {visibleMessages.length === 0 && !error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-base mb-2">¡Hola! 👋</h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
                  Soy tu copiloto financiero. Pregúntame sobre tus gastos, ingresos o balance.
                </p>

                {/* Sugerencias clickeables */}
                <div className="grid gap-2 w-full max-w-[280px]">
                  {[
                    { emoji: "💰", text: "¿Cuál es mi balance?" },
                    { emoji: "🍔", text: "Mis gastos en comida" },
                    { emoji: "📊", text: "Resumen del mes" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => handleSend(s.text)}
                      className="text-xs py-2.5 px-4 border rounded-xl hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left font-medium"
                    >
                      {s.emoji} {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <p className="font-medium mb-1">Error al procesar tu mensaje</p>
                <p className="text-xs opacity-80">{error.message}</p>
              </div>
            )}

            {/* Lista de Mensajes */}
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar del Bot */}
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                {/* Burbuja de Mensaje */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm"
                  }`}
                >
                  <MessageContent text={getTextFromMessage(message)} />
                </div>
              </div>
            ))}

            {/* Indicador de Carga (diferenciado por fase) */}
            {isLoading && (
              <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {status === "submitted" ? "Analizando tu solicitud..." : "Escribiendo..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input de Mensaje */}
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="w-full min-h-[48px] px-4 pr-12 py-3 rounded-2xl border bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 rounded-2xl shrink-0 shadow-lg disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>

            <p className="text-[10px] text-muted-foreground/60 text-center mt-2.5">
              Powered by OpenAI gpt-4o-mini
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Componente auxiliar: renderiza texto con **negritas** ─────────────────────

function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}
