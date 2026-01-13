'use client'

import type { IntentType, ClassificationResult } from './ai-service'
import type { Transaction } from './db'
import { 
  getAllTransactions, 
  getTransactionsByType, 
  getTransactionsByCategory,
  getTotalBalance 
} from './db'

// Resultado de la búsqueda
export interface SearchResult {
  transactions: Transaction[]
  total?: number
  message?: string
}

/**
 * Mapea la intención detectada por la IA a una consulta en la base de datos
 */
export async function mapIntentToQuery(
  classification: ClassificationResult
): Promise<SearchResult> {
  const { intent, category } = classification

  switch (intent) {
    case 'ver_gastos':
      return await handleVerGastos(category)
    
    case 'ver_ingresos':
      return await handleVerIngresos()
    
    case 'ver_saldo':
      return await handleVerSaldo()
    
    case 'filtrar_por_categoria':
      return await handleFiltrarPorCategoria(category)
    
    default:
      return {
        transactions: [],
        message: 'No pude entender tu solicitud. Intenta con: "ver gastos", "ver ingresos", "ver saldo" o "gastos en comida"'
      }
  }
}

/**
 * Maneja la intención de ver gastos
 */
async function handleVerGastos(category?: string): Promise<SearchResult> {
  if (category) {
    // Filtrar gastos por categoría específica
    const transactions = await getTransactionsByCategory(category)
    const gastos = transactions.filter(tx => tx.type === 'expense')
    const total = gastos.reduce((sum, tx) => sum + tx.amount, 0)
    
    return {
      transactions: gastos,
      total,
      message: `Gastos en esta categoría: ${gastos.length} transacciones, Total: $${total.toLocaleString('es-CL')}`
    }
  } else {
    // Todos los gastos
    const transactions = await getTransactionsByType('expense')
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    
    return {
      transactions,
      total,
      message: `Total de gastos: ${transactions.length} transacciones, Total: $${total.toLocaleString('es-CL')}`
    }
  }
}

/**
 * Maneja la intención de ver ingresos
 */
async function handleVerIngresos(): Promise<SearchResult> {
  const transactions = await getTransactionsByType('income')
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  
  return {
    transactions,
    total,
    message: `Total de ingresos: ${transactions.length} transacciones, Total: $${total.toLocaleString('es-CL')}`
  }
}

/**
 * Maneja la intención de ver saldo
 */
async function handleVerSaldo(): Promise<SearchResult> {
  const balance = await getTotalBalance()
  
  // También obtenemos un resumen de transacciones recientes
  const allTransactions = await getAllTransactions()
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
 * Maneja la intención de filtrar por categoría
 */
async function handleFiltrarPorCategoria(category?: string): Promise<SearchResult> {
  if (!category) {
    return {
      transactions: [],
      message: 'No pude identificar la categoría. Intenta con: "gastos en comida", "transporte", etc.'
    }
  }
  
  const transactions = await getTransactionsByCategory(category)
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  
  return {
    transactions,
    total,
    message: `Transacciones en esta categoría: ${transactions.length}, Total: $${total.toLocaleString('es-CL')}`
  }
}
