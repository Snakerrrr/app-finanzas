import Dexie, { Table } from 'dexie'
import type { Movimiento } from './types'

// Interfaz simplificada para la base de datos local
export interface Transaction {
  id: string
  amount: number
  category: string
  date: string // YYYY-MM-DD
  type: 'expense' | 'income' | 'transfer'
  description: string
  metodoPago?: string
}

// Clase de base de datos Dexie
class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>

  constructor() {
    super('FinanceAppDB')
    this.version(1).stores({
      transactions: 'id, date, type, category, amount'
    })
  }
}

// Instancia singleton de la base de datos
export const db = new FinanceDatabase()

// Función para convertir Movimiento a Transaction
function movimientoToTransaction(mov: Movimiento): Transaction {
  return {
    id: mov.id,
    amount: mov.montoCLP,
    category: mov.categoriaId,
    date: mov.fecha,
    type: mov.tipoMovimiento === 'Ingreso' ? 'income' : mov.tipoMovimiento === 'Gasto' ? 'expense' : 'transfer',
    description: mov.descripcion,
    metodoPago: mov.metodoPago
  }
}

// Función para sincronizar movimientos del usuario a Dexie
export async function syncMovimientosToDexie(movimientos: Movimiento[]): Promise<void> {
  try {
    // Convertir movimientos a transacciones
    const transactions = movimientos.map(mov => movimientoToTransaction(mov))
    
    if (transactions.length > 0) {
      // Usar bulkPut en lugar de clear + bulkAdd para evitar errores de claves duplicadas
      // bulkPut actualiza si existe, o crea si no existe
      await db.transactions.bulkPut(transactions)
      
      // Eliminar transacciones que ya no existen en los movimientos actuales
      const existingIds = new Set(transactions.map(tx => tx.id))
      const allTransactions = await db.transactions.toArray()
      const toDelete = allTransactions.filter(tx => !existingIds.has(tx.id))
      
      if (toDelete.length > 0) {
        await db.transactions.bulkDelete(toDelete.map(tx => tx.id))
      }
      
      console.log(`Sincronizados ${transactions.length} movimientos a Dexie`)
    } else {
      // Si no hay movimientos, limpiar todo
      await db.transactions.clear()
    }
  } catch (error) {
    console.error('Error al sincronizar movimientos a Dexie:', error)
  }
}

// Función para agregar/actualizar una transacción individual
export async function upsertTransaction(mov: Movimiento): Promise<void> {
  const transaction = movimientoToTransaction(mov)
  await db.transactions.put(transaction)
}

// Función para eliminar una transacción
export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

// Función para poblar la base de datos con datos de ejemplo (solo si no hay datos del usuario)
export async function seedDatabase(): Promise<void> {
  // Verificar si ya hay datos
  const count = await db.transactions.count()
  if (count > 0) {
    console.log('La base de datos ya tiene datos. Saltando seed.')
    return
  }

  // 20 transacciones de ejemplo
  const sampleTransactions: Transaction[] = [
    // Ingresos
    { id: 'tx-1', amount: 1500000, category: 'cat-1', date: '2026-01-05', type: 'income', description: 'Sueldo Enero', metodoPago: 'Transferencia' },
    { id: 'tx-2', amount: 350000, category: 'cat-2', date: '2026-01-12', type: 'income', description: 'Freelance - Desarrollo web', metodoPago: 'Transferencia' },
    
    // Gastos - Comida
    { id: 'tx-3', amount: 85000, category: 'cat-4', date: '2026-01-03', type: 'expense', description: 'Supermercado Jumbo', metodoPago: 'Débito' },
    { id: 'tx-4', amount: 72000, category: 'cat-4', date: '2026-01-09', type: 'expense', description: 'Supermercado Líder', metodoPago: 'Débito' },
    { id: 'tx-5', amount: 22000, category: 'cat-12', date: '2026-01-06', type: 'expense', description: 'Pedidos Ya - Sushi', metodoPago: 'Crédito' },
    { id: 'tx-6', amount: 18000, category: 'cat-12', date: '2026-01-13', type: 'expense', description: 'Uber Eats - Pizza', metodoPago: 'Crédito' },
    
    // Gastos - Transporte
    { id: 'tx-7', amount: 10000, category: 'cat-5', date: '2026-01-02', type: 'expense', description: 'Carga Tarjeta Bip!', metodoPago: 'Efectivo' },
    { id: 'tx-8', amount: 10000, category: 'cat-5', date: '2026-01-11', type: 'expense', description: 'Carga Tarjeta Bip!', metodoPago: 'Efectivo' },
    { id: 'tx-9', amount: 8500, category: 'cat-5', date: '2026-01-14', type: 'expense', description: 'Uber Centro a Casa', metodoPago: 'Crédito' },
    { id: 'tx-10', amount: 25000, category: 'cat-5', date: '2026-01-21', type: 'expense', description: 'Uber al Aeropuerto', metodoPago: 'Crédito' },
    
    // Gastos - Bencina
    { id: 'tx-11', amount: 45000, category: 'cat-6', date: '2026-01-04', type: 'expense', description: 'Copec - Bencina 95', metodoPago: 'Crédito' },
    { id: 'tx-12', amount: 50000, category: 'cat-6', date: '2026-01-18', type: 'expense', description: 'Shell - Bencina 97', metodoPago: 'Crédito' },
    
    // Gastos - Servicios
    { id: 'tx-13', amount: 400000, category: 'cat-3', date: '2026-01-01', type: 'expense', description: 'Arriendo Departamento', metodoPago: 'Transferencia' },
    { id: 'tx-14', amount: 42000, category: 'cat-7', date: '2026-01-12', type: 'expense', description: 'Cuenta Luz Enel', metodoPago: 'Transferencia' },
    { id: 'tx-15', amount: 29990, category: 'cat-8', date: '2026-01-10', type: 'expense', description: 'Internet VTR Hogar', metodoPago: 'Débito' },
    
    // Gastos - Salud
    { id: 'tx-16', amount: 75000, category: 'cat-9', date: '2026-01-08', type: 'expense', description: 'Plan Isapre Colmena', metodoPago: 'Débito' },
    { id: 'tx-17', amount: 28000, category: 'cat-10', date: '2026-01-07', type: 'expense', description: 'Farmacia Cruz Verde', metodoPago: 'Débito' },
    
    // Gastos - Entretenimiento
    { id: 'tx-18', amount: 16000, category: 'cat-14', date: '2026-01-11', type: 'expense', description: 'Cine Cinemark - 2 entradas', metodoPago: 'Crédito' },
    { id: 'tx-19', amount: 8990, category: 'cat-11', date: '2026-01-05', type: 'expense', description: 'Netflix Premium', metodoPago: 'Crédito' },
    { id: 'tx-20', amount: 6990, category: 'cat-11', date: '2026-01-08', type: 'expense', description: 'Spotify Premium', metodoPago: 'Crédito' }
  ]

  await db.transactions.bulkAdd(sampleTransactions)
  console.log(`Base de datos poblada con ${sampleTransactions.length} transacciones de ejemplo.`)
}

// Función helper para obtener todas las transacciones
export async function getAllTransactions(): Promise<Transaction[]> {
  return await db.transactions.toArray()
}

// Función helper para obtener transacciones por tipo
export async function getTransactionsByType(type: 'expense' | 'income' | 'transfer'): Promise<Transaction[]> {
  return await db.transactions.where('type').equals(type).toArray()
}

// Función helper para obtener transacciones por categoría
export async function getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
  return await db.transactions.where('category').equals(categoryId).toArray()
}

// Función helper para calcular el saldo total
export async function getTotalBalance(): Promise<number> {
  const transactions = await db.transactions.toArray()
  return transactions.reduce((total, tx) => {
    if (tx.type === 'income') return total + tx.amount
    if (tx.type === 'expense') return total - tx.amount
    return total
  }, 0)
}
