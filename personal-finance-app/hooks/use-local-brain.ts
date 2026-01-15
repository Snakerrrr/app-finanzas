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
  intent: 'filter_transactions' | 'get_balance' | 'get_summary' | 'create_transaction'
  operation?: 'LIST' | 'SUM_TOTAL' | 'COUNT' // Opcional cuando intent es create_transaction
  filters?: {
    type: 'expense' | 'income' | null
    category: string | null
    minAmount: number | null
    maxAmount: number | null
    startDate: string | null // YYYY-MM-DD
    endDate: string | null // YYYY-MM-DD
  }
  groupBy?: 'category' | 'date' | null
  visualization?: 'table' | 'pie_chart' | 'bar_chart' | 'single_value'
  createData?: {
    amount: number
    category: string
    description: string
    type: 'expense' | 'income'
    date: string // YYYY-MM-DD o ISO string
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

// Función para limpiar el engine y resetear el estado
function resetGlobalEngine() {
  if (globalEngine) {
    try {
      // Intentar limpiar el engine si tiene método dispose
      if (typeof globalEngine.dispose === 'function') {
        globalEngine.dispose()
      }
    } catch (error) {
      console.warn('Error al limpiar engine:', error)
    }
    globalEngine = null
  }
  isInitializing = false
  initializationPromise = null
  globalState = {
    isLoading: false,
    isReady: false,
    progress: { text: 'Inicializando...', progress: 0 },
    error: null
  }
  notifyProgressCallbacks(globalState)
}

// Callbacks de progreso registrados (para notificar a todos los componentes)
const progressCallbacks = new Set<(state: LocalBrainState) => void>()

// Función para notificar a todos los callbacks registrados
function notifyProgressCallbacks(state: LocalBrainState) {
  globalState = state
  progressCallbacks.forEach(callback => callback(state))
}

// Función para generar el system prompt con categorías dinámicas
function generateSystemPrompt(categorias: string[]): string {
  const categoriasList = categorias.length > 0 
    ? categorias.map(cat => `"${cat}"`).join(', ')
    : 'ninguna categoría disponible'
  
  return `Eres un traductor de lenguaje natural a consultas de base de datos JSON. 
Tu única función es convertir consultas del usuario en objetos JSON válidos.

⚠️ REGLAS CRÍTICAS - DEBES SEGUIRLAS ESTRICTAMENTE:
1. NUNCA respondas con texto conversacional, explicaciones, o comentarios
2. NUNCA agregues texto antes o después del JSON
3. SOLO devuelve el objeto JSON, sin markdown (sin \`\`\`json), sin código, sin texto adicional
4. NO incluyas ejemplos, instrucciones, o sugerencias
5. El JSON debe tener una de estas dos estructuras según la intención:

ESTRUCTURA A - CONSULTAR (cuando el usuario quiere SABER algo):
{
  "intent": "filter_transactions" | "get_balance" | "get_summary",
  "operation": "LIST" | "SUM_TOTAL" | "COUNT",
  "filters": {
    "type": "expense" | "income" | null,
    "category": string | null,
    "minAmount": number | null,
    "maxAmount": number | null,
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null
  },
  "groupBy": "category" | "date" | null,
  "visualization": "table" | "pie_chart" | "bar_chart" | "single_value"
}

ESTRUCTURA B - CREAR (cuando el usuario quiere INGRESAR/REGISTRAR algo):
{
  "intent": "create_transaction",
  "createData": {
    "amount": number,
    "category": string,
    "description": string,
    "type": "expense" | "income",
    "date": "YYYY-MM-DD"
  }
}

OPERACIONES:
- "LIST": Para listar transacciones (mostrar tabla). Usa cuando el usuario pide "ver", "mostrar", "listar".
- "SUM_TOTAL": Para calcular totales (mostrar suma). Usa cuando el usuario pide "total", "suma", "cuánto", "cuanto es", "cuánto gasté".
- "COUNT": Para contar transacciones. Usa cuando el usuario pide "cuántas", "cuantos", "número de".

VISUALIZACIONES:
- "table": Para mostrar lista detallada de transacciones. Usa por defecto cuando no hay necesidad de gráfico.
- "pie_chart": Para mostrar distribución o comparación. Usa cuando el usuario pide "distribución", "comparativa", "por categoría", "desglose".
- "bar_chart": Para mostrar evolución temporal o comparación. Usa cuando el usuario pide "evolución", "diario", "semanal", "mensual", "tendencia", "comparar".
- "single_value": Para mostrar un solo número grande (total, saldo). Usa cuando el usuario pide un total simple sin desglose.

AGRUPACIÓN (groupBy):
- "category": Agrupa por categoría. Usa cuando el usuario pide "por categoría", "distribución por categoría", "gastos por tipo".
- "date": Agrupa por fecha. Usa cuando el usuario pide "evolución", "diario", "por día", "por mes", "tendencia".
- null: No agrupar. Usa cuando solo se necesita el total o la lista simple.

REGLAS DE VISUALIZACIÓN:
- Si el usuario pide "distribución" o "por categoría" → visualization: "pie_chart", groupBy: "category"
- Si el usuario pide "evolución" o "diario" → visualization: "bar_chart", groupBy: "date"
- Si el usuario pide solo un total simple → visualization: "single_value", groupBy: null
- Si el usuario pide "ver" o "listar" sin más contexto → visualization: "table", groupBy: null

CATEGORÍAS DISPONIBLES (debes mapear estrictamente a una de estas):
${categoriasList}

IMPORTANTE sobre categorías:
- Si el usuario menciona una categoría, DEBES mapearla a una de las categorías disponibles arriba
- Si no hay coincidencia exacta, busca la más similar (ej: "comida" → "Supermercado" o "Delivery/Restaurantes")
- Si no puedes mapear, usa null en el campo "category"

INTENTOS:
- "filter_transactions": Para filtrar/consultar transacciones (gastos, ingresos, por categoría, por fecha, etc.)
- "get_balance": Para obtener el saldo total
- "get_summary": Para obtener un resumen (total de gastos, total de ingresos)
- "create_transaction": Para CREAR/REGISTRAR una nueva transacción (gasto o ingreso)

DETECCIÓN DE INTENCIÓN:
- Si el usuario dice: "ver", "mostrar", "listar", "cuánto", "cuántas", "total", "saldo", "resumen" → intent: "filter_transactions" | "get_balance" | "get_summary"
- Si el usuario dice: "gasté", "compré", "pagué", "ingresé", "cobré", "recibí", "gasto de", "comprar", "pagar" → intent: "create_transaction"

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

EJEMPLOS DE CONSULTA:
Usuario: "ver gastos" → {"intent":"filter_transactions","operation":"LIST","filters":{"type":"expense","category":null,"minAmount":null,"maxAmount":null,"startDate":null,"endDate":null},"groupBy":null,"visualization":"table"}
Usuario: "distribución de gastos por categoría" → {"intent":"filter_transactions","operation":"SUM_TOTAL","filters":{"type":"expense","category":null,"minAmount":null,"maxAmount":null,"startDate":null,"endDate":null},"groupBy":"category","visualization":"pie_chart"}
Usuario: "cuánto gasté este mes" → {"intent":"filter_transactions","operation":"SUM_TOTAL","filters":{"type":"expense","category":null,"minAmount":null,"maxAmount":null,"startDate":"2026-01-01","endDate":"2026-01-31"},"groupBy":null,"visualization":"single_value"}
Usuario: "total de ingresos" → {"intent":"filter_transactions","operation":"SUM_TOTAL","filters":{"type":"income","category":null,"minAmount":null,"maxAmount":null,"startDate":null,"endDate":null},"groupBy":null,"visualization":"single_value"}

EJEMPLOS DE CREACIÓN:
Usuario: "Gasté 120000 en el jumbo" → {"intent":"create_transaction","createData":{"amount":120000,"category":"Supermercado","description":"Jumbo","type":"expense","date":"2026-01-12"}}
Usuario: "Compré comida por 50k" → {"intent":"create_transaction","createData":{"amount":50000,"category":"Comida","description":"Comida","type":"expense","date":"2026-01-12"}}
Usuario: "Pagué 30 mil en transporte" → {"intent":"create_transaction","createData":{"amount":30000,"category":"Transporte","description":"Transporte","type":"expense","date":"2026-01-12"}}
Usuario: "Cobré 500000 de sueldo" → {"intent":"create_transaction","createData":{"amount":500000,"category":"Trabajo","description":"Sueldo","type":"income","date":"2026-01-12"}}
Usuario: "Ingresé 100k" → {"intent":"create_transaction","createData":{"amount":100000,"category":"Otros","description":"Ingreso","type":"income","date":"2026-01-12"}}

REGLAS DE EXTRACCIÓN PARA CREACIÓN:
- amount: Extrae el número. Si dice "120k" o "120 mil", convierte a 120000. Si dice "50.000", usa 50000. Elimina símbolos de moneda ($, CLP, etc.)
- category: Mapea el texto a una de las categorías disponibles. Si dice "jumbo", "supermercado", "comida" → "Supermercado". Si dice "uber", "taxi", "transporte" → "Transporte". Si no calza, usa "Otros".
- description: Extrae una descripción breve (ej: "Jumbo", "Uber", "Sueldo"). Si no hay contexto, usa la categoría.
- type: "expense" si dice "gasté", "compré", "pagué". "income" si dice "ingresé", "cobré", "recibí".
- date: Si no especifica fecha, usa la fecha actual ({CURRENT_DATE}). Si dice "ayer", calcula ayer. Si dice "hace 3 días", calcula esa fecha.

🚨 CRÍTICO: 
- Responde ÚNICAMENTE con el objeto JSON
- NO agregues texto antes del JSON
- NO agregues texto después del JSON
- NO expliques nada
- NO des ejemplos
- SOLO el JSON, nada más

Formato de respuesta esperado (SOLO esto, sin nada más):
Para consultas: {"intent":"filter_transactions","operation":"...","filters":{...},"groupBy":...","visualization":"..."}
Para crear: {"intent":"create_transaction","createData":{"amount":...,"category":"...","description":"...","type":"...","date":"..."}}`
}

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
      
      // Detectar errores específicos de GPU/WebGPU
      let errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar el modelo'
      let isDeviceLost = false
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase()
        if (
          errorStr.includes('device was lost') ||
          errorStr.includes('device lost') ||
          errorStr.includes('external instance reference') ||
          errorStr.includes('gpu device lost')
        ) {
          isDeviceLost = true
          errorMessage = 'El dispositivo GPU se perdió. Esto puede deberse a memoria insuficiente o restricciones del GPU. Por favor, recarga la página o cierra otras pestañas que usen WebGPU.'
        }
      }
      
      // Si es un error de device lost, limpiar el engine
      if (isDeviceLost) {
        resetGlobalEngine()
      }
      
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
   * Limpia y parsea el JSON de la respuesta del modelo
   * Función robusta que maneja múltiples casos: JSON dentro de markdown, texto antes/después, etc.
   */
  const cleanAndParseJSON = (text: string): any => {
    if (!text || typeof text !== 'string') {
      throw new Error('El texto recibido no es válido')
    }

    let cleaned = text.trim()
    
    // 1. Eliminar markdown code blocks (```json ... ```)
    cleaned = cleaned.replace(/```json\s*/gi, '')
    cleaned = cleaned.replace(/```\s*/g, '')
    
    // 2. Buscar el primer objeto JSON válido balanceando llaves
    // Esto maneja el caso de múltiples objetos JSON concatenados
    const firstBrace = cleaned.indexOf('{')
    if (firstBrace === -1) {
      throw new Error('No se encontró un objeto JSON en la respuesta')
    }
    
    // 3. Balancear llaves para encontrar el cierre del primer objeto JSON
    // IMPORTANTE: Ignorar llaves dentro de strings para evitar falsos positivos
    let braceCount = 0
    let inString = false
    let escapeNext = false
    let lastBrace = -1
    
    for (let i = firstBrace; i < cleaned.length; i++) {
      const char = cleaned[i]
      
      // Manejar caracteres escapados
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      // Detectar inicio/fin de strings
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      // Solo contar llaves si NO estamos dentro de un string
      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            // Encontramos el cierre del primer objeto JSON
            lastBrace = i
            break
          }
        }
      }
    }
    
    if (lastBrace === -1 || lastBrace <= firstBrace) {
      // Fallback: intentar encontrar el último } si el balanceo falló
      const lastBraceIndex = cleaned.lastIndexOf('}')
      if (lastBraceIndex <= firstBrace) {
        throw new Error('No se encontró un JSON válido con llaves balanceadas')
      }
      lastBrace = lastBraceIndex
    }
    
    // 4. Extraer SOLO el primer objeto JSON (ignorar cualquier objeto adicional concatenado)
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    
    // 5. Limpiar espacios y saltos de línea innecesarios
    cleaned = cleaned.trim()
    
    // 6. Validar que empiece con { y termine con }
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      throw new Error('El JSON extraído no tiene el formato correcto')
    }
    
    // 7. Intentar parsear
    try {
      const parsed = JSON.parse(cleaned)
      
      // 8. Validar que sea un objeto (no array ni primitivo)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('El JSON parseado no es un objeto válido')
      }
      
      return parsed
    } catch (parseError) {
      console.error('❌ Error al parsear JSON:', parseError)
      console.error('📄 Texto que falló:', cleaned)
      console.error('📋 Texto original completo:', text)
      
      // Intentar un último fallback: buscar cualquier objeto JSON válido con un enfoque más permisivo
      const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/
      const fallbackMatch = text.match(jsonPattern)
      
      if (fallbackMatch) {
        try {
          const fallbackParsed = JSON.parse(fallbackMatch[0])
          console.warn('⚠️ Se usó un fallback para parsear el JSON')
          return fallbackParsed
        } catch {
          // Si el fallback también falla, lanzar el error original
        }
      }
      
      throw new Error(`Error al parsear JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`)
    }
  }

  /**
   * Limpia el texto de respuesta del modelo para extraer solo el JSON (método legacy, usa cleanAndParseJSON)
   */
  const cleanJSONResponse = (text: string): string => {
    if (!text || typeof text !== 'string') {
      throw new Error('El texto recibido no es válido')
    }

    let cleaned = text.trim()
    
    // 1. Eliminar markdown code blocks (```json ... ```)
    cleaned = cleaned.replace(/```json\s*/gi, '')
    cleaned = cleaned.replace(/```\s*/g, '')
    
    // 2. Buscar el primer { que probablemente sea el inicio del JSON
    const firstBrace = cleaned.indexOf('{')
    
    if (firstBrace === -1) {
      // Si no hay {, buscar otros patrones
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      } else {
        throw new Error('No se encontró un objeto JSON en la respuesta')
      }
    } else {
      // 3. Encontrar el } correspondiente (manejar JSON anidado)
      let braceCount = 0
      let lastBrace = -1
      
      for (let i = firstBrace; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          braceCount++
        } else if (cleaned[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            lastBrace = i
            break
          }
        }
      }
      
      if (lastBrace === -1 || lastBrace <= firstBrace) {
        // Fallback: buscar el último } después del primer {
        lastBrace = cleaned.lastIndexOf('}')
        if (lastBrace <= firstBrace) {
          throw new Error('No se encontró un JSON válido con llaves balanceadas')
        }
      }
      
      // 4. Extraer solo el JSON
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    
    // 5. Limpiar espacios y saltos de línea innecesarios
    cleaned = cleaned.trim()
    
    // 6. Validar que empiece con { y termine con }
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      throw new Error('El JSON extraído no tiene el formato correcto')
    }
    
    return cleaned
  }

  /**
   * Consulta al modelo con una pregunta del usuario
   * @param userQuery Consulta del usuario en lenguaje natural
   * @param categorias Lista de categorías del usuario para mapeo dinámico
   */
  const askDatabase = useCallback(async (
    userQuery: string, 
    categorias: string[] = []
  ): Promise<DatabaseQuery> => {
    // Usar el engine global (puede ser el ref o el global directo)
    const engine = engineRef.current || globalEngine
    
    if (!engine || !state.isReady) {
      throw new Error('El modelo no está listo')
    }

    try {
      // Obtener fecha actual para el prompt
      const currentDate = new Date()
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Generar system prompt con categorías dinámicas
      const systemPrompt = generateSystemPrompt(categorias).replace('{CURRENT_DATE}', dateStr)

      // Verificar que el engine aún sea válido antes de usar
      if (!engine) {
        throw new Error('El motor se perdió. Por favor, recarga la página.')
      }

      // Generar respuesta del modelo usando la API de WebLLM
      let response
      try {
        response = await engine.chat.completions.create({
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
      } catch (error) {
        // Detectar si el error es por device lost durante la inferencia
        if (error instanceof Error) {
          const errorStr = error.message.toLowerCase()
          if (
            errorStr.includes('device was lost') ||
            errorStr.includes('device lost') ||
            errorStr.includes('external instance reference') ||
            errorStr.includes('gpu device lost') ||
            errorStr.includes('instance dropped')
          ) {
            // Limpiar el engine y resetear
            resetGlobalEngine()
            throw new Error('El dispositivo GPU se perdió durante la inferencia. Por favor, recarga la página.')
          }
        }
        throw error
      }

      // Extraer el texto de la respuesta
      const rawText = response.choices[0]?.message?.content || ''
      
      if (!rawText) {
        throw new Error('El modelo no devolvió ninguna respuesta')
      }
      
      console.log('📝 Texto recibido del modelo:', rawText)
      
      // Limpiar y parsear JSON usando la función robusta
      let query: DatabaseQuery
      try {
        query = cleanAndParseJSON(rawText)
        console.log('✅ JSON parseado correctamente:', query)
      } catch (error) {
        console.error('❌ Error al procesar JSON:', error)
        console.error('📄 Texto original:', rawText)
        throw new Error(`Error al procesar respuesta del modelo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }

      // Validar estructura básica según el intent
      if (!query.intent) {
        throw new Error('El JSON no tiene la estructura esperada: falta el campo "intent"')
      }

      // Validar según el tipo de intent
      if (query.intent === 'create_transaction') {
        // Validar estructura de creación
        if (!query.createData) {
          throw new Error('El JSON de creación no tiene la estructura esperada: falta el campo "createData"')
        }
        if (!query.createData.amount || typeof query.createData.amount !== 'number') {
          throw new Error('El campo "amount" es requerido y debe ser un número')
        }
        if (!query.createData.type || (query.createData.type !== 'expense' && query.createData.type !== 'income')) {
          throw new Error('El campo "type" es requerido y debe ser "expense" o "income"')
        }
        if (!query.createData.category) {
          query.createData.category = 'Otros'
        }
        if (!query.createData.description) {
          query.createData.description = query.createData.category
        }
        if (!query.createData.date) {
          // Usar fecha actual si no se especifica
          const now = new Date()
          query.createData.date = now.toISOString().split('T')[0]
        }
      } else {
        // Validar estructura de consulta
        if (!query.filters) {
          throw new Error('El JSON de consulta no tiene la estructura esperada: falta el campo "filters"')
        }

        // Validar y establecer valores por defecto si no están presentes
        if (!query.operation) {
          // Inferir operation basado en el intent
          if (query.intent === 'get_balance' || query.intent === 'get_summary') {
            query.operation = 'SUM_TOTAL'
          } else {
            query.operation = 'LIST'
          }
          console.log('⚠️ Campo "operation" no encontrado, usando valor por defecto:', query.operation)
        }

        // Validar y establecer visualization por defecto
        if (!query.visualization) {
          if (query.operation === 'SUM_TOTAL' && !query.groupBy) {
            query.visualization = 'single_value'
          } else if (query.groupBy === 'category') {
            query.visualization = 'pie_chart'
          } else if (query.groupBy === 'date') {
            query.visualization = 'bar_chart'
          } else {
            query.visualization = 'table'
          }
          console.log('⚠️ Campo "visualization" no encontrado, usando valor por defecto:', query.visualization)
        }

        // Validar groupBy
        if (query.groupBy && query.groupBy !== 'category' && query.groupBy !== 'date') {
          query.groupBy = null
          console.log('⚠️ Campo "groupBy" inválido, usando null')
        }
      }

      return query
    } catch (error) {
      console.error('Error en askDatabase:', error)
      throw error
    }
  }, [state.isReady])

  // Función para reintentar la inicialización
  const retryInitialization = useCallback(async () => {
    resetGlobalEngine()
    try {
      const engine = await initializeGlobalEngine()
      engineRef.current = engine
      setState(globalState)
    } catch (error) {
      setState(globalState)
    }
  }, [])

  return {
    ...state,
    askDatabase,
    retryInitialization,
    engine: engineRef.current || globalEngine
  }
}
