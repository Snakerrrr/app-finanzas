"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCLP } from "@/lib/utils-finance"
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { MonthlyStat } from "@/lib/services/finance.service"

interface AnnualTrendsCardProps {
  monthlyStats: MonthlyStat[]
}

export function AnnualTrendsCard({ monthlyStats }: AnnualTrendsCardProps) {
  // Calcular tendencias
  const totalIngresos = monthlyStats.reduce((s, m) => s + m.ingresos, 0)
  const totalGastos = monthlyStats.reduce((s, m) => s + m.gastos, 0)
  const promedioIngresos = monthlyStats.length > 0 ? totalIngresos / monthlyStats.length : 0
  const promedioGastos = monthlyStats.length > 0 ? totalGastos / monthlyStats.length : 0

  // Calcular tendencia (comparar primera mitad vs segunda mitad)
  const mitad = Math.floor(monthlyStats.length / 2)
  const primeraGastos = monthlyStats.slice(0, mitad).reduce((s, m) => s + m.gastos, 0) / (mitad || 1)
  const segundaGastos = monthlyStats.slice(mitad).reduce((s, m) => s + m.gastos, 0) / (monthlyStats.length - mitad || 1)
  const tendenciaGastos = primeraGastos > 0 ? ((segundaGastos - primeraGastos) / primeraGastos) * 100 : 0

  // Datos con balance acumulado
  const dataConBalance = monthlyStats.map((m) => ({
    ...m,
    balance: m.ingresos - m.gastos,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencias (6 meses)
            </CardTitle>
            <CardDescription>Evolución de ingresos, gastos y balance</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gráfico de área */}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dataConBalance}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => formatCLP(v)}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              name="Gastos"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Resumen de tendencias */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Prom. Ingresos</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatCLP(promedioIngresos)}
            </p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Prom. Gastos</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {formatCLP(promedioGastos)}
            </p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Tendencia Gastos</p>
            <div className="flex items-center justify-center gap-1">
              {tendenciaGastos > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <p className={`text-sm font-bold ${tendenciaGastos > 0 ? "text-red-500" : "text-green-500"}`}>
                {tendenciaGastos > 0 ? "+" : ""}{tendenciaGastos.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
