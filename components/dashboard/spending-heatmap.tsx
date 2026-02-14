"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCLP } from "@/lib/utils-finance"
import type { MovimientoForClient } from "@/lib/services/finance.service"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SpendingHeatmapProps {
  movimientosMes: MovimientoForClient[]
  mesActual: string // YYYY-MM
}

function getHeatColor(value: number, max: number): string {
  if (value === 0) return "bg-muted/30"
  const ratio = value / max
  if (ratio < 0.25) return "bg-green-200 dark:bg-green-900/40"
  if (ratio < 0.5) return "bg-yellow-200 dark:bg-yellow-900/40"
  if (ratio < 0.75) return "bg-orange-200 dark:bg-orange-900/40"
  return "bg-red-300 dark:bg-red-900/60"
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function SpendingHeatmap({ movimientosMes, mesActual }: SpendingHeatmapProps) {
  const [year, month] = mesActual.split("-").map(Number)
  const diasEnMes = new Date(year, month, 0).getDate()
  const primerDia = new Date(year, month - 1, 1).getDay() // 0=Dom, 1=Lun...
  // Ajustar para que Lunes sea 0
  const offset = primerDia === 0 ? 6 : primerDia - 1

  // Calcular gastos por día
  const gastosPorDia: Record<number, number> = {}
  for (const m of movimientosMes) {
    if (m.tipoMovimiento === "Gasto") {
      const dia = parseInt(m.fecha.split("-")[2])
      gastosPorDia[dia] = (gastosPorDia[dia] || 0) + m.montoCLP
    }
  }

  const maxGasto = Math.max(...Object.values(gastosPorDia), 1)

  // Generar grid del calendario
  const semanas: (number | null)[][] = []
  let semanaActual: (number | null)[] = Array(offset).fill(null)

  for (let dia = 1; dia <= diasEnMes; dia++) {
    semanaActual.push(dia)
    if (semanaActual.length === 7) {
      semanas.push(semanaActual)
      semanaActual = []
    }
  }
  if (semanaActual.length > 0) {
    while (semanaActual.length < 7) semanaActual.push(null)
    semanas.push(semanaActual)
  }

  const hoy = new Date().getDate()
  const esMesActual = new Date().getFullYear() === year && new Date().getMonth() + 1 === month

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calendario de Gastos</CardTitle>
        <CardDescription>
          Intensidad de gasto diario del mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {/* Header días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="text-center text-[10px] font-medium text-muted-foreground">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="space-y-1">
            {semanas.map((semana, sIdx) => (
              <div key={sIdx} className="grid grid-cols-7 gap-1">
                {semana.map((dia, dIdx) => {
                  if (dia === null) {
                    return <div key={dIdx} className="aspect-square" />
                  }

                  const gasto = gastosPorDia[dia] || 0
                  const esHoy = esMesActual && dia === hoy

                  return (
                    <Tooltip key={dIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium cursor-default transition-all
                            ${getHeatColor(gasto, maxGasto)}
                            ${esHoy ? "ring-2 ring-primary ring-offset-1" : ""}
                            ${gasto > 0 ? "hover:scale-110" : ""}
                          `}
                        >
                          {dia}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">Día {dia}</p>
                        {gasto > 0 ? (
                          <p className="text-red-500">{formatCLP(gasto)} en gastos</p>
                        ) : (
                          <p className="text-muted-foreground">Sin gastos</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-0.5">
              <div className="h-3 w-3 rounded-sm bg-muted/30" />
              <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
              <div className="h-3 w-3 rounded-sm bg-yellow-200 dark:bg-yellow-900/40" />
              <div className="h-3 w-3 rounded-sm bg-orange-200 dark:bg-orange-900/40" />
              <div className="h-3 w-3 rounded-sm bg-red-300 dark:bg-red-900/60" />
            </div>
            <span>Más</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
