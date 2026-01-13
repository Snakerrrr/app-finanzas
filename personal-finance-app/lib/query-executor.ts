'use client'

import type { DatabaseQuery } from '@/hooks/use-local-brain'
import type { Transaction } from './db'
import type { Categoria } from './types'
import { 
  getAllTransactions, 
  getTransactionsByType,
  getTransactionsByCategory,
  db
} from './db'

// Re-exportar el tipo para uso en este módulo
export type { DatabaseQuery } from '@/hooks/use-local-brain'

// Datos agrupados para visualización
export interface GroupedData {
  label: string // Nombre de la categoría o fecha
  value: number // Total agrupado
  count?: number // Cantidad de transacciones en el grupo
}

// Resultado de la ejecución de la consulta
export interface QueryResult {
  transactions: Transaction[]
  total?: number
  count?: number
  operation?: 'LIST' | 'SUM_TOTAL' | 'COUNT' | 'CREATE'
  message: string
  groupedData?: GroupedData[] // Datos agrupados para gráficos
  visualization?: 'table' | 'pie_chart' | 'bar_chart' | 'single_value'
  groupBy?: 'category' | 'date' | null
  createdTransaction?: Transaction // Transacción creada (solo para create_transaction)
  status?: 'success' | 'error' // Estado de la operación
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
        return await executeFilterTransactions(query, categorias)
      
      case 'create_transaction':
        return await executeCreateTransaction(query, categorias)
      
      default:
        return {
          transactions: [],
          operation: 'LIST',
          message: 'Intención no reconocida',
          visualization: 'table',
          status: 'error'
        }
    }
  } catch (error) {
    console.error('Error al ejecutar consulta:', error)
    return {
      transactions: [],
      message: 'Error al ejecutar la consulta',
      operation: 'LIST',
      visualization: 'table',
      status: 'error'
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
    operation: 'SUM_TOTAL',
    message: `Saldo total: $${balance.toLocaleString('es-CL')}`,
    visualization: 'single_value'
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
    operation: 'SUM_TOTAL',
    message: `Resumen: Ingresos $${ingresos.toLocaleString('es-CL')} - Gastos $${gastos.toLocaleString('es-CL')} = Saldo $${(ingresos - gastos).toLocaleString('es-CL')}`,
    visualization: 'single_value'
  }
}

/**
 * Filtra transacciones según los filtros proporcionados
 */
async function executeFilterTransactions(
  query: DatabaseQuery,
  categorias?: Categoria[]
): Promise<QueryResult> {
  const filters = query.filters
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

  // Determinar la operación solicitada
  const operation = query.operation || 'LIST'
  const groupBy = query.groupBy || null
  const visualization = query.visualization || 'table'
  
  // Agrupar datos si es necesario
  let groupedData: GroupedData[] | undefined = undefined
  
  if (groupBy && transactions.length > 0) {
    const grouped = new Map<string, { total: number; count: number }>()
    
    transactions.forEach(tx => {
      let key: string
      
      if (groupBy === 'category') {
        // Agrupar por categoría
        key = tx.category || 'Sin categoría'
      } else if (groupBy === 'date') {
        // Agrupar por fecha (formato YYYY-MM-DD)
        key = tx.date
      } else {
        return
      }
      
      const existing = grouped.get(key) || { total: 0, count: 0 }
      existing.total += tx.amount
      existing.count += 1
      grouped.set(key, existing)
    })
    
    // Convertir a array y ordenar
    groupedData = Array.from(grouped.entries())
      .map(([label, data]) => {
        // Formatear fecha si es agrupación por fecha
        let displayLabel = label
        if (groupBy === 'date') {
          try {
            const date = new Date(label)
            displayLabel = date.toLocaleDateString('es-CL', { 
              month: 'short', 
              day: 'numeric',
              year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })
          } catch {
            displayLabel = label
          }
        }
        
        return {
          label: displayLabel,
          value: Math.abs(data.total),
          count: data.count,
          // Mantener la fecha original para ordenamiento
          _sortKey: groupBy === 'date' ? label : undefined
        }
      })
      .sort((a, b) => {
        // Si es por fecha, ordenar cronológicamente
        if (groupBy === 'date' && a._sortKey && b._sortKey) {
          return a._sortKey.localeCompare(b._sortKey)
        }
        // Si es por categoría, ordenar por valor descendente
        return b.value - a.value
      })
      .map(({ _sortKey, ...rest }) => rest) // Eliminar _sortKey del resultado final
  }
  
  // Calcular según la operación
  let resultTotal: number | undefined
  let resultCount: number | undefined
  let message: string

  if (operation === 'SUM_TOTAL') {
    resultTotal = transactions.reduce((sum, tx) => {
      if (filters.type === 'expense') return sum + tx.amount
      if (filters.type === 'income') return sum + tx.amount
      // Si no hay tipo, sumar ingresos y restar gastos
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
    }, 0)
    
    const filtersDesc: string[] = []
    if (filters.type) filtersDesc.push(filters.type === 'expense' ? 'gastos' : 'ingresos')
    if (filters.category) filtersDesc.push(`categoría "${filters.category}"`)
    if (filters.startDate || filters.endDate) {
      const dateRange = filters.startDate === filters.endDate 
        ? filters.startDate 
        : `${filters.startDate || 'inicio'} a ${filters.endDate || 'hoy'}`
      filtersDesc.push(`fechas: ${dateRange}`)
    }
    
    const filtersText = filtersDesc.length > 0 ? filtersDesc.join(', ') : 'todas las transacciones'
    message = `Total ${filtersText}: $${Math.abs(resultTotal).toLocaleString('es-CL')}`
    
  } else if (operation === 'COUNT') {
    resultCount = transactions.length
    
    const filtersDesc: string[] = []
    if (filters.type) filtersDesc.push(filters.type === 'expense' ? 'gastos' : 'ingresos')
    if (filters.category) filtersDesc.push(`categoría "${filters.category}"`)
    if (filters.startDate || filters.endDate) {
      const dateRange = filters.startDate === filters.endDate 
        ? filters.startDate 
        : `${filters.startDate || 'inicio'} a ${filters.endDate || 'hoy'}`
      filtersDesc.push(`fechas: ${dateRange}`)
    }
    
    const filtersText = filtersDesc.length > 0 ? filtersDesc.join(', ') : 'transacciones'
    message = `${resultCount} ${filtersText} encontradas`
    
  } else {
    // LIST (por defecto)
    resultTotal = transactions.reduce((sum, tx) => {
      if (filters.type === 'expense') return sum + tx.amount
      if (filters.type === 'income') return sum + tx.amount
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
    }, 0)
    
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

    message = `${transactions.length} transacciones encontradas (${filtersText}). Total: $${Math.abs(resultTotal).toLocaleString('es-CL')}`
  }

  return {
    transactions,
    total: resultTotal,
    count: resultCount,
    operation,
    message,
    groupedData,
    visualization,
    groupBy
  }
}

/**
 * Crea una nueva transacción basada en los datos generados por la IA
 */
async function executeCreateTransaction(
  query: DatabaseQuery,
  categorias?: Categoria[]
): Promise<QueryResult> {
  if (!query.createData) {
    throw new Error('No se proporcionaron datos para crear la transacción')
  }

  const { amount, category, description, type, date } = query.createData

  // Mapear nombre de categoría a ID si tenemos categorías del usuario
  let categoryId: string = category
  
  if (categorias && categorias.length > 0) {
    const categoryLower = category.toLowerCase()
    const matchingCategoria = categorias.find(c => 
      c.nombre.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(c.nombre.toLowerCase())
    )
    if (matchingCategoria) {
      categoryId = matchingCategoria.id
    } else {
      // Si no encuentra coincidencia, usar la primera categoría disponible o crear una por defecto
      const defaultCategory = categorias.find(c => 
        c.nombre.toLowerCase() === 'otros' || 
        c.nombre.toLowerCase() === 'otro' ||
        c.nombre.toLowerCase() === 'general'
      )
      categoryId = defaultCategory?.id || categorias[0].id
    }
  }

  // Crear la transacción en formato Transaction (para Dexie)
  const transaction: Transaction = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    category: categoryId,
    date: date,
    type: type,
    description: description
  }

  // Guardar en Dexie
  try {
    await db.transactions.add(transaction)
    console.log('✅ Transacción creada en Dexie:', transaction)
  } catch (error) {
    console.error('Error al guardar transacción en Dexie:', error)
    throw new Error('No se pudo guardar la transacción')
  }

  // Formatear mensaje de confirmación
  const typeLabel = type === 'expense' ? 'Gasto' : 'Ingreso'
  const amountFormatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount)

  const categoryName = categorias?.find(c => c.id === categoryId)?.nombre || category

  return {
    transactions: [transaction],
    operation: 'CREATE',
    message: `${typeLabel} registrado: ${amountFormatted} en ${categoryName}`,
    createdTransaction: transaction,
    status: 'success'
  }
}
