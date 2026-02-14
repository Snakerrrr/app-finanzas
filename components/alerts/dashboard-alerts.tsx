"use client"

import { useEffect, useState, useTransition } from "react"
import { SmartAlertsStack } from "./smart-alerts-stack"
import type { SmartAlertForClient } from "@/lib/services/alerts.service"
import { markAlertAsRead, dismissAlert } from "@/app/actions/alerts"

interface DashboardAlertsProps {
  initialAlerts: SmartAlertForClient[]
}

export function DashboardAlerts({ initialAlerts }: DashboardAlertsProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [isPending, startTransition] = useTransition()

  // Sincronizar cuando initialAlerts cambia (carga lazy)
  useEffect(() => {
    setAlerts(initialAlerts)
  }, [initialAlerts])

  const handleDismiss = (id: string) => {
    // Optimistic update
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    startTransition(async () => {
      await dismissAlert(id)
    })
  }

  const handleMarkRead = (id: string) => {
    // Optimistic update
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, visto: true } : a)))
    startTransition(async () => {
      await markAlertAsRead(id)
    })
  }

  return (
    <SmartAlertsStack
      alerts={alerts}
      onDismiss={handleDismiss}
      onMarkRead={handleMarkRead}
    />
  )
}
