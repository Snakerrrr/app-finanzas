"use client"

import { useChat } from "@ai-sdk/react"
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, Trash2 } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { UIMessage } from "ai"
import { useChatStore } from "@/lib/stores/chat-store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

/**
 * AiAssistantMobile - Versión móvil con Bottom Sheet
 *
 * Usa Drawer (bottom sheet) para mejor UX en móviles
 * - No tapa todo el contenido
 * - Ocupa 85vh para dejar ver el contexto
 * - Safe area para iOS (notch)
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

export function AiAssistantMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Store de persistencia
  const { messages: storedMessages, setMessages: setStoredMessages, clearMessages, _hasHydrated } = useChatStore()

  const { messages, sendMessage, status, error, setMessages } = useChat({
    // Empezar vacío - se restaurarán después de la hidratación
    initialMessages: [],
    onError: (err) => {
      console.error("Error en el chat:", err)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Restaurar mensajes desde localStorage después de la hidratación
  useEffect(() => {
    if (_hasHydrated && storedMessages.length > 0 && messages.length === 0) {
      setMessages(storedMessages)
    }
  }, [_hasHydrated, storedMessages, messages.length, setMessages])

  // Sincronizar mensajes con el store cada vez que cambien
  useEffect(() => {
    if (messages.length > 0) {
      setStoredMessages(messages)
    }
  }, [messages, setStoredMessages])

  // Función para confirmar limpieza del historial
  const handleConfirmClear = () => {
    clearMessages()
    setMessages([])
    setShowDeleteDialog(false)
  }

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

  // Filtrar: solo mensajes con texto visible
  const visibleMessages = messages.filter(
    (m) => m.role === "user" || (m.role === "assistant" && hasVisibleText(m))
  )

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-tr from-primary to-primary/80"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>

      {/* Drawer (Bottom Sheet) */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[70vh] pb-safe">
          {/* Header */}
          <DrawerHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 py-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <DrawerTitle className="text-sm">Asistente IA</DrawerTitle>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    <span>Activo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Botón para limpiar historial */}
                {messages.length > 0 && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Borrar historial"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </DrawerHeader>

          {/* Área de Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background/50 to-muted/20"
            style={{ maxHeight: "calc(70vh - 160px)" }}
          >
            {/* Estado Vacío */}
            {visibleMessages.length === 0 && !error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 animate-in zoom-in-50 duration-500">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1.5">¡Hola! 👋</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-[240px]">
                  Pregúntame sobre tus finanzas
                </p>

                {/* Sugerencias clickeables */}
                <div className="grid gap-1.5 w-full max-w-[260px]">
                  {[
                    { emoji: "💰", text: "¿Cuál es mi balance?" },
                    { emoji: "🍔", text: "Gastos en comida" },
                    { emoji: "📊", text: "Resumen del mes" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => handleSend(s.text)}
                      className="text-xs py-2 px-3 border rounded-lg hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left font-medium"
                    >
                      {s.emoji} {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <p className="font-medium mb-0.5">Error</p>
                <p className="text-[11px] opacity-80">{error.message}</p>
              </div>
            )}

            {/* Lista de Mensajes */}
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar del Bot */}
                {message.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}

                {/* Burbuja de Mensaje */}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm"
                  }`}
                >
                  <MessageContent text={getTextFromMessage(message)} />
                </div>
              </div>
            ))}

            {/* Indicador de Carga */}
            {isLoading && (
              <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2 shadow-sm">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {status === "submitted" ? "Analizando..." : "Escribiendo..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input de Mensaje */}
          <div className="p-3 border-t bg-background/80 backdrop-blur-sm pb-safe">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta algo..."
                  disabled={isLoading}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-11 w-11 rounded-xl shrink-0 shadow-lg disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-[9px] text-muted-foreground/60 text-center mt-2">
              AI con OpenAI
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog de confirmación para limpiar historial */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar todo el historial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará toda la conversación permanentemente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Borrar historial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Componente auxiliar: renderiza texto con **negritas** ─────────────────────

function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return (
    <div className="text-[13px] leading-snug whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}
