/**
 * Chat Store - Persistencia del historial de conversación
 *
 * Usa Zustand con middleware de persist para guardar mensajes en localStorage.
 * El usuario no pierde su conversación al recargar o cambiar de página.
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UIMessage } from "ai"

interface ChatStore {
  // Estado
  messages: UIMessage[]
  _hasHydrated: boolean
  
  // Acciones
  setMessages: (messages: UIMessage[]) => void
  addMessage: (message: UIMessage) => void
  clearMessages: () => void
  setHasHydrated: (state: boolean) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      // Estado inicial
      messages: [],
      _hasHydrated: false,

      // Reemplazar todos los mensajes (para sincronizar con useChat)
      setMessages: (messages) => set({ messages }),

      // Agregar un mensaje individual
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      // Limpiar historial
      clearMessages: () => set({ messages: [] }),

      // Marcar como hidratado
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "finanzas-chat-storage", // Clave en localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistir los mensajes (no las funciones ni _hasHydrated)
      partialize: (state) => ({ messages: state.messages }),
      // Callback cuando se completa la hidratación
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
