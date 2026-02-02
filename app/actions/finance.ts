"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const TIPOS_MOVIMIENTO = ["Ingreso", "Gasto", "Transferencia"] as const
const METODOS_PAGO = ["Débito", "Crédito", "Efectivo", "Transferencia"] as const
const TIPOS_GASTO = ["Fijo", "Variable", "Ocasional"] as const
const ESTADOS_CONCILIACION = ["Pendiente", "Conciliado"] as const

/** Categorías por defecto si el usuario no tiene ninguna */
const DEFAULT_CATEGORIES = [
  { nombre: "Comida", tipo: "Gasto" as const, color: "#f59e0b", icono: "ShoppingCart" },
  { nombre: "Transporte", tipo: "Gasto" as const, color: "#3b82f6", icono: "Bus" },
  { nombre: "Vivienda", tipo: "Gasto" as const, color: "#ef4444", icono: "Home" },
  { nombre: "Ingreso Laboral", tipo: "Ingreso" as const, color: "#10b981", icono: "DollarSign" },
]

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")
  return session.user.id
}

/** Crea categorías por defecto para el usuario si no tiene ninguna */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.categoria.count({ where: { userId } })
  if (count > 0) return
  await prisma.categoria.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId,
      nombre: c.nombre,
      tipo: c.tipo,
      color: c.color,
      icono: c.icono,
    })),
  })
}

export type TarjetaForClient = {
  id: string
  nombre: string
  banco: string
  cupoTotal: number
  cupoDisponible: number
  deudaActual: number
}
export type MetaForClient = {
  id: string
  nombre: string
  objetivoCLP: number
  fechaObjetivo: string
  aporteMensualSugerido: number
  acumuladoCLP: number
  cuentaDestinoId: string
  estado: string
}

export type PresupuestoForClient = {
  id: string
  categoriaId: string
  mes: string
  montoPresupuestadoCLP: number
}

/** Estadísticas por mes para gráficos de líneas/barras (últimos 6 meses). */
export type MonthlyStat = {
  name: string
  ingresos: number
  gastos: number
}

/** Estadísticas por categoría para Pie Chart (solo gastos). */
export type CategoryStat = {
  name: string
  value: number
  color: string
}

export type DashboardData = {
  balanceTotal: number
  movimientos: MovimientoForClient[]
  movimientosMes: MovimientoForClient[]
  monthlyStats: MonthlyStat[]
  categoryStats: CategoryStat[]
  cuentas: CuentaForClient[]
  categorias: CategoriaForClient[]
  tarjetasCredito: TarjetaForClient[]
  metasAhorro: MetaForClient[]
  presupuestos: PresupuestoForClient[]
}

export type MovimientoForClient = {
  id: string
  fecha: string
  descripcion: string
  tipoMovimiento: string
  categoriaId: string
  subcategoria: string | null
  tipoGasto: string | null
  metodoPago: string
  montoCLP: number
  cuotas: number | null
  etiquetas: string[]
  notas: string | null
  estadoConciliacion: string
  mesConciliacion: string
  cuentaOrigenId: string | null
  cuentaDestinoId: string | null
  tarjetaCreditoId: string | null
  categoria?: { id: string; nombre: string; tipo: string; color: string; icono: string }
  cuentaOrigen?: { id: string; nombre: string; banco: string } | null
  cuentaDestino?: { id: string; nombre: string; banco: string } | null
}

export type CuentaForClient = {
  id: string
  nombre: string
  banco: string
  saldoInicialMes: number
  saldoFinalMesDeclarado: number | null
  saldoCalculado: number
  activo: boolean
}

export type CategoriaForClient = {
  id: string
  nombre: string
  tipo: string
  color: string
  icono: string
}

function toMovimientoForClient(m: {
  id: string
  fecha: Date
  descripcion: string
  tipoMovimiento: string
  categoriaId: string
  subcategoria: string | null
  tipoGasto: string | null
  metodoPago: string
  montoCLP: number
  cuotas: number | null
  etiquetas: string[]
  notas: string | null
  estadoConciliacion: string
  mesConciliacion: string
  cuentaOrigenId: string | null
  cuentaDestinoId: string | null
  tarjetaCreditoId: string | null
  categoria?: { id: string; nombre: string; tipo: string; color: string; icono: string } | null
  cuentaOrigen?: { id: string; nombre: string; banco: string } | null
  cuentaDestino?: { id: string; nombre: string; banco: string } | null
}): MovimientoForClient {
  return {
    id: m.id,
    fecha: m.fecha.toISOString().slice(0, 10),
    descripcion: m.descripcion,
    tipoMovimiento: m.tipoMovimiento,
    categoriaId: m.categoriaId,
    subcategoria: m.subcategoria,
    tipoGasto: m.tipoGasto,
    metodoPago: m.metodoPago,
    montoCLP: m.montoCLP,
    cuotas: m.cuotas,
    etiquetas: m.etiquetas ?? [],
    notas: m.notas,
    estadoConciliacion: m.estadoConciliacion,
    mesConciliacion: m.mesConciliacion,
    cuentaOrigenId: m.cuentaOrigenId,
    cuentaDestinoId: m.cuentaDestinoId,
    tarjetaCreditoId: m.tarjetaCreditoId,
    categoria: m.categoria ?? undefined,
    cuentaOrigen: m.cuentaOrigen ?? undefined,
    cuentaDestino: m.cuentaDestino ?? undefined,
  }
}

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const userId = await getUserId()
    await ensureDefaultCategories(userId)
  } catch {
    return null
  }

  const userId = await getUserId()
  const now = new Date()
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    cuentas,
    movimientosRaw,
    movimientosMesRaw,
    movimientosUltimos6Meses,
    categorias,
    tarjetasCredito,
    metasAhorro,
    presupuestos,
  ] = await Promise.all([
    prisma.cuenta.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.movimiento.findMany({
      where: { userId },
      include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
      orderBy: { fecha: "desc" },
    }),
    prisma.movimiento.findMany({
      where: { userId, mesConciliacion: mesActual },
      include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
      orderBy: { fecha: "desc" },
    }),
    prisma.movimiento.findMany({
      where: { userId, fecha: { gte: sixMonthsAgo } },
      select: {
        fecha: true,
        tipoMovimiento: true,
        montoCLP: true,
        categoriaId: true,
        categoria: { select: { nombre: true, color: true } },
      },
    }),
    prisma.categoria.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.tarjetaCredito.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.metaAhorro.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.presupuesto.findMany({ where: { userId } }),
  ])

  const balanceTotal = cuentas.reduce((sum, c) => sum + c.saldoCalculado, 0)

  const movimientos = movimientosRaw.map(toMovimientoForClient)
  const movimientosMes = movimientosMesRaw.map(toMovimientoForClient)

  const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"]

  const monthlyStats: MonthlyStat[] = []
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`
    const name = MONTH_NAMES[monthDate.getMonth()]
    let ingresos = 0
    let gastos = 0
    for (const m of movimientosUltimos6Meses) {
      const mYearMonth = `${m.fecha.getFullYear()}-${String(m.fecha.getMonth() + 1).padStart(2, "0")}`
      if (mYearMonth !== yearMonth) continue
      if (m.tipoMovimiento === "Ingreso") ingresos += m.montoCLP
      if (m.tipoMovimiento === "Gasto") gastos += m.montoCLP
    }
    monthlyStats.push({ name, ingresos, gastos })
  }

  const categoryStatsMap = new Map<string, { name: string; value: number; color: string }>()
  for (const m of movimientosUltimos6Meses) {
    if (m.tipoMovimiento !== "Gasto") continue
    const key = m.categoriaId
    const nombre = m.categoria?.nombre ?? "Sin categoría"
    const color = m.categoria?.color ?? "#64748b"
    const current = categoryStatsMap.get(key)
    if (current) {
      current.value += m.montoCLP
    } else {
      categoryStatsMap.set(key, { name: nombre, value: m.montoCLP, color })
    }
  }
  const categoryStats: CategoryStat[] = Array.from(categoryStatsMap.values()).sort((a, b) => b.value - a.value)

  return {
    balanceTotal,
    movimientos,
    movimientosMes,
    monthlyStats,
    categoryStats,
    cuentas: cuentas.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      banco: c.banco,
      saldoInicialMes: c.saldoInicialMes,
      saldoFinalMesDeclarado: c.saldoFinalMesDeclarado ?? null,
      saldoCalculado: c.saldoCalculado,
      activo: c.activo,
    })),
    categorias: categorias.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      color: c.color,
      icono: c.icono,
    })),
    tarjetasCredito: tarjetasCredito.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      banco: t.banco,
      cupoTotal: t.cupoTotal,
      cupoDisponible: t.cupoDisponible,
      deudaActual: t.deudaActual,
    })),
    metasAhorro: metasAhorro.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      objetivoCLP: m.objetivoCLP,
      fechaObjetivo: m.fechaObjetivo.toISOString().slice(0, 10),
      aporteMensualSugerido: m.aporteMensualSugerido,
      acumuladoCLP: m.acumuladoCLP,
      cuentaDestinoId: m.cuentaDestinoId,
      estado: m.estado,
    })),
    presupuestos: presupuestos.map((p) => ({
      id: p.id,
      categoriaId: p.categoriaId,
      mes: p.mes,
      montoPresupuestadoCLP: p.montoPresupuestadoCLP,
    })),
  }
}

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
  try {
    const userId = await getUserId()
    await ensureDefaultCategories(userId)
  } catch {
    return { success: false, error: "No autorizado" }
  }

  const parsed = createMovimientoSchema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }

  const userId = await getUserId()
  const { tipoMovimiento, montoCLP, cuentaOrigenId, cuentaDestinoId, categoriaId } = parsed.data

  const mesConciliacion = parsed.data.mesConciliacion
  const fecha = new Date(parsed.data.fecha + "T12:00:00Z")

  await prisma.$transaction(async (tx) => {
    const mov = await tx.movimiento.create({
      data: {
        userId,
        fecha,
        descripcion: parsed.data.descripcion,
        tipoMovimiento: parsed.data.tipoMovimiento,
        categoriaId: parsed.data.categoriaId,
        subcategoria: parsed.data.subcategoria ?? null,
        tipoGasto: parsed.data.tipoGasto ?? null,
        metodoPago: parsed.data.metodoPago,
        montoCLP: parsed.data.montoCLP,
        cuotas: parsed.data.cuotas ?? null,
        notas: parsed.data.notas ?? null,
        estadoConciliacion: parsed.data.estadoConciliacion,
        mesConciliacion,
        cuentaOrigenId: parsed.data.cuentaOrigenId ?? null,
        cuentaDestinoId: parsed.data.cuentaDestinoId ?? null,
        tarjetaCreditoId: parsed.data.tarjetaCreditoId ?? null,
        etiquetas: [],
      },
    })

    if (tipoMovimiento === "Gasto" && cuentaOrigenId) {
      await tx.cuenta.update({
        where: { id: cuentaOrigenId, userId },
        data: { saldoCalculado: { decrement: montoCLP } },
      })
    }
    if (tipoMovimiento === "Ingreso" && cuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: cuentaDestinoId, userId },
        data: { saldoCalculado: { increment: montoCLP } },
      })
    }
    if (tipoMovimiento === "Transferencia" && cuentaOrigenId && cuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: cuentaOrigenId, userId },
        data: { saldoCalculado: { decrement: montoCLP } },
      })
      await tx.cuenta.update({
        where: { id: cuentaDestinoId, userId },
        data: { saldoCalculado: { increment: montoCLP } },
      })
    }
  })

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
  try {
    const userId = await getUserId()
    await ensureDefaultCategories(userId)
  } catch {
    return { success: false, error: "No autorizado" }
  }

  const parsed = updateMovimientoSchema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { success: false, error: first ?? "Datos inválidos" }
  }

  const userId = await getUserId()
  const oldMov = await prisma.movimiento.findFirst({ where: { id, userId } })
  if (!oldMov) return { success: false, error: "Movimiento no encontrado" }

  const newTipo = parsed.data.tipoMovimiento ?? oldMov.tipoMovimiento
  const newMonto = parsed.data.montoCLP ?? oldMov.montoCLP
  const newCuentaOrigenId = parsed.data.cuentaOrigenId !== undefined ? parsed.data.cuentaOrigenId : oldMov.cuentaOrigenId
  const newCuentaDestinoId =
    parsed.data.cuentaDestinoId !== undefined ? parsed.data.cuentaDestinoId : oldMov.cuentaDestinoId

  await prisma.$transaction(async (tx) => {
    // 1. Revertir saldo en cuenta(s) antigua(s)
    const oldTipo = oldMov.tipoMovimiento
    const oldMonto = oldMov.montoCLP
    const oldOrigen = oldMov.cuentaOrigenId
    const oldDestino = oldMov.cuentaDestinoId

    if (oldTipo === "Gasto" && oldOrigen) {
      await tx.cuenta.update({
        where: { id: oldOrigen, userId },
        data: { saldoCalculado: { increment: oldMonto } },
      })
    }
    if (oldTipo === "Ingreso" && oldDestino) {
      await tx.cuenta.update({
        where: { id: oldDestino, userId },
        data: { saldoCalculado: { decrement: oldMonto } },
      })
    }
    if (oldTipo === "Transferencia" && oldOrigen && oldDestino) {
      await tx.cuenta.update({
        where: { id: oldOrigen, userId },
        data: { saldoCalculado: { increment: oldMonto } },
      })
      await tx.cuenta.update({
        where: { id: oldDestino, userId },
        data: { saldoCalculado: { decrement: oldMonto } },
      })
    }

    // 2. Construir data de actualización (solo campos enviados)
    const updateData: {
      fecha?: Date
      descripcion?: string
      tipoMovimiento?: string
      categoriaId?: string
      subcategoria?: string | null
      tipoGasto?: string | null
      metodoPago?: string
      montoCLP?: number
      cuotas?: number | null
      notas?: string | null
      estadoConciliacion?: string
      mesConciliacion?: string
      cuentaOrigenId?: string | null
      cuentaDestinoId?: string | null
      tarjetaCreditoId?: string | null
    } = {}
    if (parsed.data.fecha != null) updateData.fecha = new Date(parsed.data.fecha + "T12:00:00Z")
    if (parsed.data.descripcion != null) updateData.descripcion = parsed.data.descripcion
    if (parsed.data.tipoMovimiento != null) updateData.tipoMovimiento = parsed.data.tipoMovimiento
    if (parsed.data.categoriaId != null) updateData.categoriaId = parsed.data.categoriaId
    if (parsed.data.subcategoria !== undefined) updateData.subcategoria = parsed.data.subcategoria
    if (parsed.data.tipoGasto !== undefined) updateData.tipoGasto = parsed.data.tipoGasto
    if (parsed.data.metodoPago != null) updateData.metodoPago = parsed.data.metodoPago
    if (parsed.data.montoCLP != null) updateData.montoCLP = parsed.data.montoCLP
    if (parsed.data.cuotas !== undefined) updateData.cuotas = parsed.data.cuotas
    if (parsed.data.notas !== undefined) updateData.notas = parsed.data.notas
    if (parsed.data.estadoConciliacion != null) updateData.estadoConciliacion = parsed.data.estadoConciliacion
    if (parsed.data.mesConciliacion != null) updateData.mesConciliacion = parsed.data.mesConciliacion
    if (parsed.data.cuentaOrigenId !== undefined) updateData.cuentaOrigenId = parsed.data.cuentaOrigenId
    if (parsed.data.cuentaDestinoId !== undefined) updateData.cuentaDestinoId = parsed.data.cuentaDestinoId
    if (parsed.data.tarjetaCreditoId !== undefined) updateData.tarjetaCreditoId = parsed.data.tarjetaCreditoId

    await tx.movimiento.update({
      where: { id },
      data: updateData,
    })

    // 3. Aplicar nuevo saldo en cuenta(s) nueva(s) o misma(s)
    if (newTipo === "Gasto" && newCuentaOrigenId) {
      await tx.cuenta.update({
        where: { id: newCuentaOrigenId, userId },
        data: { saldoCalculado: { decrement: newMonto } },
      })
    }
    if (newTipo === "Ingreso" && newCuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: newCuentaDestinoId, userId },
        data: { saldoCalculado: { increment: newMonto } },
      })
    }
    if (newTipo === "Transferencia" && newCuentaOrigenId && newCuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: newCuentaOrigenId, userId },
        data: { saldoCalculado: { decrement: newMonto } },
      })
      await tx.cuenta.update({
        where: { id: newCuentaDestinoId, userId },
        data: { saldoCalculado: { increment: newMonto } },
      })
    }
  })

  revalidatePath("/")
  revalidatePath("/movimientos")
  return { success: true }
}

const createCuentaSchema = z.object({
  nombre: z.string().min(1).max(120),
  banco: z.string().min(1).max(120),
  saldoInicialMes: z.number().default(0),
})

export type CreateCuentaResult = { success: true; id: string } | { success: false; error: string }

export async function createCuenta(data: unknown): Promise<CreateCuentaResult> {
  try {
    const userId = await getUserId()
    const parsed = createCuentaSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cuenta = await prisma.cuenta.create({
      data: {
        userId,
        nombre: parsed.data.nombre,
        banco: parsed.data.banco,
        saldoInicialMes: parsed.data.saldoInicialMes,
        saldoCalculado: parsed.data.saldoInicialMes,
      },
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/categorias")
    return { success: true, id: cuenta.id }
  } catch {
    return { success: false, error: "No autorizado" }
  }
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
  try {
    const userId = await getUserId()
    const parsed = updateCuentaSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cuenta = await prisma.cuenta.findFirst({ where: { id, userId } })
    if (!cuenta) return { success: false, error: "Cuenta no encontrada" }
    const updateData: {
      nombre?: string
      banco?: string
      saldoInicialMes?: number
      activo?: boolean
      saldoFinalMesDeclarado?: number | null
    } = {}
    if (parsed.data.nombre != null) updateData.nombre = parsed.data.nombre
    if (parsed.data.banco != null) updateData.banco = parsed.data.banco
    if (parsed.data.saldoInicialMes != null) updateData.saldoInicialMes = parsed.data.saldoInicialMes
    if (parsed.data.activo != null) updateData.activo = parsed.data.activo
    if (parsed.data.saldoFinalMesDeclarado !== undefined) updateData.saldoFinalMesDeclarado = parsed.data.saldoFinalMesDeclarado
    if (Object.keys(updateData).length === 0) return { success: true }
    await prisma.cuenta.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/categorias")
    revalidatePath("/metas")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

export type DeleteCuentaResult = { success: true } | { success: false; error: string }

export async function deleteCuenta(id: string): Promise<DeleteCuentaResult> {
  try {
    const userId = await getUserId()
  } catch {
    return { success: false, error: "No autorizado" }
  }
  const userId = await getUserId()
  const cuenta = await prisma.cuenta.findFirst({ where: { id, userId } })
  if (!cuenta) return { success: false, error: "Cuenta no encontrada" }
  const [origenCount, destinoCount, metasCount] = await Promise.all([
    prisma.movimiento.count({ where: { userId, cuentaOrigenId: id } }),
    prisma.movimiento.count({ where: { userId, cuentaDestinoId: id } }),
    prisma.metaAhorro.count({ where: { userId, cuentaDestinoId: id } }),
  ])
  if (origenCount > 0 || destinoCount > 0) {
    return { success: false, error: "No se puede eliminar: tiene movimientos asociados. Elimina o reasigna los movimientos primero." }
  }
  if (metasCount > 0) {
    return { success: false, error: "No se puede eliminar: tiene metas de ahorro asociadas. Cambia la cuenta destino de las metas primero." }
  }
  await prisma.cuenta.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/movimientos")
  revalidatePath("/categorias")
  return { success: true }
}

const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]),
  color: z.string().min(1).max(20),
  icono: z.string().min(1).max(80),
})

export type CreateCategoriaResult = { success: true; id: string } | { success: false; error: string }

export async function createCategoria(data: unknown): Promise<CreateCategoriaResult> {
  try {
    const userId = await getUserId()
    const parsed = createCategoriaSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cat = await prisma.categoria.create({
      data: {
        userId,
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        color: parsed.data.color,
        icono: parsed.data.icono,
      },
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/categorias")
    return { success: true, id: cat.id }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]).optional(),
  color: z.string().min(1).max(20).optional(),
  icono: z.string().min(1).max(80).optional(),
})

export type UpdateCategoriaResult = { success: true } | { success: false; error: string }

export async function updateCategoria(
  id: string,
  data: unknown
): Promise<UpdateCategoriaResult> {
  try {
    const userId = await getUserId()
    const parsed = updateCategoriaSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cat = await prisma.categoria.findFirst({ where: { id, userId } })
    if (!cat) return { success: false, error: "Categoría no encontrada" }
    const updateData: { nombre?: string; tipo?: string; color?: string; icono?: string } = {}
    if (parsed.data.nombre != null) updateData.nombre = parsed.data.nombre
    if (parsed.data.tipo != null) updateData.tipo = parsed.data.tipo
    if (parsed.data.color != null) updateData.color = parsed.data.color
    if (parsed.data.icono != null) updateData.icono = parsed.data.icono
    if (Object.keys(updateData).length === 0) return { success: true }
    await prisma.categoria.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/categorias")
    revalidatePath("/presupuestos")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

export type DeleteCategoriaResult = { success: true } | { success: false; error: string }

export async function deleteCategoria(id: string): Promise<DeleteCategoriaResult> {
  try {
    const userId = await getUserId()
    const cat = await prisma.categoria.findFirst({ where: { id, userId } })
    if (!cat) return { success: false, error: "Categoría no encontrada" }
    const movCount = await prisma.movimiento.count({ where: { userId, categoriaId: id } })
    if (movCount > 0) {
      return {
        success: false,
        error: "No se puede eliminar: tiene movimientos asociados. Reasigna o elimina los movimientos primero.",
      }
    }
    await prisma.categoria.delete({ where: { id } })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/categorias")
    revalidatePath("/presupuestos")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

// ---------------------------------------------------------------------------
// deleteMovimiento: revierte saldo en cuenta y luego borra el movimiento
// ---------------------------------------------------------------------------

export type DeleteMovimientoResult = { success: true } | { success: false; error: string }

export async function deleteMovimiento(id: string): Promise<DeleteMovimientoResult> {
  try {
    const userId = await getUserId()
  } catch {
    return { success: false, error: "No autorizado" }
  }
  const userId = await getUserId()
  const mov = await prisma.movimiento.findFirst({ where: { id, userId } })
  if (!mov) return { success: false, error: "Movimiento no encontrado" }
  const { tipoMovimiento, montoCLP, cuentaOrigenId, cuentaDestinoId } = mov
  await prisma.$transaction(async (tx) => {
    if (tipoMovimiento === "Gasto" && cuentaOrigenId) {
      await tx.cuenta.update({
        where: { id: cuentaOrigenId, userId },
        data: { saldoCalculado: { increment: montoCLP } },
      })
    }
    if (tipoMovimiento === "Ingreso" && cuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: cuentaDestinoId, userId },
        data: { saldoCalculado: { decrement: montoCLP } },
      })
    }
    if (tipoMovimiento === "Transferencia" && cuentaOrigenId && cuentaDestinoId) {
      await tx.cuenta.update({
        where: { id: cuentaOrigenId, userId },
        data: { saldoCalculado: { increment: montoCLP } },
      })
      await tx.cuenta.update({
        where: { id: cuentaDestinoId, userId },
        data: { saldoCalculado: { decrement: montoCLP } },
      })
    }
    await tx.movimiento.delete({ where: { id, userId } })
  })
  revalidatePath("/")
  revalidatePath("/movimientos")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Presupuesto
// ---------------------------------------------------------------------------

const createPresupuestoSchema = z.object({
  categoriaId: z.string().min(1),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato mes: YYYY-MM"),
  montoPresupuestadoCLP: z.number().min(0),
})

export type CreatePresupuestoResult = { success: true; id: string } | { success: false; error: string }

export async function createPresupuesto(data: unknown): Promise<CreatePresupuestoResult> {
  try {
    const userId = await getUserId()
    const parsed = createPresupuestoSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cat = await prisma.categoria.findFirst({
      where: { id: parsed.data.categoriaId, userId },
    })
    if (!cat) return { success: false, error: "Categoría no encontrada" }
    const pres = await prisma.presupuesto.create({
      data: {
        userId,
        categoriaId: parsed.data.categoriaId,
        mes: parsed.data.mes,
        montoPresupuestadoCLP: parsed.data.montoPresupuestadoCLP,
      },
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/presupuestos")
    return { success: true, id: pres.id }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { success: false, error: "Ya existe un presupuesto para esta categoría y mes" }
    }
    return { success: false, error: "No autorizado" }
  }
}

const updatePresupuestoSchema = z.object({
  categoriaId: z.string().min(1).optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato mes: YYYY-MM").optional(),
  montoPresupuestadoCLP: z.number().min(0).optional(),
})

export type UpdatePresupuestoResult = { success: true } | { success: false; error: string }

export async function updatePresupuesto(
  id: string,
  data: unknown
): Promise<UpdatePresupuestoResult> {
  try {
    const userId = await getUserId()
    const parsed = updatePresupuestoSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const pres = await prisma.presupuesto.findFirst({ where: { id, userId } })
    if (!pres) return { success: false, error: "Presupuesto no encontrado" }
    if (parsed.data.categoriaId != null) {
      const cat = await prisma.categoria.findFirst({
        where: { id: parsed.data.categoriaId, userId },
      })
      if (!cat) return { success: false, error: "Categoría no encontrada" }
    }
    const updateData: { categoriaId?: string; mes?: string; montoPresupuestadoCLP?: number } = {}
    if (parsed.data.categoriaId != null) updateData.categoriaId = parsed.data.categoriaId
    if (parsed.data.mes != null) updateData.mes = parsed.data.mes
    if (parsed.data.montoPresupuestadoCLP != null)
      updateData.montoPresupuestadoCLP = parsed.data.montoPresupuestadoCLP
    if (Object.keys(updateData).length === 0) return { success: true }
    await prisma.presupuesto.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/presupuestos")
    return { success: true }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { success: false, error: "Ya existe un presupuesto para esa categoría y mes" }
    }
    return { success: false, error: "No autorizado" }
  }
}

export type DeletePresupuestoResult = { success: true } | { success: false; error: string }

export async function deletePresupuesto(id: string): Promise<DeletePresupuestoResult> {
  try {
    const userId = await getUserId()
    const pres = await prisma.presupuesto.findFirst({ where: { id, userId } })
    if (!pres) return { success: false, error: "Presupuesto no encontrado" }
    await prisma.presupuesto.delete({ where: { id } })
    revalidatePath("/")
    revalidatePath("/movimientos")
    revalidatePath("/presupuestos")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

// ---------------------------------------------------------------------------
// Meta de Ahorro
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
  try {
    const userId = await getUserId()
    const parsed = createMetaAhorroSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const cuenta = await prisma.cuenta.findFirst({
      where: { id: parsed.data.cuentaDestinoId, userId },
    })
    if (!cuenta) return { success: false, error: "Cuenta destino no encontrada" }
    const fechaObjetivo = new Date(parsed.data.fechaObjetivo + "T12:00:00Z")
    const meta = await prisma.metaAhorro.create({
      data: {
        userId,
        nombre: parsed.data.nombre,
        objetivoCLP: parsed.data.objetivoCLP,
        fechaObjetivo,
        aporteMensualSugerido: parsed.data.aporteMensualSugerido,
        cuentaDestinoId: parsed.data.cuentaDestinoId,
        estado: parsed.data.estado,
      },
    })
    revalidatePath("/")
    revalidatePath("/metas")
    return { success: true, id: meta.id }
  } catch {
    return { success: false, error: "No autorizado" }
  }
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

export async function updateMetaAhorro(
  id: string,
  data: unknown
): Promise<UpdateMetaAhorroResult> {
  try {
    const userId = await getUserId()
    const parsed = updateMetaAhorroSchema.safeParse(data)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return { success: false, error: first ?? "Datos inválidos" }
    }
    const meta = await prisma.metaAhorro.findFirst({ where: { id, userId } })
    if (!meta) return { success: false, error: "Meta no encontrada" }
    if (parsed.data.cuentaDestinoId != null) {
      const cuenta = await prisma.cuenta.findFirst({
        where: { id: parsed.data.cuentaDestinoId, userId },
      })
      if (!cuenta) return { success: false, error: "Cuenta destino no encontrada" }
    }
    const updateData: {
      nombre?: string
      objetivoCLP?: number
      fechaObjetivo?: Date
      aporteMensualSugerido?: number
      cuentaDestinoId?: string
      estado?: string
    } = {}
    if (parsed.data.nombre != null) updateData.nombre = parsed.data.nombre
    if (parsed.data.objetivoCLP != null) updateData.objetivoCLP = parsed.data.objetivoCLP
    if (parsed.data.fechaObjetivo != null)
      updateData.fechaObjetivo = new Date(parsed.data.fechaObjetivo + "T12:00:00Z")
    if (parsed.data.aporteMensualSugerido != null)
      updateData.aporteMensualSugerido = parsed.data.aporteMensualSugerido
    if (parsed.data.cuentaDestinoId != null) updateData.cuentaDestinoId = parsed.data.cuentaDestinoId
    if (parsed.data.estado != null) updateData.estado = parsed.data.estado
    if (Object.keys(updateData).length === 0) return { success: true }
    await prisma.metaAhorro.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/")
    revalidatePath("/metas")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}

export type DeleteMetaAhorroResult = { success: true } | { success: false; error: string }

export async function deleteMetaAhorro(id: string): Promise<DeleteMetaAhorroResult> {
  try {
    const userId = await getUserId()
    const meta = await prisma.metaAhorro.findFirst({ where: { id, userId } })
    if (!meta) return { success: false, error: "Meta no encontrada" }
    await prisma.metaAhorro.delete({ where: { id } })
    revalidatePath("/")
    revalidatePath("/metas")
    return { success: true }
  } catch {
    return { success: false, error: "No autorizado" }
  }
}
