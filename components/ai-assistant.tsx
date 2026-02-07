"use client"

import { useChat } from "@ai-sdk/react"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [localInput, setLocalInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // useChat (v5): devuelve sendMessage y status, no input/setInput/handleSubmit
  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("Error en el chat:", err)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = localInput.trim()
    if (!text || isLoading) return
    setLocalInput("")
    sendMessage({ text })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const text = localInput.trim()
      if (text && !isLoading) {
        setLocalInput("")
        sendMessage({ text })
      }
    }
  }

  // Contenido de mensaje: puede ser string o array de partes
  const getMessageContent = (m: (typeof messages)[0]): string => {
    if (typeof (m as { content?: string }).content === "string")
      return (m as { content: string }).content
    if (typeof (m as { text?: string }).text === "string") return (m as { text: string }).text
    const parts = (m as { parts?: { type: string; text?: string }[] }).parts
    if (Array.isArray(parts))
      return parts.map((p) => (p.type === "text" && p.text ? p.text : "")).join("")
    return ""
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[100]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-4 w-[90vw] md:w-[400px] h-[60vh] md:h-[600px] bg-background border rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between p-4 border-b bg-primary/10">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Asistente Financiero
            </h3>
            <span className="text-xs text-muted-foreground">IA Activa</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground opacity-80">
                <Bot className="h-12 w-12 mb-4 text-primary/20" />
                <p className="text-sm font-medium">¡Hola! Soy tu copiloto financiero.</p>
                <p className="text-xs mt-2">Pregúntame cosas como:</p>
                <div className="mt-4 space-y-2 text-xs w-full">
                  <div className="bg-background border p-2 rounded cursor-pointer hover:bg-accent">
                    "¿Cuánto gasté en comida este mes?"
                  </div>
                  <div className="bg-background border p-2 rounded cursor-pointer hover:bg-accent">
                    "Dime mi balance actual"
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p className="font-medium">{error.message}</p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role !== "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background border rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{getMessageContent(m)}</p>
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-background border rounded-2xl rounded-bl-none px-4 py-3 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
              <textarea
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu pregunta financiera..."
                className="flex-1 min-h-[50px] max-h-[120px] w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                rows={1}
                aria-label="Mensaje para el asistente"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !localInput.trim()}
                className="h-12 w-12 rounded-xl shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
