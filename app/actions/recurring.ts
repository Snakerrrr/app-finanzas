"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import * as recurringService from "@/lib/services/recurring.service"

export type { RecurringForClient } from "@/lib/services/recurring.service"

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createSchema = z.object({
  descripcion: z.string().min(1).max(500),
  montoCLP: z.number().positive(),
  frecuencia: z.enum(["mensual", "quincenal", "semanal"]),
  diaMes: z.number().int().min(1).max(31).optional().nullable(),
  categoriaId: z.string().min(1),
  cuentaOrigenId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  autoCrear: z.boolean().optional(),
  proximaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const updateSchema = z.object({
  descripcion: z.string().min(1).max(500).optional(),
  montoCLP: z.number().positive().optional(),
  frecuencia: z.enum(["mensual", "quincenal", "semanal"]).optional(),
  diaMes: z.number().int().min(1).max(31).optional().nullable(),
  categoriaId: z.string().min(1).optional(),
  cuentaOrigenId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  autoCrear: z.boolean().optional(),
  proximaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getRecurringTransactions() {
  const session = await auth()
  if (!session?.user?.id) return []
  return recurringService.getRecurringTransactions(session.user.id)
}

export async function createRecurringTransaction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: "No autorizado" }

  const parsed = createSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false as const, error: first ?? "Datos inválidos" }
  }

  const result = await recurringService.createRecurringTransaction(session.user.id, parsed.data)
  if (!result.success) return result

  revalidatePath("/")
  revalidatePath("/recurrentes")
  return { success: true as const, id: result.id }
}

export async function updateRecurringTransaction(id: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: "No autorizado" }

  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false as const, error: first ?? "Datos inválidos" }
  }

  const result = await recurringService.updateRecurringTransaction(session.user.id, id, parsed.data)
  if (!result.success) return result

  revalidatePath("/")
  revalidatePath("/recurrentes")
  return { success: true as const }
}

export async function deleteRecurringTransaction(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: "No autorizado" }

  const result = await recurringService.deleteRecurringTransaction(session.user.id, id)
  if (!result.success) return result

  revalidatePath("/")
  revalidatePath("/recurrentes")
  return { success: true as const }
}
