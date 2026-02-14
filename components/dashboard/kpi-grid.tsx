"use client"

import { KPICard } from "@/components/kpi-card"
import { formatCLP } from "@/lib/utils-finance"
import { TrendingUp, TrendingDown, Wallet, CreditCard, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface KPIGridProps {
  ahorroNeto: number
  ingresosMes: number
  gastosMes: number
  deudaTotal: number
  progresoMetas: number
  isCompact: boolean
}

export function KPIGrid({
  ahorroNeto,
  ingresosMes,
  gastosMes,
  deudaTotal,
  progresoMetas,
  isCompact,
}: KPIGridProps) {
  // KPIs principales (siempre visibles en modo compacto)
  const mainKPIs = [
    {
      title: "Balance Mes",
      value: formatCLP(ahorroNeto),
      icon: Wallet,
      trend: { value: ahorroNeto >= 0 ? "Positivo" : "Negativo", isPositive: ahorroNeto >= 0 },
    },
    {
      title: "Ingresos Mes",
      value: formatCLP(ingresosMes),
      icon: TrendingUp,
    },
    {
      title: "Gastos Mes",
      value: formatCLP(gastosMes),
      icon: TrendingDown,
    },
  ]

  // KPIs secundarios (solo visibles en modo expandido)
  const secondaryKPIs = [
    {
      title: "Deuda TC Total",
      value: formatCLP(deudaTotal),
      icon: CreditCard,
    },
    {
      title: "Progreso Metas",
      value: `${progresoMetas.toFixed(1)}%`,
      icon: Target,
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs Principales - Siempre visibles */}
      <div className={`grid gap-4 ${isCompact ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {mainKPIs.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* KPIs Secundarios - Solo en modo expandido */}
      <AnimatePresence>
        {!isCompact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {secondaryKPIs.map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <KPICard {...kpi} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
