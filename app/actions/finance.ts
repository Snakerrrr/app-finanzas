"use server"

/**
 * Server Actions (Web). Solo: 1) auth, 2) validación (Zod), 3) llamada al servicio, 4) revalidatePath, 5) return.
 * Toda la lógica de Prisma está en @/lib/services/finance.service.
 */

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import * as financeService from "@/lib/services/finance.service"
import type {
  DashboardData,
  MovimientoForClient,
  CuentaForClient,
  CategoriaForClient,
  TarjetaForClient,
  MetaForClient,
  PresupuestoForClient,
  MonthlyStat,
  CategoryStat,
} from "@/lib/services/finance.service"

// Re-exportar tipos para que el resto de la app no cambie imports
export type {
  DashboardData,
  MovimientoForClient,
  CuentaForClient,
  CategoriaForClient,
  TarjetaForClient,
  MetaForClient,
  PresupuestoForClient,
  MonthlyStat,
  CategoryStat,
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  await financeService.ensureDefaultCategories(session.user.id)
  return financeService.getDashboardData(session.user.id)
}

// ---------------------------------------------------------------------------
// Movimientos (validación + servicio + revalidate)
// ---------------------------------------------------------------------------

const TIPOS_MOVIMIENTO = ["Ingreso", "Gasto", "Transferencia"] as const
const METODOS_PAGO = ["Débito", "Crédito", "Efectivo", "Transferencia"] as const
const TIPOS_GASTO = ["Fijo", "Variable", "Ocasional"] as const
const ESTADOS_CONCILIACION = ["Pendiente", "Conciliado"] as const

const createMovimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descripcion: z.string().min(1).max(500),
  tipoMovimiento: z.enum(TIPOS_MOVIMIENTO),
  categoriaId: z.string().min(1),
  subcategoria: z.string().optional(),
  tipoGasto: z.enum(TIPOS_GASTO).optional(),
  metodoPago: z.enum(METODOS_PAGO),
  montoCLP: z.number().positive(),
  cuotas: z.number().int().min(1).optional(),
  notas: z.string().optional(),
  estadoConciliacion: z.enum(ESTADOS_CONCILIACION).default("Pendiente"),
  mesConciliacion: z.string().regex(/^\d{4}-\d{2}$/),
  cuentaOrigenId: z.string().optional(),
  cuentaDestinoId: z.string().optional(),
  tarjetaCreditoId: z.string().optional(),
})

export type CreateMovimientoResult = { success: true } | { success: false; error: string }

export async function createMovimiento(data: unknown): Promise<CreateMovimientoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createMovimientoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  await financeService.ensureDefaultCategories(session.user.id)
  const payload = {
    ...parsed.data,
    subcategoria: parsed.data.subcategoria,
    tipoGasto: parsed.data.tipoGasto,
    cuotas: parsed.data.cuotas,
    notas: parsed.data.notas,
    cuentaOrigenId: parsed.data.cuentaOrigenId,
    cuentaDestinoId: parsed.data.cuentaDestinoId,
    tarjetaCreditoId: parsed.data.tarjetaCreditoId,
  }
  const result = await financeService.createMovimiento(session.user.id, payload)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  return { success: true }
}

const updateMovimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  descripcion: z.string().min(1).max(500).optional(),
  tipoMovimiento: z.enum(TIPOS_MOVIMIENTO).optional(),
  categoriaId: z.string().min(1).optional(),
  subcategoria: z.string().optional().nullable(),
  tipoGasto: z.enum(TIPOS_GASTO).optional().nullable(),
  metodoPago: z.enum(METODOS_PAGO).optional(),
  montoCLP: z.number().positive().optional(),
  cuotas: z.number().int().min(1).optional().nullable(),
  notas: z.string().optional().nullable(),
  estadoConciliacion: z.enum(ESTADOS_CONCILIACION).optional(),
  mesConciliacion: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  cuentaOrigenId: z.string().optional().nullable(),
  cuentaDestinoId: z.string().optional().nullable(),
  tarjetaCreditoId: z.string().optional().nullable(),
})

export type UpdateMovimientoResult = { success: true } | { success: false; error: string }

export async function updateMovimiento(id: string, data: unknown): Promise<UpdateMovimientoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updateMovimientoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.updateMovimiento(session.user.id, id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  return { success: true }
}

export type DeleteMovimientoResult = { success: true } | { success: false; error: string }

export async function deleteMovimiento(id: string): Promise<DeleteMovimientoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deleteMovimiento(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

const createCuentaSchema = z.object({
  nombre: z.string().min(1).max(120),
  banco: z.string().min(1).max(120),
  saldoInicialMes: z.number().default(0),
})

export type CreateCuentaResult = { success: true; id: string } | { success: false; error: string }

export async function createCuenta(data: unknown): Promise<CreateCuentaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createCuentaSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.createCuenta(session.user.id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  return { success: true, id: result.id! }
}

const updateCuentaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  banco: z.string().min(1).max(120).optional(),
  saldoInicialMes: z.number().optional(),
  activo: z.boolean().optional(),
  saldoFinalMesDeclarado: z.number().nullable().optional(),
})

export type UpdateCuentaResult = { success: true } | { success: false; error: string }

export async function updateCuenta(id: string, data: unknown): Promise<UpdateCuentaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updateCuentaSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.updateCuenta(session.user.id, id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  revalidatePath("/metas")
  return { success: true }
}

export type DeleteCuentaResult = { success: true } | { success: false; error: string }

export async function deleteCuenta(id: string): Promise<DeleteCuentaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deleteCuenta(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]),
  color: z.string().min(1).max(20),
  icono: z.string().min(1).max(80),
})

export type CreateCategoriaResult = { success: true; id: string } | { success: false; error: string }

export async function createCategoria(data: unknown): Promise<CreateCategoriaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createCategoriaSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.createCategoria(session.user.id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  return { success: true, id: result.id! }
}

const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]).optional(),
  color: z.string().min(1).max(20).optional(),
  icono: z.string().min(1).max(80).optional(),
})

export type UpdateCategoriaResult = { success: true } | { success: false; error: string }

export async function updateCategoria(id: string, data: unknown): Promise<UpdateCategoriaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updateCategoriaSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.updateCategoria(session.user.id, id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  revalidatePath("/presupuestos")
  return { success: true }
}

export type DeleteCategoriaResult = { success: true } | { success: false; error: string }

export async function deleteCategoria(id: string): Promise<DeleteCategoriaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deleteCategoria(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  revalidatePath("/presupuestos")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

const createPresupuestoSchema = z.object({
  categoriaId: z.string().min(1),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato mes: YYYY-MM"),
  montoPresupuestadoCLP: z.number().min(0),
})

export type CreatePresupuestoResult = { success: true; id: string } | { success: false; error: string }

export async function createPresupuesto(data: unknown): Promise<CreatePresupuestoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createPresupuestoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  try {
    const result = await financeService.createPresupuesto(session.user.id, parsed.data)
    if (!result.success) return result
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/presupuestos")
    return { success: true, id: result.id! }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
      return { success: false, error: "Ya existe un presupuesto para esta categoría y mes" }
    return { success: false, error: "No autorizado" }
  }
}

const updatePresupuestoSchema = z.object({
  categoriaId: z.string().min(1).optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato mes: YYYY-MM").optional(),
  montoPresupuestadoCLP: z.number().min(0).optional(),
})

export type UpdatePresupuestoResult = { success: true } | { success: false; error: string }

export async function updatePresupuesto(id: string, data: unknown): Promise<UpdatePresupuestoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updatePresupuestoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  try {
    const result = await financeService.updatePresupuesto(session.user.id, id, parsed.data)
    if (!result.success) return result
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/presupuestos")
    return { success: true }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
      return { success: false, error: "Ya existe un presupuesto para esa categoría y mes" }
    return { success: false, error: "No autorizado" }
  }
}

export type DeletePresupuestoResult = { success: true } | { success: false; error: string }

export async function deletePresupuesto(id: string): Promise<DeletePresupuestoResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deletePresupuesto(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/presupuestos")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Metas de ahorro
// ---------------------------------------------------------------------------

const createMetaAhorroSchema = z.object({
  nombre: z.string().min(1).max(120),
  objetivoCLP: z.number().positive(),
  fechaObjetivo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  aporteMensualSugerido: z.number().min(0),
  cuentaDestinoId: z.string().min(1),
  estado: z.enum(["Activa", "Completada"]).default("Activa"),
})

export type CreateMetaAhorroResult = { success: true; id: string } | { success: false; error: string }

export async function createMetaAhorro(data: unknown): Promise<CreateMetaAhorroResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createMetaAhorroSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.createMetaAhorro(session.user.id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/metas")
  return { success: true, id: result.id! }
}

const updateMetaAhorroSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  objetivoCLP: z.number().positive().optional(),
  fechaObjetivo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD").optional(),
  aporteMensualSugerido: z.number().min(0).optional(),
  cuentaDestinoId: z.string().min(1).optional(),
  estado: z.enum(["Activa", "Completada"]).optional(),
})

export type UpdateMetaAhorroResult = { success: true } | { success: false; error: string }

export async function updateMetaAhorro(id: string, data: unknown): Promise<UpdateMetaAhorroResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updateMetaAhorroSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.updateMetaAhorro(session.user.id, id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/metas")
  return { success: true }
}

export type DeleteMetaAhorroResult = { success: true } | { success: false; error: string }

export async function deleteMetaAhorro(id: string): Promise<DeleteMetaAhorroResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deleteMetaAhorro(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/metas")
  return { success: true }
}

// Aporte a meta (incrementar acumuladoCLP)
export type AporteMetaResult = { success: true } | { success: false; error: string }

export async function aportarMeta(id: string, monto: number): Promise<AporteMetaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  if (monto <= 0) return { success: false, error: "El monto debe ser mayor a 0" }
  const result = await financeService.aportarMeta(session.user.id, id, monto)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/metas")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Tarjetas de Crédito (validación + servicio + revalidate)
// ---------------------------------------------------------------------------

const createTarjetaCreditoSchema = z.object({
  nombre: z.string().min(1).max(120),
  banco: z.string().min(1).max(120),
  cupoTotal: z.number().positive(),
  cupoDisponible: z.number().min(0),
  fechaFacturacion: z.number().int().min(1).max(31),
  fechaPago: z.number().int().min(1).max(31),
  tasaInteresMensual: z.number().min(0),
  deudaActual: z.number().min(0).default(0),
  deudaFacturada: z.number().min(0).default(0),
  deudaNoFacturada: z.number().min(0).default(0),
})

export type CreateTarjetaResult = { success: true; id: string } | { success: false; error: string }

export async function createTarjeta(data: unknown): Promise<CreateTarjetaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = createTarjetaCreditoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.createTarjetaCredito(session.user.id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/tarjetas")
  return { success: true, id: result.id! }
}

const updateTarjetaCreditoSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  banco: z.string().min(1).max(120).optional(),
  cupoTotal: z.number().positive().optional(),
  cupoDisponible: z.number().min(0).optional(),
  fechaFacturacion: z.number().int().min(1).max(31).optional(),
  fechaPago: z.number().int().min(1).max(31).optional(),
  tasaInteresMensual: z.number().min(0).optional(),
  deudaActual: z.number().min(0).optional(),
  deudaFacturada: z.number().min(0).optional(),
  deudaNoFacturada: z.number().min(0).optional(),
})

export type UpdateTarjetaResult = { success: true } | { success: false; error: string }

export async function updateTarjeta(id: string, data: unknown): Promise<UpdateTarjetaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const parsed = updateTarjetaCreditoSchema.safeParse(data)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }
  const result = await financeService.updateTarjetaCredito(session.user.id, id, parsed.data)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/tarjetas")
  return { success: true }
}

export type DeleteTarjetaResult = { success: true } | { success: false; error: string }

export async function deleteTarjeta(id: string): Promise<DeleteTarjetaResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }
  const result = await financeService.deleteTarjetaCredito(session.user.id, id)
  if (!result.success) return result
  revalidatePath("/")
  revalidatePath("/tarjetas")
  return { success: true }
}
