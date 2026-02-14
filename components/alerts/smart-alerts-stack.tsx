"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, AlertTriangle, AlertCircle, Info, Trophy, TrendingUp, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { SmartAlertForClient } from "@/lib/services/alerts.service"
import Link from "next/link"

interface SmartAlertsStackProps {
  alerts: SmartAlertForClient[]
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
}

const ALERT_ICONS: Record<string, React.ReactNode> = {
  BUDGET_EXCEEDED: <AlertTriangle className="h-5 w-5 text-red-500" />,
  BUDGET_WARNING: <AlertCircle className="h-5 w-5 text-amber-500" />,
  HIGH_DEBT: <AlertTriangle className="h-5 w-5 text-red-500" />,
  GOAL_ACHIEVED: <Trophy className="h-5 w-5 text-green-500" />,
  PATTERN_DETECTED: <TrendingUp className="h-5 w-5 text-blue-500" />,
  RECONCILE_REMINDER: <Info className="h-5 w-5 text-blue-500" />,
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/20",
  media: "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20",
  baja: "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20",
}

export function SmartAlertsStack({ alerts, onDismiss, onMarkRead }: SmartAlertsStackProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleAlerts = showAll ? alerts : alerts.slice(0, 3)
  const hiddenCount = alerts.length - 3

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Alertas ({alerts.filter((a) => !a.visto).length} nuevas)
        </h3>
        {alerts.length > 3 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Ver menos" : `Ver todas (${alerts.length})`}
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card className={`border-l-4 ${PRIORITY_COLORS[alert.prioridad] ?? ""} ${!alert.visto ? "ring-1 ring-primary/20" : "opacity-80"}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {ALERT_ICONS[alert.tipo] ?? <Info className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{alert.titulo}</p>
                      {!alert.visto && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{alert.mensaje}</p>

                    {alert.accion && alert.accionUrl && (
                      <Link href={alert.accionUrl}>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => onMarkRead(alert.id)}
                        >
                          {alert.accion} →
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!alert.visto && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onMarkRead(alert.id)}
                        title="Marcar como leída"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDismiss(alert.id)}
                      title="Descartar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
