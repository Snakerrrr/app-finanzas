"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import * as gamificationService from "@/lib/services/gamification.service"

/**
 * Solo lectura - seguro para usar durante render de Server Components.
 */
export async function getGamificationStats() {
  const session = await auth()
  if (!session?.user?.id) return null
  return gamificationService.getGamificationStats(session.user.id)
}

/**
 * Escritura - actualiza streak y logros. Llamar desde el cliente (no durante render).
 */
export async function updateStreakAction() {
  const session = await auth()
  if (!session?.user?.id) return
  await gamificationService.updateStreak(session.user.id)
  await gamificationService.checkAndUnlockAchievements(session.user.id)
}

export async function markAchievementsAsRead() {
  const session = await auth()
  if (!session?.user?.id) return
  await gamificationService.markAchievementsAsRead(session.user.id)
  revalidatePath("/")
}
