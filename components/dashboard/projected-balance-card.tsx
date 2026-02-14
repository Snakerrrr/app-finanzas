"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCLP } from "@/lib/utils-finance"
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

interface ProjectedBalanceCardProps {
  balanceActual: number
  balanceProyectado: number
  ingresosPendientes: number
  gastosPendientes: number
  diasRestantes: number
}

export function ProjectedBalanceCard({
  balanceActual,
  balanceProyectado,
  ingresosPendientes,
  gastosPendientes,
  diasRestantes,
}: ProjectedBalanceCardProps) {
  const diferencia = balanceProyectado - balanceActual
  const esPositivo = diferencia >= 0
  const mejoraSituacion = balanceProyectado > balanceActual

  return (
    <Card className="border-l-4" style={{ borderLeftColor: esPositivo ? "#10b981" : "#ef4444" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Proyección a Fin de Mes
            </CardTitle>
            <CardDescription>Balance estimado ({diasRestantes} días restantes)</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Proyección basada en tu balance actual + ingresos esperados - gastos recurrentes pendientes
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Proyectado Principal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Balance Proyectado</p>
            <motion.p
              className="text-3xl font-bold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ color: esPositivo ? "#10b981" : "#ef4444" }}
            >
              {formatCLP(balanceProyectado)}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance Actual</p>
            <p className="text-xl font-semibold">{formatCLP(balanceActual)}</p>
          </div>
        </div>

        {/* Diferencia vs Balance Actual */}
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 p-3">
          {mejoraSituacion ? (
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <span className="text-sm font-medium">
            {mejoraSituacion ? "Mejorará" : "Empeorará"} en{" "}
            <span
              className="font-bold"
              style={{ color: mejoraSituacion ? "#10b981" : "#ef4444" }}
            >
              {formatCLP(Math.abs(diferencia))}
            </span>
          </span>
        </div>

        {/* Desglose */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ingresos Pendientes</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCLP(ingresosPendientes)}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Gastos Pendientes</p>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCLP(gastosPendientes)}
              </p>
            </div>
          </div>
        </div>

        {/* Badge de status */}
        {balanceProyectado < 0 && (
          <Badge variant="destructive" className="w-full justify-center">
            ⚠️ Balance negativo proyectado
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
