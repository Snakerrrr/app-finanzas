'use client'

import { pipeline } from '@xenova/transformers'
import type { Pipeline } from '@xenova/transformers'
import type { Categoria } from './types'

// Tipos de intención que la IA puede detectar
export type IntentType = 
  | 'ver_gastos'
  | 'ver_ingresos'
  | 'ver_saldo'
  | 'filtrar_por_categoria'
  | 'unknown'

// Etiquetas para la clasificación zero-shot (en inglés para mejor precisión del modelo)
const INTENT_LABELS = [
  'show all expenses or see expenses',
  'show all income or see income',
  'show total balance or see balance',
  'filter expenses by specific category'
]

// Mapeo de etiquetas a tipos de intención
const LABEL_TO_INTENT: Record<string, IntentType> = {
  'show all expenses or see expenses': 'ver_gastos',
  'show all income or see income': 'ver_ingresos',
  'show total balance or see balance': 'ver_saldo',
  'filter expenses by specific category': 'filtrar_por_categoria'
}

// Resultado de la clasificación
export interface ClassificationResult {
  intent: IntentType
  confidence: number
  category?: string // ID de categoría extraída del texto si aplica
  categoryName?: string // Nombre de la categoría mencionada
}

// Clase Singleton para el servicio de IA
class AIService {
  private static instance: AIService | null = null
  private model: Pipeline | null = null
  private loadingPromise: Promise<void> | null = null
  private isLoaded = false

  private constructor() {
    // Constructor privado para implementar Singleton
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Carga el modelo de clasificación zero-shot
   * Usa un patrón de promise compartida para evitar múltiples cargas simultáneas
   */
  public async loadModel(): Promise<void> {
    if (this.isLoaded && this.model) {
      return
    }

    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = (async () => {
      try {
        // Usamos un modelo ligero optimizado para web
        // 'Xenova/mobilebert-uncased-mnli' es muy ligero pero puede ser menos preciso
        // Alternativa más precisa pero más pesada: 'Xenova/distilbert-base-uncased-mnli'
        this.model = await pipeline(
          'zero-shot-classification',
          'Xenova/mobilebert-uncased-mnli',
          {
            quantized: true, // Usa versión cuantizada para mejor rendimiento
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                console.log(`Cargando modelo: ${Math.round(progress.progress * 100)}%`)
              }
            }
          }
        )
        this.isLoaded = true
        console.log('Modelo de IA cargado exitosamente')
      } catch (error) {
        console.error('Error al cargar el modelo de IA:', error)
        throw error
      } finally {
        this.loadingPromise = null
      }
    })()

    return this.loadingPromise
  }

  /**
   * Clasifica la intención del usuario a partir de su texto
   * @param userText Texto del usuario
   * @param categorias Lista de categorías del usuario para mapeo dinámico
   */
  public async classifyIntent(userText: string, categorias?: Categoria[]): Promise<ClassificationResult> {
    if (!this.model) {
      await this.loadModel()
    }

    if (!this.model) {
      return {
        intent: 'unknown',
        confidence: 0
      }
    }

    try {
      // Primero: detección de patrones simples (más rápido y preciso para casos comunes)
      const simplePattern = this.detectSimplePattern(userText)
      if (simplePattern) {
        const categoryInfo = this.extractCategory(userText, categorias)
        return {
          intent: simplePattern,
          confidence: 0.95, // Alta confianza para patrones simples
          category: categoryInfo?.id,
          categoryName: categoryInfo?.name
        }
      }

      // Segundo: usar el modelo de IA para casos más complejos
      const result = await this.model(userText, INTENT_LABELS)
      
      // Obtener la intención con mayor confianza
      const topLabel = result.labels[0]
      const topScore = result.scores[0]
      let intent = LABEL_TO_INTENT[topLabel] || 'unknown'

      // Si la confianza es baja y detectamos una categoría, probablemente es filtrar_por_categoria
      if (topScore < 0.5) {
        const categoryInfo = this.extractCategory(userText, categorias)
        if (categoryInfo) {
          intent = 'filtrar_por_categoria'
        }
      }

      // Intentar extraer categoría del texto
      const categoryInfo = this.extractCategory(userText, categorias)

      return {
        intent,
        confidence: topScore,
        category: categoryInfo?.id,
        categoryName: categoryInfo?.name
      }
    } catch (error) {
      console.error('Error al clasificar intención:', error)
      return {
        intent: 'unknown',
        confidence: 0
      }
    }
  }

  /**
   * Detecta patrones simples comunes sin usar el modelo de IA
   */
  private detectSimplePattern(text: string): IntentType | null {
    const lowerText = text.toLowerCase().trim()
    
    // Patrones para "ver gastos"
    if (/^(ver|mostrar|listar|ver todos los|ver todos)\s*(gastos|egresos|desembolsos)/.test(lowerText) ||
        /^(gastos|egresos|desembolsos)$/.test(lowerText)) {
      return 'ver_gastos'
    }
    
    // Patrones para "ver ingresos"
    if (/^(ver|mostrar|listar|ver todos los|ver todos)\s*(ingresos|sueldos|entradas)/.test(lowerText) ||
        /^(ingresos|sueldos|entradas)$/.test(lowerText)) {
      return 'ver_ingresos'
    }
    
    // Patrones para "ver saldo"
    if (/^(ver|mostrar|consultar|cuál es|cuanto es)\s*(el\s*)?(saldo|balance|balance total)/.test(lowerText) ||
        /^(saldo|balance|balance total)$/.test(lowerText)) {
      return 'ver_saldo'
    }
    
    return null
  }

  /**
   * Extrae la categoría mencionada en el texto del usuario
   * Primero busca en las categorías del usuario, luego en palabras clave
   */
  private extractCategory(text: string, categorias?: Categoria[]): { id: string; name: string } | undefined {
    const lowerText = text.toLowerCase()
    
    // Primero: buscar en las categorías del usuario por nombre
    if (categorias && categorias.length > 0) {
      for (const categoria of categorias) {
        const categoriaNameLower = categoria.nombre.toLowerCase()
        // Buscar si el nombre de la categoría está en el texto
        if (lowerText.includes(categoriaNameLower) || categoriaNameLower.includes(lowerText.split(' ').find(w => w.length > 3) || '')) {
          return { id: categoria.id, name: categoria.nombre }
        }
      }
      
      // También buscar palabras clave que coincidan con nombres de categorías
      const words = lowerText.split(/\s+/).filter(w => w.length > 3)
      for (const word of words) {
        const matchingCategoria = categorias.find(c => 
          c.nombre.toLowerCase().includes(word) || word.includes(c.nombre.toLowerCase())
        )
        if (matchingCategoria) {
          return { id: matchingCategoria.id, name: matchingCategoria.nombre }
        }
      }
    }
    
    // Segundo: mapeo de palabras clave a IDs de categoría (fallback para categorías por defecto)
    const categoryKeywords: Record<string, string> = {
      'comida': 'cat-4',
      'supermercado': 'cat-4',
      'alimento': 'cat-4',
      'restaurante': 'cat-12',
      'delivery': 'cat-12',
      'transporte': 'cat-5',
      'uber': 'cat-5',
      'bip': 'cat-5',
      'bencina': 'cat-6',
      'combustible': 'cat-6',
      'gasolina': 'cat-6',
      'salud': 'cat-9',
      'isapre': 'cat-9',
      'farmacia': 'cat-10',
      'medicina': 'cat-10',
      'internet': 'cat-8',
      'telefonía': 'cat-8',
      'servicios': 'cat-7',
      'luz': 'cat-7',
      'agua': 'cat-7',
      'arriendo': 'cat-3',
      'dividendo': 'cat-3',
      'suscripción': 'cat-11',
      'netflix': 'cat-11',
      'spotify': 'cat-11',
      'entretenimiento': 'cat-14',
      'cine': 'cat-14',
      'sueldo': 'cat-1',
      'ingreso': 'cat-1'
    }

    for (const [keyword, categoryId] of Object.entries(categoryKeywords)) {
      if (lowerText.includes(keyword)) {
        // Si tenemos categorías del usuario, buscar el ID real
        if (categorias) {
          const matchingCategoria = categorias.find(c => c.id === categoryId)
          if (matchingCategoria) {
            return { id: matchingCategoria.id, name: matchingCategoria.nombre }
          }
        }
        // Fallback: usar el ID hardcodeado
        return { id: categoryId, name: keyword }
      }
    }

    return undefined
  }

  /**
   * Verifica si el modelo está cargado
   */
  public isModelLoaded(): boolean {
    return this.isLoaded && this.model !== null
  }
}

// Exportar instancia singleton
export const aiService = AIService.getInstance()
