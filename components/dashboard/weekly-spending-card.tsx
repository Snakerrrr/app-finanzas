"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCLP } from "@/lib/utils-finance"
import type { MovimientoForClient } from "@/lib/services/finance.service"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface WeeklySpendingCardProps {
  movimientosMes: MovimientoForClient[]
}

function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr)
  const dayOfMonth = date.getDate()
  return Math.ceil(dayOfMonth / 7)
}

function getWeekRange(weekNum: number, year: number, month: number): string {
  const start = (weekNum - 1) * 7 + 1
  const lastDay = new Date(year, month, 0).getDate()
  const end = Math.min(weekNum * 7, lastDay)
  return `${start}-${end}`
}

export function WeeklySpendingCard({ movimientosMes }: WeeklySpendingCardProps) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Agrupar gastos por semana
  const weeklyData: { semana: string; gastos: number; ingresos: number; weekNum: number }[] = []

  for (let w = 1; w <= 5; w++) {
    const range = getWeekRange(w, year, month)
    const gastos = movimientosMes
      .filter((m) => m.tipoMovimiento === "Gasto" && getWeekNumber(m.fecha) === w)
      .reduce((sum, m) => sum + m.montoCLP, 0)
    const ingresos = movimientosMes
      .filter((m) => m.tipoMovimiento === "Ingreso" && getWeekNumber(m.fecha) === w)
      .reduce((sum, m) => sum + m.montoCLP, 0)

    if (gastos > 0 || ingresos > 0) {
      weeklyData.push({
        semana: `Sem ${w}\n(${range})`,
        gastos,
        ingresos,
        weekNum: w,
      })
    }
  }

  const currentWeek = getWeekNumber(now.toISOString().slice(0, 10))
  const promedioSemanal = weeklyData.length > 0
    ? weeklyData.reduce((s, w) => s + w.gastos, 0) / weeklyData.length
    : 0

  const semanaActualGastos = weeklyData.find((w) => w.weekNum === currentWeek)?.gastos ?? 0
  const vsPromedio = promedioSemanal > 0
    ? ((semanaActualGastos - promedioSemanal) / promedioSemanal) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vista Semanal</CardTitle>
        <CardDescription>
          Promedio semanal: {formatCLP(promedioSemanal)}
          {vsPromedio !== 0 && (
            <span className={vsPromedio > 0 ? " text-red-500" : " text-green-500"}>
              {" "}({vsPromedio > 0 ? "+" : ""}{vsPromedio.toFixed(0)}% esta semana)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weeklyData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Sin datos esta semana
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="semana" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCLP(v)}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Bar
                dataKey="ingresos"
                name="Ingresos"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
