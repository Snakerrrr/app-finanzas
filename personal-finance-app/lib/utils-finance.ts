import type { Movimiento, Presupuesto, MetaAhorro } from "./types"

export function formatCLP(value: number): string {
  return `$ ${Math.round(value).toLocaleString("es-CL")}`
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  return `${day}-${month}-${year}`
}

export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" })
}

export function filterMovimientosByMonth(movimientos: Movimiento[], month: string): Movimiento[] {
  return movimientos.filter((m) => m.fecha.startsWith(month))
}

export function calculateIngresosMes(movimientos: Movimiento[]): number {
  return movimientos.filter((m) => m.tipoMovimiento === "Ingreso").reduce((sum, m) => sum + m.montoCLP, 0)
}

export function calculateGastosMes(movimientos: Movimiento[]): number {
  return movimientos.filter((m) => m.tipoMovimiento === "Gasto").reduce((sum, m) => sum + m.montoCLP, 0)
}

export function calculateGastosByCategoria(movimientos: Movimiento[]): Record<string, number> {
  const gastos = movimientos.filter((m) => m.tipoMovimiento === "Gasto")
  const grouped: Record<string, number> = {}

  gastos.forEach((m) => {
    grouped[m.categoriaId] = (grouped[m.categoriaId] || 0) + m.montoCLP
  })

  return grouped
}

export function calculateGastosByTipo(movimientos: Movimiento[]): Record<string, number> {
  const gastos = movimientos.filter((m) => m.tipoMovimiento === "Gasto" && m.tipoGasto)
  const grouped: Record<string, number> = {}

  gastos.forEach((m) => {
    if (m.tipoGasto) {
      grouped[m.tipoGasto] = (grouped[m.tipoGasto] || 0) + m.montoCLP
    }
  })

  return grouped
}

export function calculatePresupuestoUsage(
  movimientos: Movimiento[],
  presupuestos: Presupuesto[],
  month: string,
): Array<{ categoriaId: string; presupuestado: number; gastado: number; porcentaje: number }> {
  const presupuestosMes = presupuestos.filter((p) => p.mes === month)
  const gastosPorCategoria = calculateGastosByCategoria(filterMovimientosByMonth(movimientos, month))

  return presupuestosMes.map((p) => {
    const gastado = gastosPorCategoria[p.categoriaId] || 0
    const porcentaje = p.montoPresupuestadoCLP > 0 ? (gastado / p.montoPresupuestadoCLP) * 100 : 0

    return {
      categoriaId: p.categoriaId,
      presupuestado: p.montoPresupuestadoCLP,
      gastado,
      porcentaje,
    }
  })
}

export function calculateAporteMensualSugerido(meta: MetaAhorro): number {
  const hoy = new Date()
  const fechaObjetivo = new Date(meta.fechaObjetivo)
  const mesesRestantes = Math.max(1, Math.ceil((fechaObjetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30)))

  const faltante = meta.objetivoCLP - meta.acumuladoCLP
  return Math.max(0, Math.ceil(faltante / mesesRestantes))
}

export function calculateSaldoCuenta(
  cuenta: { saldoInicialMes: number },
  movimientos: Movimiento[],
  cuentaId: string,
): number {
  let saldo = cuenta.saldoInicialMes

  movimientos.forEach((m) => {
    if (m.cuentaOrigenId === cuentaId) {
      saldo -= m.montoCLP
    }
    if (m.cuentaDestinoId === cuentaId && m.tipoMovimiento !== "Transferencia") {
      saldo += m.montoCLP
    }
    if (m.cuentaDestinoId === cuentaId && m.tipoMovimiento === "Transferencia") {
      saldo += m.montoCLP
    }
  })

  return saldo
}

export function getDailyFlow(
  movimientos: Movimiento[],
  month: string,
): Array<{ fecha: string; ingresos: number; gastos: number }> {
  const movimientosMes = filterMovimientosByMonth(movimientos, month)
  const dailyMap: Record<string, { ingresos: number; gastos: number }> = {}

  movimientosMes.forEach((m) => {
    if (!dailyMap[m.fecha]) {
      dailyMap[m.fecha] = { ingresos: 0, gastos: 0 }
    }

    if (m.tipoMovimiento === "Ingreso") {
      dailyMap[m.fecha].ingresos += m.montoCLP
    } else if (m.tipoMovimiento === "Gasto") {
      dailyMap[m.fecha].gastos += m.montoCLP
    }
  })

  return Object.entries(dailyMap)
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}
