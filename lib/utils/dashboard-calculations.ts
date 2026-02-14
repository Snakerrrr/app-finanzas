/**
 * Cálculos auxiliares para el Dashboard (Proyección, Comparación, etc.)
 */

import type { MovimientoForClient } from "@/lib/services/finance.service"

/**
 * Calcula la proyección de balance a fin de mes
 */
export function calculateProjectedBalance(params: {
  balanceActual: number
  movimientosMes: MovimientoForClient[]
  mesActual: string // YYYY-MM
}): {
  balanceProyectado: number
  ingresosPendientes: number
  gastosPendientes: number
  diasRestantes: number
} {
  const { balanceActual, movimientosMes, mesActual } = params

  // Calcular días restantes del mes
  const hoy = new Date()
  const [year, month] = mesActual.split("-").map(Number)
  const ultimoDiaMes = new Date(year, month, 0).getDate()
  const diaActual = hoy.getDate()
  const diasRestantes = Math.max(0, ultimoDiaMes - diaActual)

  // Calcular promedio diario de ingresos y gastos (basado en lo que llevamos del mes)
  const diasTranscurridos = diaActual
  const ingresosAcumulados = movimientosMes
    .filter((m) => m.tipoMovimiento === "Ingreso")
    .reduce((sum, m) => sum + m.montoCLP, 0)
  const gastosAcumulados = movimientosMes
    .filter((m) => m.tipoMovimiento === "Gasto")
    .reduce((sum, m) => sum + m.montoCLP, 0)

  const promedioIngresosDiario = diasTranscurridos > 0 ? ingresosAcumulados / diasTranscurridos : 0
  const promedioGastosDiario = diasTranscurridos > 0 ? gastosAcumulados / diasTranscurridos : 0

  // Proyectar ingresos y gastos para los días restantes
  const ingresosPendientes = promedioIngresosDiario * diasRestantes
  const gastosPendientes = promedioGastosDiario * diasRestantes

  // Calcular balance proyectado
  const balanceProyectado = balanceActual + ingresosPendientes - gastosPendientes

  return {
    balanceProyectado,
    ingresosPendientes,
    gastosPendientes,
    diasRestantes,
  }
}

/**
 * Calcula la comparación entre mes actual y mes anterior
 */
export function calculateMonthComparison(params: {
  movimientosMesActual: MovimientoForClient[]
  movimientosMesAnterior: MovimientoForClient[]
  mesActual: string // YYYY-MM
  mesAnterior: string // YYYY-MM
}): {
  mesActual: string
  mesAnterior: string
  ingresosActual: number
  ingresosAnterior: number
  gastosActual: number
  gastosAnterior: number
  balanceActual: number
  balanceAnterior: number
} {
  const { movimientosMesActual, movimientosMesAnterior, mesActual, mesAnterior } = params

  // Calcular ingresos, gastos y balance del mes actual
  const ingresosActual = movimientosMesActual
    .filter((m) => m.tipoMovimiento === "Ingreso")
    .reduce((sum, m) => sum + m.montoCLP, 0)
  const gastosActual = movimientosMesActual
    .filter((m) => m.tipoMovimiento === "Gasto")
    .reduce((sum, m) => sum + m.montoCLP, 0)
  const balanceActual = ingresosActual - gastosActual

  // Calcular ingresos, gastos y balance del mes anterior
  const ingresosAnterior = movimientosMesAnterior
    .filter((m) => m.tipoMovimiento === "Ingreso")
    .reduce((sum, m) => sum + m.montoCLP, 0)
  const gastosAnterior = movimientosMesAnterior
    .filter((m) => m.tipoMovimiento === "Gasto")
    .reduce((sum, m) => sum + m.montoCLP, 0)
  const balanceAnterior = ingresosAnterior - gastosAnterior

  return {
    mesActual,
    mesAnterior,
    ingresosActual,
    ingresosAnterior,
    gastosActual,
    gastosAnterior,
    balanceActual,
    balanceAnterior,
  }
}

/**
 * Obtiene el mes anterior en formato YYYY-MM
 */
export function getPreviousMonth(mesActual: string): string {
  const [year, month] = mesActual.split("-").map(Number)
  if (month === 1) {
    return `${year - 1}-12`
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`
}
