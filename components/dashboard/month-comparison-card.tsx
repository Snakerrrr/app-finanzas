"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCLP, getMonthName } from "@/lib/utils-finance"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

interface MonthComparisonData {
  mesActual: string // YYYY-MM
  mesAnterior: string // YYYY-MM
  ingresosActual: number
  ingresosAnterior: number
  gastosActual: number
  gastosAnterior: number
  balanceActual: number
  balanceAnterior: number
}

interface ComparisonMetric {
  label: string
  actual: number
  anterior: number
  cambio: number
  cambioPorcentaje: number
  esMejor: boolean
}

export function MonthComparisonCard({ data }: { data: MonthComparisonData }) {
  const calcularComparacion = (actual: number, anterior: number, invertido = false): ComparisonMetric["esMejor"] => {
    if (invertido) {
      // Para gastos, menos es mejor
      return actual < anterior
    }
    // Para ingresos y balance, más es mejor
    return actual > anterior
  }

  const calcularCambio = (actual: number, anterior: number) => {
    const cambio = actual - anterior
    const cambioPorcentaje = anterior !== 0 ? (cambio / Math.abs(anterior)) * 100 : 0
    return { cambio, cambioPorcentaje }
  }

  const ingresos: ComparisonMetric = {
    label: "Ingresos",
    actual: data.ingresosActual,
    anterior: data.ingresosAnterior,
    ...calcularCambio(data.ingresosActual, data.ingresosAnterior),
    esMejor: calcularComparacion(data.ingresosActual, data.ingresosAnterior),
  }

  const gastos: ComparisonMetric = {
    label: "Gastos",
    actual: data.gastosActual,
    anterior: data.gastosAnterior,
    ...calcularCambio(data.gastosActual, data.gastosAnterior),
    esMejor: calcularComparacion(data.gastosActual, data.gastosAnterior, true),
  }

  const balance: ComparisonMetric = {
    label: "Balance",
    actual: data.balanceActual,
    anterior: data.balanceAnterior,
    ...calcularCambio(data.balanceActual, data.balanceAnterior),
    esMejor: calcularComparacion(data.balanceActual, data.balanceAnterior),
  }

  const metricas = [ingresos, gastos, balance]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación Mensual</CardTitle>
        <CardDescription>
          {getMonthName(data.mesActual)} vs {getMonthName(data.mesAnterior)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metricas.map((metrica, index) => (
          <motion.div
            key={metrica.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{metrica.label}</p>
              <div className="flex items-center gap-2">
                {metrica.esMejor ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    metrica.esMejor
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {metrica.cambio >= 0 ? "+" : ""}
                  {metrica.cambioPorcentaje.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{formatCLP(metrica.anterior)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{formatCLP(metrica.actual)}</span>
            </div>

            <div className="text-xs text-muted-foreground text-right">
              {metrica.cambio >= 0 ? "+" : ""}
              {formatCLP(metrica.cambio)}
            </div>

            {index < metricas.length - 1 && <div className="border-t pt-2" />}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
