/**
 * Capa de servicios de finanzas.
 *
 * Contiene toda la lógica de negocio e interacción con Prisma.
 * - Funciones asíncronas puras: reciben (userId, datos) y retornan resultados.
 * - NO incluyen: revalidatePath, auth(), redirecciones ni lógica de sesión.
 *
 * Consumido por: Server Actions (Web) y API Routes (móvil).
 */

import { prisma } from "@/lib/db"
import { getCached, setCached, cacheKeys, invalidateUserCache } from "@/lib/cache"

// ---------------------------------------------------------------------------
// Tipos para el cliente (respuestas)
// ---------------------------------------------------------------------------

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

export type TarjetaForClient = {
  id: string
  nombre: string
  banco: string
  cupoTotal: number
  cupoDisponible: number
  fechaFacturacion: number
  fechaPago: number
  tasaInteresMensual: number
  deudaActual: number
  deudaFacturada: number
  deudaNoFacturada: number
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

export type MonthlyStat = { name: string; ingresos: number; gastos: number }
export type CategoryStat = { name: string; value: number; color: string }

export type DashboardData = {
  balanceTotal: number
  movimientos: MovimientoForClient[]
  movimientosMes: MovimientoForClient[]
  movimientosMesAnterior: MovimientoForClient[] // Para comparación mensual
  monthlyStats: MonthlyStat[]
  categoryStats: CategoryStat[]
  cuentas: CuentaForClient[]
  categorias: CategoriaForClient[]
  tarjetasCredito: TarjetaForClient[]
  metasAhorro: MetaForClient[]
  presupuestos: PresupuestoForClient[]
}

// ---------------------------------------------------------------------------
// Tipos de entrada (datos ya validados por la capa superior)
// ---------------------------------------------------------------------------

export type CreateMovimientoInput = {
  fecha: string
  descripcion: string
  tipoMovimiento: "Ingreso" | "Gasto" | "Transferencia"
  categoriaId: string
  subcategoria?: string
  tipoGasto?: "Fijo" | "Variable" | "Ocasional"
  metodoPago: "Débito" | "Crédito" | "Efectivo" | "Transferencia"
  montoCLP: number
  cuotas?: number
  notas?: string
  estadoConciliacion: "Pendiente" | "Conciliado"
  mesConciliacion: string
  cuentaOrigenId?: string
  cuentaDestinoId?: string
  tarjetaCreditoId?: string
}

/** Alias para firma tipo createMovimientoService(userId, data: MovimientoCreateInput) */
export type MovimientoCreateInput = CreateMovimientoInput

export type UpdateMovimientoInput = Partial<CreateMovimientoInput> & {
  subcategoria?: string | null
  tipoGasto?: "Fijo" | "Variable" | "Ocasional" | null
  cuotas?: number | null
  notas?: string | null
  cuentaOrigenId?: string | null
  cuentaDestinoId?: string | null
  tarjetaCreditoId?: string | null
}

export type CreateCuentaInput = { nombre: string; banco: string; saldoInicialMes?: number }
export type UpdateCuentaInput = {
  nombre?: string
  banco?: string
  saldoInicialMes?: number
  activo?: boolean
  saldoFinalMesDeclarado?: number | null
}

export type CreateCategoriaInput = {
  nombre: string
  tipo: "Gasto" | "Ingreso" | "Ambos"
  color: string
  icono: string
}
export type UpdateCategoriaInput = Partial<CreateCategoriaInput>

export type CreatePresupuestoInput = {
  categoriaId: string
  mes: string
  montoPresupuestadoCLP: number
}
export type UpdatePresupuestoInput = {
  categoriaId?: string
  mes?: string
  montoPresupuestadoCLP?: number
}

export type CreateMetaAhorroInput = {
  nombre: string
  objetivoCLP: number
  fechaObjetivo: string
  aporteMensualSugerido: number
  cuentaDestinoId: string
  estado?: "Activa" | "Completada"
}
export type UpdateMetaAhorroInput = {
  nombre?: string
  objetivoCLP?: number
  fechaObjetivo?: string
  aporteMensualSugerido?: number
  acumuladoCLP?: number
  cuentaDestinoId?: string
  estado?: "Activa" | "Completada"
}

export type CreateTarjetaCreditoInput = {
  nombre: string
  banco: string
  cupoTotal: number
  cupoDisponible: number
  fechaFacturacion: number
  fechaPago: number
  tasaInteresMensual: number
  deudaActual?: number
  deudaFacturada?: number
  deudaNoFacturada?: number
}
export type UpdateTarjetaCreditoInput = {
  nombre?: string
  banco?: string
  cupoTotal?: number
  cupoDisponible?: number
  fechaFacturacion?: number
  fechaPago?: number
  tasaInteresMensual?: number
  deudaActual?: number
  deudaFacturada?: number
  deudaNoFacturada?: number
}

// ---------------------------------------------------------------------------
// Resultados del servicio
// ---------------------------------------------------------------------------

export type ResultOk = { success: true }
export type ResultOkId = { success: true; id: string }
export type ResultFail = { success: false; error: string }
export type Result<T = ResultOk> = T | ResultFail

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES = [
  { nombre: "Comida", tipo: "Gasto" as const, color: "#f59e0b", icono: "ShoppingCart" },
  { nombre: "Transporte", tipo: "Gasto" as const, color: "#3b82f6", icono: "Bus" },
  { nombre: "Vivienda", tipo: "Gasto" as const, color: "#ef4444", icono: "Home" },
  { nombre: "Ingreso Laboral", tipo: "Ingreso" as const, color: "#10b981", icono: "DollarSign" },
]

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

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Cache: intentar leer del cache primero (TTL 30s)
  const cacheKey = cacheKeys.dashboard(userId)
  const cached = await getCached<DashboardData>(cacheKey)
  if (cached) return cached

  await ensureDefaultCategories(userId)
  const now = new Date()
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  
  // Calcular mes anterior para comparación
  const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, "0")}`

  // ⚡ Optimización: Solo 5 queries en paralelo (antes eran 9).
  // 1 query de movimientos (todos) y filtramos en memoria.
  const [
    cuentas,
    movimientosRaw,
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
    prisma.categoria.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.tarjetaCredito.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.metaAhorro.findMany({ where: { userId }, orderBy: { nombre: "asc" } }),
    prisma.presupuesto.findMany({ where: { userId } }),
  ])

  const balanceTotal = cuentas.reduce((sum, c) => sum + c.saldoCalculado, 0)
  const movimientos = movimientosRaw.map(toMovimientoForClient)

  // Filtrar en memoria en lugar de hacer queries separadas
  const movimientosMes = movimientos.filter((m) => m.mesConciliacion === mesActual)
  const movimientosMesAnterior = movimientos.filter((m) => m.mesConciliacion === mesAnterior)

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10)

  const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"]
  const monthlyStats: MonthlyStat[] = []
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`
    const name = MONTH_NAMES[monthDate.getMonth()]
    let ingresos = 0
    let gastos = 0
    for (const m of movimientos) {
      if (m.mesConciliacion !== yearMonth) continue
      if (m.tipoMovimiento === "Ingreso") ingresos += m.montoCLP
      if (m.tipoMovimiento === "Gasto") gastos += m.montoCLP
    }
    monthlyStats.push({ name, ingresos, gastos })
  }

  // Construir categorías de los últimos 6 meses usando datos en memoria
  const categoriasMap = new Map(categorias.map((c) => [c.id, { nombre: c.nombre, color: c.color }]))
  const categoryStatsMap = new Map<string, { name: string; value: number; color: string }>()
  for (const m of movimientos) {
    if (m.tipoMovimiento !== "Gasto") continue
    if (m.fecha < sixMonthsAgoStr) continue
    const key = m.categoriaId
    const cat = categoriasMap.get(key)
    const nombre = cat?.nombre ?? "Sin categoría"
    const color = cat?.color ?? "#64748b"
    const current = categoryStatsMap.get(key)
    if (current) current.value += m.montoCLP
    else categoryStatsMap.set(key, { name: nombre, value: m.montoCLP, color })
  }
  const categoryStats: CategoryStat[] = Array.from(categoryStatsMap.values()).sort((a, b) => b.value - a.value)

  const result: DashboardData = {
    balanceTotal,
    movimientos,
    movimientosMes,
    movimientosMesAnterior,
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
      fechaFacturacion: t.fechaFacturacion,
      fechaPago: t.fechaPago,
      tasaInteresMensual: t.tasaInteresMensual,
      deudaActual: t.deudaActual,
      deudaFacturada: t.deudaFacturada,
      deudaNoFacturada: t.deudaNoFacturada,
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

  // Cache: guardar resultado (TTL 30s)
  await setCached(cacheKey, result, 30)

  return result
}

/** Filtros opcionales para buscar movimientos */
export type GetMovimientosFilters = {
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  categoryId?: string
}

/**
 * Obtiene movimientos del usuario con filtros opcionales por rango de fechas y categoría.
 * Usado por el chatbot y la API para búsquedas.
 */
export async function getMovimientos(
  userId: string,
  filters?: GetMovimientosFilters
): Promise<MovimientoForClient[]> {
  // Cache: intentar leer del cache primero (TTL 30s)
  const cacheKey = cacheKeys.movimientos(userId, filters)
  const cached = await getCached<MovimientoForClient[]>(cacheKey)
  if (cached) return cached

  await ensureDefaultCategories(userId)
  const where: { userId: string; fecha?: { gte?: Date; lte?: Date }; categoriaId?: string } = {
    userId,
  }
  if (filters?.startDate) {
    where.fecha = { ...where.fecha, gte: new Date(filters.startDate + "T00:00:00Z") }
  }
  if (filters?.endDate) {
    where.fecha = {
      ...where.fecha,
      lte: new Date(filters.endDate + "T23:59:59.999Z"),
    }
  }
  if (filters?.categoryId) {
    where.categoriaId = filters.categoryId
  }
  const raw = await prisma.movimiento.findMany({
    where,
    include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
    orderBy: { fecha: "desc" },
  })
  const result = raw.map(toMovimientoForClient)

  // Cache: guardar resultado (TTL 30s)
  await setCached(cacheKey, result, 30)

  return result
}

// ---------------------------------------------------------------------------
// Movimientos
// ---------------------------------------------------------------------------

export async function createMovimiento(
  userId: string,
  data: CreateMovimientoInput
): Promise<Result<ResultOk>> {
  const { tipoMovimiento, montoCLP, cuentaOrigenId, cuentaDestinoId } = data
  const mesConciliacion = data.mesConciliacion
  const fecha = new Date(data.fecha + "T12:00:00Z")

  await prisma.$transaction(async (tx) => {
    await tx.movimiento.create({
      data: {
        userId,
        fecha,
        descripcion: data.descripcion,
        tipoMovimiento: data.tipoMovimiento,
        categoriaId: data.categoriaId,
        subcategoria: data.subcategoria ?? null,
        tipoGasto: data.tipoGasto ?? null,
        metodoPago: data.metodoPago,
        montoCLP: data.montoCLP,
        cuotas: data.cuotas ?? null,
        notas: data.notas ?? null,
        estadoConciliacion: data.estadoConciliacion,
        mesConciliacion,
        cuentaOrigenId: data.cuentaOrigenId ?? null,
        cuentaDestinoId: data.cuentaDestinoId ?? null,
        tarjetaCreditoId: data.tarjetaCreditoId ?? null,
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

  // Cache: invalidar datos del usuario tras crear movimiento
  await invalidateUserCache(userId)

  return { success: true }
}

export async function updateMovimiento(
  userId: string,
  id: string,
  data: UpdateMovimientoInput
): Promise<Result<ResultOk>> {
  const oldMov = await prisma.movimiento.findFirst({ where: { id, userId } })
  if (!oldMov) return { success: false, error: "Movimiento no encontrado" }

  const newTipo = data.tipoMovimiento ?? oldMov.tipoMovimiento
  const newMonto = data.montoCLP ?? oldMov.montoCLP
  const newCuentaOrigenId = data.cuentaOrigenId !== undefined ? data.cuentaOrigenId : oldMov.cuentaOrigenId
  const newCuentaDestinoId = data.cuentaDestinoId !== undefined ? data.cuentaDestinoId : oldMov.cuentaDestinoId

  await prisma.$transaction(async (tx) => {
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
    if (data.fecha != null) updateData.fecha = new Date(data.fecha + "T12:00:00Z")
    if (data.descripcion != null) updateData.descripcion = data.descripcion
    if (data.tipoMovimiento != null) updateData.tipoMovimiento = data.tipoMovimiento
    if (data.categoriaId != null) updateData.categoriaId = data.categoriaId
    if (data.subcategoria !== undefined) updateData.subcategoria = data.subcategoria
    if (data.tipoGasto !== undefined) updateData.tipoGasto = data.tipoGasto
    if (data.metodoPago != null) updateData.metodoPago = data.metodoPago
    if (data.montoCLP != null) updateData.montoCLP = data.montoCLP
    if (data.cuotas !== undefined) updateData.cuotas = data.cuotas
    if (data.notas !== undefined) updateData.notas = data.notas
    if (data.estadoConciliacion != null) updateData.estadoConciliacion = data.estadoConciliacion
    if (data.mesConciliacion != null) updateData.mesConciliacion = data.mesConciliacion
    if (data.cuentaOrigenId !== undefined) updateData.cuentaOrigenId = data.cuentaOrigenId
    if (data.cuentaDestinoId !== undefined) updateData.cuentaDestinoId = data.cuentaDestinoId
    if (data.tarjetaCreditoId !== undefined) updateData.tarjetaCreditoId = data.tarjetaCreditoId

    await tx.movimiento.update({ where: { id }, data: updateData })

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

  // Cache: invalidar datos del usuario tras actualizar movimiento
  await invalidateUserCache(userId)

  return { success: true }
}

export async function deleteMovimiento(userId: string, id: string): Promise<Result<ResultOk>> {
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

  // Cache: invalidar datos del usuario tras eliminar movimiento
  await invalidateUserCache(userId)

  return { success: true }
}

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

export async function createCuenta(
  userId: string,
  data: CreateCuentaInput
): Promise<Result<ResultOkId>> {
  const cuenta = await prisma.cuenta.create({
    data: {
      userId,
      nombre: data.nombre,
      banco: data.banco,
      saldoInicialMes: data.saldoInicialMes ?? 0,
      saldoCalculado: data.saldoInicialMes ?? 0,
    },
  })
  await invalidateUserCache(userId)
  return { success: true, id: cuenta.id }
}

export async function updateCuenta(
  userId: string,
  id: string,
  data: UpdateCuentaInput
): Promise<Result<ResultOk>> {
  const cuenta = await prisma.cuenta.findFirst({ where: { id, userId } })
  if (!cuenta) return { success: false, error: "Cuenta no encontrada" }
  const updateData: { nombre?: string; banco?: string; saldoInicialMes?: number; activo?: boolean; saldoFinalMesDeclarado?: number | null } = {}
  if (data.nombre != null) updateData.nombre = data.nombre
  if (data.banco != null) updateData.banco = data.banco
  if (data.saldoInicialMes != null) updateData.saldoInicialMes = data.saldoInicialMes
  if (data.activo != null) updateData.activo = data.activo
  if (data.saldoFinalMesDeclarado !== undefined) updateData.saldoFinalMesDeclarado = data.saldoFinalMesDeclarado
  if (Object.keys(updateData).length === 0) return { success: true }
  await prisma.cuenta.update({ where: { id }, data: updateData })
  await invalidateUserCache(userId)
  return { success: true }
}

export async function deleteCuenta(userId: string, id: string): Promise<Result<ResultOk>> {
  const cuenta = await prisma.cuenta.findFirst({ where: { id, userId } })
  if (!cuenta) return { success: false, error: "Cuenta no encontrada" }
  const [origenCount, destinoCount, metasCount] = await Promise.all([
    prisma.movimiento.count({ where: { userId, cuentaOrigenId: id } }),
    prisma.movimiento.count({ where: { userId, cuentaDestinoId: id } }),
    prisma.metaAhorro.count({ where: { userId, cuentaDestinoId: id } }),
  ])
  if (origenCount > 0 || destinoCount > 0)
    return { success: false, error: "No se puede eliminar: tiene movimientos asociados. Elimina o reasigna los movimientos primero." }
  if (metasCount > 0)
    return { success: false, error: "No se puede eliminar: tiene metas de ahorro asociadas. Cambia la cuenta destino de las metas primero." }
  await prisma.cuenta.delete({ where: { id } })
  return { success: true }
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export async function createCategoria(
  userId: string,
  data: CreateCategoriaInput
): Promise<Result<ResultOkId>> {
  const cat = await prisma.categoria.create({
    data: { userId, nombre: data.nombre, tipo: data.tipo, color: data.color, icono: data.icono },
  })
  return { success: true, id: cat.id }
}

export async function updateCategoria(
  userId: string,
  id: string,
  data: UpdateCategoriaInput
): Promise<Result<ResultOk>> {
  const cat = await prisma.categoria.findFirst({ where: { id, userId } })
  if (!cat) return { success: false, error: "Categoría no encontrada" }
  const updateData: { nombre?: string; tipo?: string; color?: string; icono?: string } = {}
  if (data.nombre != null) updateData.nombre = data.nombre
  if (data.tipo != null) updateData.tipo = data.tipo
  if (data.color != null) updateData.color = data.color
  if (data.icono != null) updateData.icono = data.icono
  if (Object.keys(updateData).length === 0) return { success: true }
  await prisma.categoria.update({ where: { id }, data: updateData })
  return { success: true }
}

export async function deleteCategoria(userId: string, id: string): Promise<Result<ResultOk>> {
  const cat = await prisma.categoria.findFirst({ where: { id, userId } })
  if (!cat) return { success: false, error: "Categoría no encontrada" }
  const movCount = await prisma.movimiento.count({ where: { userId, categoriaId: id } })
  if (movCount > 0)
    return { success: false, error: "No se puede eliminar: tiene movimientos asociados. Reasigna o elimina los movimientos primero." }
  await prisma.categoria.delete({ where: { id } })
  return { success: true }
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

export async function createPresupuesto(
  userId: string,
  data: CreatePresupuestoInput
): Promise<Result<ResultOkId>> {
  const cat = await prisma.categoria.findFirst({
    where: { id: data.categoriaId, userId },
  })
  if (!cat) return { success: false, error: "Categoría no encontrada" }
  try {
    const pres = await prisma.presupuesto.create({
      data: {
        userId,
        categoriaId: data.categoriaId,
        mes: data.mes,
        montoPresupuestadoCLP: data.montoPresupuestadoCLP,
      },
    })
    return { success: true, id: pres.id }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
      return { success: false, error: "Ya existe un presupuesto para esta categoría y mes" }
    throw e
  }
}

export async function updatePresupuesto(
  userId: string,
  id: string,
  data: UpdatePresupuestoInput
): Promise<Result<ResultOk>> {
  const pres = await prisma.presupuesto.findFirst({ where: { id, userId } })
  if (!pres) return { success: false, error: "Presupuesto no encontrado" }
  if (data.categoriaId != null) {
    const cat = await prisma.categoria.findFirst({ where: { id: data.categoriaId, userId } })
    if (!cat) return { success: false, error: "Categoría no encontrada" }
  }
  const updateData: { categoriaId?: string; mes?: string; montoPresupuestadoCLP?: number } = {}
  if (data.categoriaId != null) updateData.categoriaId = data.categoriaId
  if (data.mes != null) updateData.mes = data.mes
  if (data.montoPresupuestadoCLP != null) updateData.montoPresupuestadoCLP = data.montoPresupuestadoCLP
  if (Object.keys(updateData).length === 0) return { success: true }
  try {
    await prisma.presupuesto.update({ where: { id }, data: updateData })
    return { success: true }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
      return { success: false, error: "Ya existe un presupuesto para esa categoría y mes" }
    throw e
  }
}

export async function deletePresupuesto(userId: string, id: string): Promise<Result<ResultOk>> {
  const pres = await prisma.presupuesto.findFirst({ where: { id, userId } })
  if (!pres) return { success: false, error: "Presupuesto no encontrado" }
  await prisma.presupuesto.delete({ where: { id } })
  return { success: true }
}

// ---------------------------------------------------------------------------
// Metas de ahorro
// ---------------------------------------------------------------------------

export async function createMetaAhorro(
  userId: string,
  data: CreateMetaAhorroInput
): Promise<Result<ResultOkId>> {
  const cuenta = await prisma.cuenta.findFirst({
    where: { id: data.cuentaDestinoId, userId },
  })
  if (!cuenta) return { success: false, error: "Cuenta destino no encontrada" }
  const fechaObjetivo = new Date(data.fechaObjetivo + "T12:00:00Z")
  const meta = await prisma.metaAhorro.create({
    data: {
      userId,
      nombre: data.nombre,
      objetivoCLP: data.objetivoCLP,
      fechaObjetivo,
      aporteMensualSugerido: data.aporteMensualSugerido,
      cuentaDestinoId: data.cuentaDestinoId,
      estado: data.estado ?? "Activa",
    },
  })
  await invalidateUserCache(userId)
  return { success: true, id: meta.id }
}

export async function updateMetaAhorro(
  userId: string,
  id: string,
  data: UpdateMetaAhorroInput
): Promise<Result<ResultOk>> {
  const meta = await prisma.metaAhorro.findFirst({ where: { id, userId } })
  if (!meta) return { success: false, error: "Meta no encontrada" }
  if (data.cuentaDestinoId != null) {
    const cuenta = await prisma.cuenta.findFirst({
      where: { id: data.cuentaDestinoId, userId },
    })
    if (!cuenta) return { success: false, error: "Cuenta destino no encontrada" }
  }
  const updateData: {
    nombre?: string
    objetivoCLP?: number
    fechaObjetivo?: Date
    aporteMensualSugerido?: number
    acumuladoCLP?: number
    cuentaDestinoId?: string
    estado?: string
  } = {}
  if (data.nombre != null) updateData.nombre = data.nombre
  if (data.objetivoCLP != null) updateData.objetivoCLP = data.objetivoCLP
  if (data.fechaObjetivo != null) updateData.fechaObjetivo = new Date(data.fechaObjetivo + "T12:00:00Z")
  if (data.aporteMensualSugerido != null) updateData.aporteMensualSugerido = data.aporteMensualSugerido
  if (data.acumuladoCLP != null) updateData.acumuladoCLP = data.acumuladoCLP
  if (data.cuentaDestinoId != null) updateData.cuentaDestinoId = data.cuentaDestinoId
  if (data.estado != null) updateData.estado = data.estado
  if (Object.keys(updateData).length === 0) return { success: true }
  await prisma.metaAhorro.update({ where: { id }, data: updateData })
  await invalidateUserCache(userId)
  return { success: true }
}

export async function deleteMetaAhorro(userId: string, id: string): Promise<Result<ResultOk>> {
  const meta = await prisma.metaAhorro.findFirst({ where: { id, userId } })
  if (!meta) return { success: false, error: "Meta no encontrada" }
  await prisma.metaAhorro.delete({ where: { id } })
  await invalidateUserCache(userId)
  return { success: true }
}

export async function aportarMeta(
  userId: string,
  id: string,
  monto: number
): Promise<Result<ResultOk>> {
  const meta = await prisma.metaAhorro.findFirst({ where: { id, userId } })
  if (!meta) return { success: false, error: "Meta no encontrada" }
  await prisma.metaAhorro.update({
    where: { id },
    data: { acumuladoCLP: { increment: monto } },
  })
  await invalidateUserCache(userId)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Tarjetas de Crédito CRUD
// ---------------------------------------------------------------------------

export async function createTarjetaCredito(
  userId: string,
  data: CreateTarjetaCreditoInput
): Promise<Result<ResultOkId>> {
  const tarjeta = await prisma.tarjetaCredito.create({
    data: {
      userId,
      nombre: data.nombre,
      banco: data.banco,
      cupoTotal: data.cupoTotal,
      cupoDisponible: data.cupoDisponible,
      fechaFacturacion: data.fechaFacturacion,
      fechaPago: data.fechaPago,
      tasaInteresMensual: data.tasaInteresMensual,
      deudaActual: data.deudaActual ?? 0,
      deudaFacturada: data.deudaFacturada ?? 0,
      deudaNoFacturada: data.deudaNoFacturada ?? 0,
    },
  })
  await invalidateUserCache(userId)
  return { success: true, id: tarjeta.id }
}

export async function updateTarjetaCredito(
  userId: string,
  id: string,
  data: UpdateTarjetaCreditoInput
): Promise<Result<ResultOk>> {
  const tarjeta = await prisma.tarjetaCredito.findFirst({ where: { id, userId } })
  if (!tarjeta) return { success: false, error: "Tarjeta no encontrada" }
  const updateData: Record<string, number | string> = {}
  if (data.nombre != null) updateData.nombre = data.nombre
  if (data.banco != null) updateData.banco = data.banco
  if (data.cupoTotal != null) updateData.cupoTotal = data.cupoTotal
  if (data.cupoDisponible != null) updateData.cupoDisponible = data.cupoDisponible
  if (data.fechaFacturacion != null) updateData.fechaFacturacion = data.fechaFacturacion
  if (data.fechaPago != null) updateData.fechaPago = data.fechaPago
  if (data.tasaInteresMensual != null) updateData.tasaInteresMensual = data.tasaInteresMensual
  if (data.deudaActual != null) updateData.deudaActual = data.deudaActual
  if (data.deudaFacturada != null) updateData.deudaFacturada = data.deudaFacturada
  if (data.deudaNoFacturada != null) updateData.deudaNoFacturada = data.deudaNoFacturada
  if (Object.keys(updateData).length === 0) return { success: true }
  await prisma.tarjetaCredito.update({ where: { id }, data: updateData })
  await invalidateUserCache(userId)
  return { success: true }
}

export async function deleteTarjetaCredito(userId: string, id: string): Promise<Result<ResultOk>> {
  const tarjeta = await prisma.tarjetaCredito.findFirst({ where: { id, userId } })
  if (!tarjeta) return { success: false, error: "Tarjeta no encontrada" }
  await prisma.tarjetaCredito.delete({ where: { id } })
  await invalidateUserCache(userId)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Aliases con sufijo "Service" (misma firma: userId + body → resultado Prisma)
// ---------------------------------------------------------------------------

export const getDashboardDataService = getDashboardData
export const createMovimientoService = createMovimiento
export const updateMovimientoService = updateMovimiento
export const deleteMovimientoService = deleteMovimiento
export const createCuentaService = createCuenta
export const updateCuentaService = updateCuenta
export const deleteCuentaService = deleteCuenta
export const createCategoriaService = createCategoria
export const updateCategoriaService = updateCategoria
export const deleteCategoriaService = deleteCategoria
export const createPresupuestoService = createPresupuesto
export const updatePresupuestoService = updatePresupuesto
export const deletePresupuestoService = deletePresupuesto
export const createMetaAhorroService = createMetaAhorro
export const updateMetaAhorroService = updateMetaAhorro
export const deleteMetaAhorroService = deleteMetaAhorro
export const createTarjetaCreditoService = createTarjetaCredito
export const updateTarjetaCreditoService = updateTarjetaCredito
export const deleteTarjetaCreditoService = deleteTarjetaCredito
