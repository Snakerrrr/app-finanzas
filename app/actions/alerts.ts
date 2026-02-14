"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import * as alertsService from "@/lib/services/alerts.service"

export type { SmartAlertForClient } from "@/lib/services/alerts.service"

/**
 * Solo lectura - seguro para render de Server Components.
 */
export async function getActiveAlerts() {
  const session = await auth()
  if (!session?.user?.id) return []
  return alertsService.getActiveAlerts(session.user.id)
}

/**
 * Escritura - genera nuevas alertas. Llamar desde el cliente en segundo plano.
 */
export async function generateAlertsAction() {
  const session = await auth()
  if (!session?.user?.id) return
  await alertsService.generateSmartAlerts(session.user.id)
}

export async function markAlertAsRead(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return
  await alertsService.markAlertAsRead(session.user.id, alertId)
  revalidatePath("/")
}

export async function dismissAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return
  await alertsService.dismissAlert(session.user.id, alertId)
  revalidatePath("/")
}
