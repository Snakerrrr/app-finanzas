'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CreateMLCEngine } from '@mlc-ai/web-llm'

// Tipos para el progreso de carga
export interface LoadingProgress {
  text: string
  progress: number // 0-100
}

// Tipo para el resultado de la consulta a la base de datos
export interface DatabaseQuery {
  intent: 'filter_transactions' | 'get_balance' | 'get_summary'
  filters: {
    type: 'expense' | 'income' | null
    category: string | null
    minAmount: number | null
    maxAmount: number | null
    startDate: string | null // YYYY-MM-DD
    endDate: string | null // YYYY-MM-DD
  }
}

// Estado del hook
interface LocalBrainState {
  isLoading: boolean
  isReady: boolean
  progress: LoadingProgress
  error: string | null
}

// ============================================================================
// PATRÓN SINGLETON: Variables globales a nivel de módulo
// ============================================================================

// Instancia global del motor WebLLM (Singleton)
let globalEngine: any = null

// Estado global compartido entre todas las instancias del hook
let globalState: LocalBrainState = {
  isLoading: false,
  isReady: false,
  progress: { text: 'Inicializando...', progress: 0 },
  error: null
}

// Flag para prevenir inicializaciones concurrentes
let isInitializing = false

// Promesa de inicialización compartida (para manejar concurrencia)
let initializationPromise: Promise<any> | null = null

// Callbacks de progreso registrados (para notificar a todos los componentes)
const progressCallbacks = new Set<(state: LocalBrainState) => void>()

// Función para notificar a todos los callbacks registrados
function notifyProgressCallbacks(state: LocalBrainState) {
  globalState = state
  progressCallbacks.forEach(callback => callback(state))
}

// System prompt estricto para el modelo
const SYSTEM_PROMPT = `Eres un traductor de lenguaje natural a consultas de base de datos JSON. 
Tu única función es convertir consultas del usuario en objetos JSON válidos.

REGLAS ESTRICTAS:
1. NUNCA respondas con texto conversacional o explicaciones
2. SOLO devuelve un objeto JSON válido, sin markdown, sin código, sin texto adicional
3. El JSON debe tener exactamente esta estructura:
{
  "intent": "filter_transactions" | "get_balance" | "get_summary",
  "filters": {
    "type": "expense" | "income" | null,
    "category": string | null,
    "minAmount": number | null,
    "maxAmount": number | null,
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null
  }
}

INTENTOS:
- "filter_transactions": Para filtrar transacciones (gastos, ingresos, por categoría, por fecha, etc.)
- "get_balance": Para obtener el saldo total
- "get_summary": Para obtener un resumen (total de gastos, total de ingresos)

FILTROS:
- type: "expense" para gastos, "income" para ingresos, null para ambos
- category: nombre de categoría mencionada (ej: "comida", "transporte", "supermercado")
- minAmount: monto mínimo si se menciona (ej: "más de 10000")
- maxAmount: monto máximo si se menciona (ej: "menos de 50000")
- startDate: fecha de inicio en formato YYYY-MM-DD (ej: "esta semana", "mes pasado")
- endDate: fecha de fin en formato YYYY-MM-DD

FECHAS RELATIVAS (usa la fecha actual: {CURRENT_DATE}):
- "hoy" → startDate y endDate = hoy
- "ayer" → startDate y endDate = ayer
- "esta semana" → startDate = lunes de esta semana, endDate = hoy
- "semana pasada" → startDate = lunes semana pasada, endDate = domingo semana pasada
- "este mes" → startDate = primer día del mes, endDate = hoy
- "mes pasado" → startDate = primer día mes pasado, endDate = último día mes pasado

EJEMPLOS:
Usuario: "ver gastos" → {"intent":"filter_transactions","filters":{"type":"expense","category":null,"minAmount":null,"maxAmount":null,"startDate":null,"endDate":null}}
Usuario: "gastos en comida" → {"intent":"filter_transactions","filters":{"type":"expense","category":"comida","minAmount":null,"maxAmount":null,"startDate":null,"endDate":null}}
Usuario: "ingresos de esta semana" → {"intent":"filter_transactions","filters":{"type":"income","category":null,"minAmount":null,"maxAmount":null,"startDate":"2026-01-13","endDate":"2026-01-19"}}
Usuario: "ver saldo" → {"intent":"get_balance","filters":{"type":null,"category":null,"minAmount":null,"maxAmount":null,"startDate":null,"endDate":null}}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`

/**
 * Inicializa el motor WebLLM globalmente (Singleton)
 */
async function initializeGlobalEngine(): Promise<any> {
  // Si ya existe, retornarlo inmediatamente
  if (globalEngine) {
    return globalEngine
  }

  // Si ya está inicializando, esperar a que termine
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Marcar como inicializando
  isInitializing = true
  notifyProgressCallbacks({
    isLoading: true,
    isReady: false,
    error: null,
    progress: { text: 'Inicializando motor WebLLM...', progress: 0 }
  })

  // Crear la promesa de inicialización
  initializationPromise = (async () => {
    try {
      // Callback de progreso que notifica a todos los componentes
      const initProgressCallback = (report: any) => {
        const text = report.text || 'Cargando modelo...'
        const progress = Math.round((report.progress || 0) * 100)
        
        notifyProgressCallbacks({
          ...globalState,
          progress: { text, progress }
        })
      }

      // Crear el motor con Phi-3.5-mini
      const engine = await CreateMLCEngine(
        'Phi-3.5-mini-instruct-q4f16_1-MLC',
        {
          initProgressCallback,
        }
      )

      // Guardar la instancia global
      globalEngine = engine
      isInitializing = false
      initializationPromise = null

      // Notificar que está listo
      notifyProgressCallbacks({
        isLoading: false,
        isReady: true,
        error: null,
        progress: { text: 'Modelo listo', progress: 100 }
      })

      return engine
    } catch (error) {
      isInitializing = false
      initializationPromise = null
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar el modelo'
      
      notifyProgressCallbacks({
        isLoading: false,
        isReady: false,
        error: errorMessage,
        progress: { text: 'Error al cargar', progress: 0 }
      })

      throw error
    }
  })()

  return initializationPromise
}

/**
 * Hook personalizado para usar WebLLM con Phi-3.5-mini (Singleton)
 */
export function useLocalBrain() {
  // Estado local que se sincroniza con el estado global
  const [state, setState] = useState<LocalBrainState>(globalState)
  const engineRef = useRef<any>(globalEngine)

  // Registrar callback de progreso
  useEffect(() => {
    const progressCallback = (newState: LocalBrainState) => {
      setState(newState)
    }
    
    progressCallbacks.add(progressCallback)
    
    // Sincronizar estado inicial
    setState(globalState)
    
    return () => {
      progressCallbacks.delete(progressCallback)
    }
  }, [])

  // Inicializar el motor (solo si no existe)
  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      // CASO A: El motor ya existe y está listo
      if (globalEngine && globalState.isReady) {
        engineRef.current = globalEngine
        setState(globalState)
        return
      }

      // CASO B: El motor no existe, inicializarlo
      try {
        const engine = await initializeGlobalEngine()
        
        if (isMounted) {
          engineRef.current = engine
          setState(globalState)
        }
      } catch (error) {
        if (isMounted) {
          setState(globalState)
        }
      }
    }

    initialize()

    // NO hacer cleanup - mantener el engine en memoria global
    // Esto evita que se descargue cuando el componente se desmonta
    return () => {
      isMounted = false
      // No hacer unload aquí - mantener el engine en memoria global
    }
  }, [])

  /**
   * Limpia el texto de respuesta del modelo para extraer solo el JSON
   */
  const cleanJSONResponse = (text: string): string => {
    // Eliminar markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Buscar el primer { y último }
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    
    // Eliminar texto antes y después del JSON
    cleaned = cleaned.trim()
    
    return cleaned
  }

  /**
   * Consulta al modelo con una pregunta del usuario
   */
  const askDatabase = useCallback(async (userQuery: string): Promise<DatabaseQuery> => {
    // Usar el engine global (puede ser el ref o el global directo)
    const engine = engineRef.current || globalEngine
    
    if (!engine || !state.isReady) {
      throw new Error('El modelo no está listo')
    }

    try {
      // Obtener fecha actual para el prompt
      const currentDate = new Date()
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Construir el system prompt con la fecha actual
      const systemPrompt = SYSTEM_PROMPT.replace('{CURRENT_DATE}', dateStr)

      // Generar respuesta del modelo usando la API de WebLLM
      const response = await engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0,
        max_gen_len: 512
      })

      // Extraer el texto de la respuesta
      const rawText = response.choices[0]?.message?.content || ''
      
      // Limpiar y parsear JSON
      const cleanedJSON = cleanJSONResponse(rawText)
      
      // Parsear el JSON
      let query: DatabaseQuery
      try {
        query = JSON.parse(cleanedJSON)
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError)
        console.error('Texto recibido:', rawText)
        console.error('Texto limpiado:', cleanedJSON)
        throw new Error('El modelo no devolvió un JSON válido')
      }

      // Validar estructura básica
      if (!query.intent || !query.filters) {
        throw new Error('El JSON no tiene la estructura esperada')
      }

      return query
    } catch (error) {
      console.error('Error en askDatabase:', error)
      throw error
    }
  }, [state.isReady])

  return {
    ...state,
    askDatabase,
    engine: engineRef.current || globalEngine
  }
}
