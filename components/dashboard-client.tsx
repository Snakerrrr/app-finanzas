"use client"

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

/** Encabezado del dashboard (título + mes). */
export function DashboardHeader({ initialData }: DashboardClientProps) {
  const mesActual = getCurrentMonth()
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">{getMonthName(mesActual)}</p>
    </div>
  )
}

/** Solo la fila de KPIs (para Suspense granular). */
export function DashboardKPISection({ initialData }: DashboardClientProps) {
  const { movimientosMes, tarjetasCredito, metasAhorro } = initialData
  const ingresosMes = calculateIngresosMes(movimientosMes)
  const gastosMes = calculateGastosMes(movimientosMes)
  const ahorroNeto = ingresosMes - gastosMes
  const deudaTotal = tarjetasCredito.reduce((sum, tc) => sum + tc.deudaActual, 0)
  const progresoMetas =
    metasAhorro.length > 0
      ? metasAhorro.reduce((sum, meta) => sum + (meta.acumuladoCLP / meta.objetivoCLP) * 100, 0) / metasAhorro.length
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <KPICard
        title="Balance Mes"
        value={formatCLP(ahorroNeto)}
        icon={Wallet}
        trend={{ value: ahorroNeto >= 0 ? "Positivo" : "Negativo", isPositive: ahorroNeto >= 0 }}
      />
      <KPICard title="Ingresos Mes" value={formatCLP(ingresosMes)} icon={TrendingUp} />
      <KPICard title="Gastos Mes" value={formatCLP(gastosMes)} icon={TrendingDown} />
      <KPICard title="Deuda TC Total" value={formatCLP(deudaTotal)} icon={CreditCard} />
      <KPICard title="Progreso Metas" value={`${progresoMetas.toFixed(1)}%`} icon={Target} />
    </div>
  )
}

/** Solo los gráficos (Flujo, Ingresos vs Gastos, Gastos por Categoría, Tipo) para Suspense granular. */
export function DashboardChartsSection({ initialData }: DashboardClientProps) {
  const { movimientosMes, categorias, monthlyStats, categoryStats } = initialData
  const mesActual = getCurrentMonth()
  const dailyFlow = getDailyFlow(movimientosMes, mesActual)
  const gastosPorTipo = calculateGastosByTipo(movimientosMes)
  const dataTipoGasto = Object.entries(gastosPorTipo).map(([tipo, monto]) => ({ tipo, monto }))
  const COLORS_TIPO = { Fijo: "#ef4444", Variable: "#f59e0b", Ocasional: "#8b5cf6" }

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>Últimos 6 meses (datos del servidor)</CardDescription>
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
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          <CardTitle>Distribución por Tipo</CardTitle>
          <CardDescription>Fijo, Variable, Ocasional (mes actual)</CardDescription>
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
              >
                {dataTipoGasto.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_TIPO[entry.tipo as keyof typeof COLORS_TIPO]} />
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
    </div>
  )
}

/** Solo la lista de últimos movimientos (para Suspense granular). */
export function DashboardRecentSection({ initialData }: DashboardClientProps) {
  const { movimientosMes, categorias } = initialData
  const ultimosMovimientos = [...movimientosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8)

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  )
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader initialData={initialData} />
      <DashboardKPISection initialData={initialData} />
      <DashboardChartsSection initialData={initialData} />
      <DashboardRecentSection initialData={initialData} />
    </div>
  )
}
