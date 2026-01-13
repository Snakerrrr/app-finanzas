'use client'

import type { DatabaseQuery } from '@/hooks/use-local-brain'
import type { Transaction } from './db'
import type { Categoria } from './types'
import { 
  getAllTransactions, 
  getTransactionsByType,
  getTransactionsByCategory 
} from './db'

// Resultado de la ejecución de la consulta
export interface QueryResult {
  transactions: Transaction[]
  total?: number
  message: string
}

/**
 * Ejecuta una consulta de base de datos basada en el JSON generado por la IA
 * @param query Consulta generada por la IA
 * @param categorias Lista de categorías del usuario para mapeo dinámico
 */
export async function executeDatabaseQuery(
  query: DatabaseQuery, 
  categorias?: Categoria[]
): Promise<QueryResult> {
  try {
    switch (query.intent) {
      case 'get_balance':
        return await executeGetBalance()
      
      case 'get_summary':
        return await executeGetSummary()
      
      case 'filter_transactions':
        return await executeFilterTransactions(query.filters, categorias)
      
      default:
        return {
          transactions: [],
          message: 'Intención no reconocida'
        }
    }
  } catch (error) {
    console.error('Error al ejecutar consulta:', error)
    return {
      transactions: [],
      message: 'Error al ejecutar la consulta'
    }
  }
}

/**
 * Obtiene el saldo total
 */
async function executeGetBalance(): Promise<QueryResult> {
  const allTransactions = await getAllTransactions()
  
  const balance = allTransactions.reduce((total, tx) => {
    if (tx.type === 'income') return total + tx.amount
    if (tx.type === 'expense') return total - tx.amount
    return total
  }, 0)

  // Obtener transacciones recientes para mostrar
  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return {
    transactions: recentTransactions,
    total: balance,
    message: `Saldo total: $${balance.toLocaleString('es-CL')}`
  }
}

/**
 * Obtiene un resumen (total de gastos e ingresos)
 */
async function executeGetSummary(): Promise<QueryResult> {
  const allTransactions = await getAllTransactions()
  
  const gastos = allTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  
  const ingresos = allTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  return {
    transactions: allTransactions.slice(0, 10), // Mostrar primeras 10
    total: ingresos - gastos,
    message: `Resumen: Ingresos $${ingresos.toLocaleString('es-CL')} - Gastos $${gastos.toLocaleString('es-CL')} = Saldo $${(ingresos - gastos).toLocaleString('es-CL')}`
  }
}

/**
 * Filtra transacciones según los filtros proporcionados
 */
async function executeFilterTransactions(
  filters: DatabaseQuery['filters'],
  categorias?: Categoria[]
): Promise<QueryResult> {
  let transactions: Transaction[] = []

  // Mapear nombre de categoría a ID si tenemos categorías del usuario
  let categoryId: string | null = filters.category
  
  if (filters.category && categorias && categorias.length > 0) {
    const categoryLower = filters.category.toLowerCase()
    const matchingCategoria = categorias.find(c => 
      c.nombre.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(c.nombre.toLowerCase())
    )
    if (matchingCategoria) {
      categoryId = matchingCategoria.id
    }
  }

  // Estrategia: empezar con todas las transacciones y filtrar progresivamente
  if (filters.type) {
    // Si hay tipo específico, usar la consulta optimizada
    transactions = await getTransactionsByType(filters.type)
  } else {
    // Si no hay tipo, obtener todas
    transactions = await getAllTransactions()
  }

  // Filtrar por categoría si está especificada
  if (categoryId) {
    // Buscar por ID de categoría
    const byCategory = await getTransactionsByCategory(categoryId)
    
    if (byCategory.length > 0) {
      transactions = transactions.filter(tx => 
        byCategory.some(catTx => catTx.id === tx.id)
      )
    } else {
      // Fallback: búsqueda por nombre en descripción
      const categoryLower = filters.category?.toLowerCase() || ''
      transactions = transactions.filter(tx => 
        tx.description.toLowerCase().includes(categoryLower) ||
        tx.category.toLowerCase().includes(categoryLower)
      )
    }
  }

  // Filtrar por rango de fechas
  if (filters.startDate || filters.endDate) {
    transactions = transactions.filter(tx => {
      const txDate = new Date(tx.date)
      const startDate = filters.startDate ? new Date(filters.startDate) : null
      const endDate = filters.endDate ? new Date(filters.endDate) : null
      
      if (startDate && txDate < startDate) return false
      if (endDate && txDate > endDate) return false
      
      return true
    })
  }

  // Filtrar por monto mínimo
  if (filters.minAmount !== null) {
    transactions = transactions.filter(tx => tx.amount >= filters.minAmount!)
  }

  // Filtrar por monto máximo
  if (filters.maxAmount !== null) {
    transactions = transactions.filter(tx => tx.amount <= filters.maxAmount!)
  }

  // Calcular total
  const total = transactions.reduce((sum, tx) => {
    if (filters.type === 'expense') return sum + tx.amount
    if (filters.type === 'income') return sum + tx.amount
    // Si no hay tipo, sumar ingresos y restar gastos
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
  }, 0)

  // Generar mensaje descriptivo
  const filtersDesc: string[] = []
  if (filters.type) filtersDesc.push(filters.type === 'expense' ? 'gastos' : 'ingresos')
  if (filters.category) filtersDesc.push(`categoría "${filters.category}"`)
  if (filters.startDate || filters.endDate) {
    const dateRange = filters.startDate === filters.endDate 
      ? filters.startDate 
      : `${filters.startDate || 'inicio'} a ${filters.endDate || 'hoy'}`
    filtersDesc.push(`fechas: ${dateRange}`)
  }
  if (filters.minAmount) filtersDesc.push(`mínimo $${filters.minAmount.toLocaleString('es-CL')}`)
  if (filters.maxAmount) filtersDesc.push(`máximo $${filters.maxAmount.toLocaleString('es-CL')}`)

  const filtersText = filtersDesc.length > 0 
    ? filtersDesc.join(', ')
    : 'todas las transacciones'

  const message = `${transactions.length} transacciones encontradas (${filtersText}). Total: $${Math.abs(total).toLocaleString('es-CL')}`

  return {
    transactions,
    total,
    message
  }
}
