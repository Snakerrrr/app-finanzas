"use client"

import { useMemo } from "react"
import { useData } from "@/lib/data-context"
import { DashboardClient } from "@/components/dashboard-client"
import type { DashboardData } from "@/lib/services/finance.service"
import type { MonthlyStat, CategoryStat } from "@/lib/services/finance.service"
import {
  DashboardKPISkeleton,
  DashboardChartsSkeleton,
  DashboardRecentSkeleton,
} from "@/components/skeletons"

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"]

function buildDashboardData(
  movimientos: DashboardData["movimientos"],
  cuentas: DashboardData["cuentas"],
  categorias: DashboardData["categorias"],
  tarjetasCredito: DashboardData["tarjetasCredito"],
  metasAhorro: DashboardData["metasAhorro"],
  presupuestos: DashboardData["presupuestos"]
): DashboardData {
  const now = new Date()
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, "0")}`

  const balanceTotal = cuentas.reduce((sum, c) => sum + c.saldoCalculado, 0)
  const movimientosMes = movimientos.filter((m) => m.mesConciliacion === mesActual)
  const movimientosMesAnterior = movimientos.filter((m) => m.mesConciliacion === mesAnterior)

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10)

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

  const categoriasMap = new Map(categorias.map((c) => [c.id, { nombre: c.nombre, color: c.color }]))
  const categoryStatsMap = new Map<string, { name: string; value: number; color: string }>()
  for (const m of movimientos) {
    if (m.tipoMovimiento !== "Gasto") continue
    if (m.fecha < sixMonthsAgoStr) continue
    const cat = categoriasMap.get(m.categoriaId)
    const nombre = cat?.nombre ?? "Sin categoría"
    const color = cat?.color ?? "#64748b"
    const current = categoryStatsMap.get(m.categoriaId)
    if (current) current.value += m.montoCLP
    else categoryStatsMap.set(m.categoriaId, { name: nombre, value: m.montoCLP, color })
  }
  const categoryStats: CategoryStat[] = Array.from(categoryStatsMap.values()).sort((a, b) => b.value - a.value)

  return {
    balanceTotal,
    movimientos,
    movimientosMes,
    movimientosMesAnterior,
    monthlyStats,
    categoryStats,
    cuentas,
    categorias,
    tarjetasCredito,
    metasAhorro,
    presupuestos,
  }
}

export default function DashboardPage() {
  const { movimientos, cuentas, categorias, tarjetasCredito, metasAhorro, presupuestos } = useData()

  const dashboardData = useMemo(
    () => buildDashboardData(movimientos, cuentas, categorias, tarjetasCredito, metasAhorro, presupuestos),
    [movimientos, cuentas, categorias, tarjetasCredito, metasAhorro, presupuestos]
  )

  if (movimientos.length === 0 && cuentas.length === 0 && categorias.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-40 animate-pulse rounded-md bg-muted/60" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted/50" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted/60" />
        </div>
        <DashboardKPISkeleton />
        <DashboardChartsSkeleton />
        <DashboardRecentSkeleton />
      </div>
    )
  }

  return <DashboardClient initialData={dashboardData} />
}
