"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DashboardData } from "@/app/actions/finance"
import {
  formatCLP,
  getCurrentMonth,
  calculateIngresosMes,
  calculateGastosMes,
  calculateGastosByTipo,
  getDailyFlow,
  getMonthName,
} from "@/lib/utils-finance"
import { TrendingUp, TrendingDown, Wallet, CreditCard, Target } from "lucide-react"
import { CompactModeToggle, useCompactMode } from "@/components/dashboard/compact-mode-toggle"
import { KPIGrid } from "@/components/dashboard/kpi-grid"
import { FinancialHealthCard } from "@/components/dashboard/financial-health-card"
import { ProjectedBalanceCard } from "@/components/dashboard/projected-balance-card"
import { MonthComparisonCard } from "@/components/dashboard/month-comparison-card"
import { WeeklySpendingCard } from "@/components/dashboard/weekly-spending-card"
import { SpendingHeatmap } from "@/components/dashboard/spending-heatmap"
import { GamificationCard } from "@/components/dashboard/gamification-card"
import { DailyTipCard } from "@/components/dashboard/daily-tip-card"
import { AnnualTrendsCard } from "@/components/dashboard/annual-trends-card"
import { DashboardAlerts } from "@/components/alerts/dashboard-alerts"
import { calculateProjectedBalance, calculateMonthComparison, getPreviousMonth } from "@/lib/utils/dashboard-calculations"
import type { GamificationStats } from "@/lib/services/gamification.service"
import type { TipForClient } from "@/lib/services/tips.service"
import type { SmartAlertForClient } from "@/lib/services/alerts.service"
import { getGamificationStats } from "@/app/actions/gamification"
import { getActiveAlerts, generateAlertsAction } from "@/app/actions/alerts"
import { getDailyTip } from "@/app/actions/tips"
import { updateStreakAction } from "@/app/actions/gamification"
import { motion, AnimatePresence } from "framer-motion"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DashboardClientProps {
  initialData: DashboardData
}

/** Encabezado del dashboard (título + mes + toggle modo compacto). */
export function DashboardHeader({ 
  initialData,
  isCompact,
  onToggleCompact,
}: DashboardClientProps & { 
  isCompact?: boolean
  onToggleCompact?: (value: boolean) => void 
}) {
  const mesActual = getCurrentMonth()
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{getMonthName(mesActual)}</p>
      </div>
      {onToggleCompact !== undefined && isCompact !== undefined && (
        <CompactModeToggle isCompact={isCompact} onToggle={onToggleCompact} />
      )}
    </div>
  )
}

/** Solo la fila de KPIs (para Suspense granular) - ahora con modo compacto, salud financiera, proyección y comparación. */
export function DashboardKPISection({ 
  initialData,
  isCompact = false,
}: DashboardClientProps & { isCompact?: boolean }) {
  const { movimientosMes, movimientosMesAnterior, tarjetasCredito, metasAhorro, presupuestos, balanceTotal } = initialData
  const ingresosMes = calculateIngresosMes(movimientosMes)
  const gastosMes = calculateGastosMes(movimientosMes)
  const ahorroNeto = ingresosMes - gastosMes
  const deudaTotal = tarjetasCredito.reduce((sum, tc) => sum + tc.deudaActual, 0)
  const progresoMetas =
    metasAhorro.length > 0
      ? metasAhorro.reduce((sum, meta) => sum + (meta.acumuladoCLP / meta.objetivoCLP) * 100, 0) / metasAhorro.length
      : 0

  // Calcular presupuestos cumplidos para el score de salud financiera
  const mesActual = getCurrentMonth()
  const presupuestosMes = presupuestos.filter((p) => p.mes === mesActual)
  const presupuestosCumplidos = presupuestosMes.filter((p) => {
    const gastosCategoria = movimientosMes
      .filter((m) => m.categoriaId === p.categoriaId && m.tipoMovimiento === "Gasto")
      .reduce((sum, m) => sum + m.montoCLP, 0)
    return gastosCategoria <= p.montoPresupuestadoCLP
  }).length

  // Calcular proyección de balance
  const proyeccion = calculateProjectedBalance({
    balanceActual: balanceTotal,
    movimientosMes,
    mesActual,
  })

  // Calcular comparación mensual
  const mesAnterior = getPreviousMonth(mesActual)
  const comparacion = calculateMonthComparison({
    movimientosMesActual: movimientosMes,
    movimientosMesAnterior,
    mesActual,
    mesAnterior,
  })

  return (
    <div className="space-y-4">
      <KPIGrid
        ahorroNeto={ahorroNeto}
        ingresosMes={ingresosMes}
        gastosMes={gastosMes}
        deudaTotal={deudaTotal}
        progresoMetas={progresoMetas}
        isCompact={isCompact}
      />

      {/* Tarjetas adicionales - Solo en modo expandido */}
      {!isCompact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {/* Semáforo de Salud Financiera */}
          <FinancialHealthCard
            data={{
              ingresosMes,
              gastosMes,
              ahorroNeto,
              deudaTotal,
              presupuestosCumplidos,
              presupuestosTotales: presupuestosMes.length,
              metasProgreso: progresoMetas,
            }}
            showDetails={false}
          />

          {/* Proyección de Balance */}
          <ProjectedBalanceCard
            balanceActual={balanceTotal}
            balanceProyectado={proyeccion.balanceProyectado}
            ingresosPendientes={proyeccion.ingresosPendientes}
            gastosPendientes={proyeccion.gastosPendientes}
            diasRestantes={proyeccion.diasRestantes}
          />
        </motion.div>
      )}

      {/* Comparación Mensual - Solo en modo expandido */}
      {!isCompact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <MonthComparisonCard data={comparacion} />
        </motion.div>
      )}
    </div>
  )
}

/** Solo los gráficos (Flujo, Ingresos vs Gastos, Gastos por Categoría, Tipo) para Suspense granular - ocultos en modo compacto. */
export function DashboardChartsSection({ 
  initialData,
  isCompact = false,
}: DashboardClientProps & { isCompact?: boolean }) {
  const { movimientosMes, categorias, monthlyStats, categoryStats } = initialData
  const mesActual = getCurrentMonth()
  const dailyFlow = getDailyFlow(movimientosMes, mesActual)
  const gastosPorTipo = calculateGastosByTipo(movimientosMes)
  const dataTipoGasto = Object.entries(gastosPorTipo).map(([tipo, monto]) => ({ tipo, monto }))
  const COLORS_TIPO = { Fijo: "#ef4444", Variable: "#f59e0b", Ocasional: "#8b5cf6" }

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null)

  // Filtrar movimientos por categoría o tipo seleccionado
  const filteredMovimientos = movimientosMes.filter((m) => {
    if (selectedCategory) {
      const cat = categorias.find((c) => c.id === m.categoriaId)
      return cat?.nombre === selectedCategory
    }
    if (selectedTipo) {
      return m.tipoGasto === selectedTipo
    }
    return true
  })

  const filteredTotal = filteredMovimientos
    .filter((m) => m.tipoMovimiento === "Gasto")
    .reduce((s, m) => s + m.montoCLP, 0)

  // No renderizar en modo compacto
  if (isCompact) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="grid gap-4 md:grid-cols-2"
    >
      <Card>
        <CardHeader>
          <CardTitle>Flujo Diario</CardTitle>
          <CardDescription>Ingresos vs Gastos del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyFlow}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="fecha" className="text-xs" tickFormatter={(v) => v.split("-")[2]} />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCLP(v)}
                labelClassName="text-foreground"
                contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos" strokeWidth={2} />
              <Line type="monotone" dataKey="gastos" stroke="#ef4444" name="Gastos" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
          <CardDescription>Últimos 6 meses (datos del servidor)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCLP(v)}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>
                {selectedCategory
                  ? `Filtrado: ${selectedCategory} (${formatCLP(filteredTotal)})`
                  : "Click en una categoría para filtrar"}
              </CardDescription>
            </div>
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => setSelectedCategory(null)}
              >
                {selectedCategory} ✕
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 text-sm text-muted-foreground">
              Sin gastos registrados en los últimos 6 meses
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  className="cursor-pointer"
                  onClick={(data) => {
                    if (data && data.name) {
                      setSelectedCategory(
                        selectedCategory === data.name ? null : data.name
                      )
                    }
                  }}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                      stroke={selectedCategory === entry.name ? "#000" : "none"}
                      strokeWidth={selectedCategory === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCLP(v)}
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distribución por Tipo</CardTitle>
              <CardDescription>
                {selectedTipo
                  ? `Filtrado: ${selectedTipo}`
                  : "Click en un tipo para filtrar"}
              </CardDescription>
            </div>
            {selectedTipo && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => setSelectedTipo(null)}
              >
                {selectedTipo} ✕
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataTipoGasto}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="monto"
                className="cursor-pointer"
                onClick={(data) => {
                  if (data && data.tipo) {
                    setSelectedTipo(selectedTipo === data.tipo ? null : data.tipo)
                  }
                }}
              >
                {dataTipoGasto.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS_TIPO[entry.tipo as keyof typeof COLORS_TIPO]}
                    opacity={selectedTipo && selectedTipo !== entry.tipo ? 0.3 : 1}
                    stroke={selectedTipo === entry.tipo ? "#000" : "none"}
                    strokeWidth={selectedTipo === entry.tipo ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCLP(v)}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vista Semanal + Heatmap */}
      <WeeklySpendingCard movimientosMes={movimientosMes} />
      <SpendingHeatmap movimientosMes={movimientosMes} mesActual={mesActual} />
    </motion.div>
  )
}

/** Solo la lista de últimos movimientos (para Suspense granular) - ocultos en modo compacto. */
export function DashboardRecentSection({ 
  initialData,
  isCompact = false,
}: DashboardClientProps & { isCompact?: boolean }) {
  const { movimientosMes, categorias } = initialData
  const ultimosMovimientos = [...movimientosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8)

  // No renderizar en modo compacto
  if (isCompact) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="grid gap-4 md:grid-cols-2"
    >
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Últimos Movimientos</CardTitle>
          <CardDescription>Los 8 movimientos más recientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ultimosMovimientos.map((mov) => {
              const categoria = categorias.find((c) => c.id === mov.categoriaId)
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{mov.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {mov.fecha} • {categoria?.nombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mov.estadoConciliacion === "Conciliado" ? "default" : "secondary"}>
                      {mov.estadoConciliacion}
                    </Badge>
                    <span
                      className={`text-sm font-semibold ${
                        mov.tipoMovimiento === "Ingreso"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {mov.tipoMovimiento === "Ingreso" ? "+" : "-"}
                      {formatCLP(mov.montoCLP)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const { isCompact, setIsCompact, mounted } = useCompactMode(false)

  // Datos secundarios cargados lazy en el cliente (no bloquean SSR)
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null)
  const [dailyTip, setDailyTip] = useState<TipForClient | null>(null)
  const [alerts, setAlerts] = useState<SmartAlertForClient[]>([])

  useEffect(() => {
    // Cargar datos secundarios en paralelo después del render inicial
    const loadSecondaryData = async () => {
      const [stats, tip, alertsData] = await Promise.all([
        getGamificationStats(),
        getDailyTip(),
        getActiveAlerts(),
      ])
      setGamificationStats(stats)
      setDailyTip(tip)
      setAlerts(alertsData)

      // Operaciones de escritura en segundo plano (no bloquean UI)
      updateStreakAction().catch(() => {})
      generateAlertsAction().catch(() => {})
    }
    loadSecondaryData()
  }, [])

  // Evitar hydration mismatch mostrando estado por defecto hasta que monte
  if (!mounted) {
    return (
      <div className="space-y-6">
        <DashboardHeader initialData={initialData} />
        <DashboardKPISection initialData={initialData} isCompact={false} />
        <DashboardChartsSection initialData={initialData} isCompact={false} />
        <DashboardRecentSection initialData={initialData} isCompact={false} />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        initialData={initialData} 
        isCompact={isCompact}
        onToggleCompact={setIsCompact}
      />

      {/* Alertas - cargadas lazy */}
      {alerts.length > 0 && <DashboardAlerts initialAlerts={alerts} />}

      {/* Tip del día */}
      {dailyTip && !isCompact && <DailyTipCard tip={dailyTip} />}

      <DashboardKPISection initialData={initialData} isCompact={isCompact} />

      {/* Gamificación + Tendencias Anuales - Solo en modo expandido */}
      {!isCompact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {gamificationStats && <GamificationCard stats={gamificationStats} />}
          <AnnualTrendsCard monthlyStats={initialData.monthlyStats} />
        </motion.div>
      )}

      <DashboardChartsSection initialData={initialData} isCompact={isCompact} />
      <DashboardRecentSection initialData={initialData} isCompact={isCompact} />
    </div>
  )
}

