"use client"

import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import {
  formatCLP,
  getCurrentMonth,
  filterMovimientosByMonth,
  calculateIngresosMes,
  calculateGastosMes,
  calculateGastosByCategoria,
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

export default function DashboardPage() {
  const { movimientos, categorias, presupuestos, tarjetasCredito, metasAhorro } = useData()

  const mesActual = getCurrentMonth()
  const movimientosMes = filterMovimientosByMonth(movimientos, mesActual)

  const ingresosMes = calculateIngresosMes(movimientosMes)
  const gastosMes = calculateGastosMes(movimientosMes)
  const ahorroNeto = ingresosMes - gastosMes

  // Deuda TC total
  const deudaTotal = tarjetasCredito.reduce((sum, tc) => sum + tc.deudaActual, 0)

  // Progreso metas
  const progresoMetas =
    metasAhorro.length > 0
      ? metasAhorro.reduce((sum, meta) => {
          return sum + (meta.acumuladoCLP / meta.objetivoCLP) * 100
        }, 0) / metasAhorro.length
      : 0

  // Datos para gráficos
  const dailyFlow = getDailyFlow(movimientos, mesActual)
  const gastosPorCategoria = calculateGastosByCategoria(movimientosMes)
  const gastosPorTipo = calculateGastosByTipo(movimientosMes)

  // Top 6 categorías + Otros
  const categoriasConGasto = Object.entries(gastosPorCategoria)
    .map(([categoriaId, monto]) => ({
      categoria: categorias.find((c) => c.id === categoriaId)?.nombre || "Desconocido",
      monto,
      color: categorias.find((c) => c.id === categoriaId)?.color || "#64748b",
    }))
    .sort((a, b) => b.monto - a.monto)

  const top6Categorias = categoriasConGasto.slice(0, 6)
  const otrosMonto = categoriasConGasto.slice(6).reduce((sum, c) => sum + c.monto, 0)

  const dataCategorias = [
    ...top6Categorias,
    ...(otrosMonto > 0 ? [{ categoria: "Otros", monto: otrosMonto, color: "#94a3b8" }] : []),
  ]

  // Datos tipo de gasto
  const dataTipoGasto = Object.entries(gastosPorTipo).map(([tipo, monto]) => ({
    tipo,
    monto,
  }))

  const COLORS_TIPO = {
    Fijo: "#ef4444",
    Variable: "#f59e0b",
    Ocasional: "#8b5cf6",
  }

  // Últimos movimientos
  const ultimosMovimientos = [...movimientosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{getMonthName(mesActual)}</p>
      </div>

      {/* KPIs */}
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

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Flujo diario */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo Diario</CardTitle>
            <CardDescription>Ingresos vs Gastos del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyFlow}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="fecha" className="text-xs" tickFormatter={(value) => value.split("-")[2]} />
                <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCLP(value)}
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

        {/* Gastos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Top 6 + Otros</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCategorias}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="categoria" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCLP(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="monto" name="Monto">
                  {dataCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por tipo de gasto */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
            <CardDescription>Fijo, Variable, Ocasional</CardDescription>
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
                  formatter={(value: number) => formatCLP(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Últimos movimientos */}
        <Card>
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
    </div>
  )
}
