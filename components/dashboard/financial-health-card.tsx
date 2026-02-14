"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  calculateFinancialHealthScore,
  getFinancialHealthRecommendations,
  type FinancialHealthInput,
  type FinancialHealthResult,
} from "@/lib/utils/financial-health"
import { Activity, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface FinancialHealthCardProps {
  data: FinancialHealthInput
  showDetails?: boolean
}

export function FinancialHealthCard({ data, showDetails = false }: FinancialHealthCardProps) {
  const result = calculateFinancialHealthScore(data)
  const recommendations = getFinancialHealthRecommendations(result)

  return (
    <Card className="border-2" style={{ borderColor: result.color + "40" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: result.color }} />
              Salud Financiera
            </CardTitle>
            <CardDescription>Tu score financiero general</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  El score se calcula en base a: Balance mensual (25%), Presupuestos (25%), Ahorro (25%) y Deuda (25%)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score principal con animación */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Círculo de progreso */}
            <svg className="h-32 w-32 -rotate-90 transform">
              {/* Background */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress */}
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke={result.color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - result.score / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            {/* Score número */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                className="text-3xl font-bold"
                style={{ color: result.color }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {result.score}
              </motion.p>
              <p className="text-xs text-muted-foreground">de 100</p>
            </div>
          </div>
        </div>

        {/* Mensaje y nivel */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {result.nivel === "excelente" || result.nivel === "bueno" ? (
              <CheckCircle2 className="h-5 w-5" style={{ color: result.color }} />
            ) : (
              <AlertCircle className="h-5 w-5" style={{ color: result.color }} />
            )}
            <p className="font-medium" style={{ color: result.color }}>
              {result.nivel.charAt(0).toUpperCase() + result.nivel.slice(1)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{result.mensaje}</p>
        </div>

        {/* Desglose de factores (solo si showDetails) */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="space-y-3 border-t pt-4"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desglose</p>

            {Object.entries(result.desglose).map(([key, value]) => {
              const labels: Record<string, string> = {
                balance: "Balance",
                presupuesto: "Presupuesto",
                ahorro: "Ahorro",
                deuda: "Deuda",
              }

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{labels[key]}</span>
                    <span className="font-medium">{value.score}/100</span>
                  </div>
                  <Progress value={value.score} className="h-2" />
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Recomendación principal */}
        {recommendations.length > 0 && (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: result.color }} />
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium">Sugerencia:</p>
                <p className="text-xs text-muted-foreground">{recommendations[0]}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
