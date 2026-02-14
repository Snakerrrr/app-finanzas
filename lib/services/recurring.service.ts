/**
 * Servicio de Gastos Recurrentes
 * CRUD + lógica de cálculo de próxima fecha
 */

import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type RecurringForClient = {
  id: string
  descripcion: string
  montoCLP: number
  frecuencia: string
  diaMes: number | null
  categoriaId: string
  cuentaOrigenId: string | null
  activo: boolean
  autoCrear: boolean
  proximaFecha: string
  createdAt: string
  updatedAt: string
}

export type CreateRecurringInput = {
  descripcion: string
  montoCLP: number
  frecuencia: string
  diaMes?: number | null
  categoriaId: string
  cuentaOrigenId?: string | null
  activo?: boolean
  autoCrear?: boolean
  proximaFecha: string
}

export type UpdateRecurringInput = Partial<CreateRecurringInput>

type ServiceResult = { success: true; id?: string } | { success: false; error: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toRecurringForClient(r: {
  id: string
  descripcion: string
  montoCLP: number
  frecuencia: string
  diaMes: number | null
  categoriaId: string
  cuentaOrigenId: string | null
  activo: boolean
  autoCrear: boolean
  proximaFecha: Date
  createdAt: Date
  updatedAt: Date
}): RecurringForClient {
  return {
    id: r.id,
    descripcion: r.descripcion,
    montoCLP: r.montoCLP,
    frecuencia: r.frecuencia,
    diaMes: r.diaMes,
    categoriaId: r.categoriaId,
    cuentaOrigenId: r.cuentaOrigenId,
    activo: r.activo,
    autoCrear: r.autoCrear,
    proximaFecha: r.proximaFecha.toISOString().slice(0, 10),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

/**
 * Calcula la siguiente fecha de ocurrencia basada en la frecuencia
 */
export function calculateNextDate(frecuencia: string, fromDate: Date, diaMes?: number | null): Date {
  const next = new Date(fromDate)

  switch (frecuencia) {
    case "semanal":
      next.setDate(next.getDate() + 7)
      break
    case "quincenal":
      next.setDate(next.getDate() + 15)
      break
    case "mensual":
    default:
      next.setMonth(next.getMonth() + 1)
      if (diaMes) {
        // Ajustar al día del mes especificado
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(diaMes, lastDay))
      }
      break
  }

  return next
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getRecurringTransactions(userId: string): Promise<RecurringForClient[]> {
  const items = await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: [{ activo: "desc" }, { proximaFecha: "asc" }],
  })
  return items.map(toRecurringForClient)
}

export async function getRecurringTransaction(userId: string, id: string): Promise<RecurringForClient | null> {
  const item = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  })
  return item ? toRecurringForClient(item) : null
}

export async function createRecurringTransaction(userId: string, data: CreateRecurringInput): Promise<ServiceResult> {
  try {
    const result = await prisma.recurringTransaction.create({
      data: {
        descripcion: data.descripcion,
        montoCLP: data.montoCLP,
        frecuencia: data.frecuencia,
        diaMes: data.diaMes ?? null,
        categoriaId: data.categoriaId,
        cuentaOrigenId: data.cuentaOrigenId ?? null,
        activo: data.activo ?? true,
        autoCrear: data.autoCrear ?? false,
        proximaFecha: new Date(data.proximaFecha),
        userId,
      },
    })
    return { success: true, id: result.id }
  } catch (error) {
    return { success: false, error: "Error al crear gasto recurrente" }
  }
}

export async function updateRecurringTransaction(
  userId: string,
  id: string,
  data: UpdateRecurringInput
): Promise<ServiceResult> {
  try {
    const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } })
    if (!existing) return { success: false, error: "Gasto recurrente no encontrado" }

    await prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.montoCLP !== undefined && { montoCLP: data.montoCLP }),
        ...(data.frecuencia !== undefined && { frecuencia: data.frecuencia }),
        ...(data.diaMes !== undefined && { diaMes: data.diaMes }),
        ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
        ...(data.cuentaOrigenId !== undefined && { cuentaOrigenId: data.cuentaOrigenId }),
        ...(data.activo !== undefined && { activo: data.activo }),
        ...(data.autoCrear !== undefined && { autoCrear: data.autoCrear }),
        ...(data.proximaFecha !== undefined && { proximaFecha: new Date(data.proximaFecha) }),
      },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar gasto recurrente" }
  }
}

export async function deleteRecurringTransaction(userId: string, id: string): Promise<ServiceResult> {
  try {
    const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } })
    if (!existing) return { success: false, error: "Gasto recurrente no encontrado" }

    await prisma.recurringTransaction.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al eliminar gasto recurrente" }
  }
}

/**
 * Obtiene gastos recurrentes próximos (en los próximos N días)
 */
export async function getUpcomingRecurring(userId: string, days: number = 7): Promise<RecurringForClient[]> {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const items = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      activo: true,
      proximaFecha: { gte: now, lte: futureDate },
    },
    orderBy: { proximaFecha: "asc" },
  })
  return items.map(toRecurringForClient)
}
