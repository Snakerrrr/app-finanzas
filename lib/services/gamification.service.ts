/**
 * Servicio de Gamificación
 * Streaks, logros y niveles del usuario
 */

import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AchievementForClient = {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  icono: string
  desbloqueadoEn: string
  visto: boolean
}

export type GamificationStats = {
  currentStreak: number
  longestStreak: number
  totalAhorrado: number
  nivelGamificacion: string
  achievements: AchievementForClient[]
  unreadCount: number
}

// Definiciones de logros posibles
const ACHIEVEMENT_DEFINITIONS = [
  { tipo: "FIRST_TRANSACTION", titulo: "Primera Transacción", descripcion: "Registraste tu primer movimiento", icono: "🎯" },
  { tipo: "STREAK_7", titulo: "Racha de 7 días", descripcion: "7 días consecutivos registrando", icono: "🔥" },
  { tipo: "STREAK_30", titulo: "Racha de 30 días", descripcion: "30 días consecutivos registrando", icono: "⚡" },
  { tipo: "BUDGET_MET", titulo: "Presupuesto Cumplido", descripcion: "Cumpliste todos tus presupuestos del mes", icono: "✅" },
  { tipo: "GOAL_REACHED", titulo: "Meta Alcanzada", descripcion: "Alcanzaste una meta de ahorro", icono: "🏆" },
  { tipo: "LEVEL_SILVER", titulo: "Nivel Plata", descripcion: "Alcanzaste el nivel Plata", icono: "🥈" },
  { tipo: "LEVEL_GOLD", titulo: "Nivel Oro", descripcion: "Alcanzaste el nivel Oro", icono: "🥇" },
  { tipo: "LEVEL_PLATINUM", titulo: "Nivel Platino", descripcion: "Alcanzaste el nivel Platino", icono: "💎" },
  { tipo: "SAVER_10K", titulo: "Ahorrador 10K", descripcion: "Ahorraste más de $10.000", icono: "💰" },
  { tipo: "SAVER_100K", titulo: "Ahorrador 100K", descripcion: "Ahorraste más de $100.000", icono: "💵" },
  { tipo: "SAVER_1M", titulo: "Millonario del Ahorro", descripcion: "Ahorraste más de $1.000.000", icono: "🤑" },
]

// ---------------------------------------------------------------------------
// Lógica de Streaks
// ---------------------------------------------------------------------------

export async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
  })
  if (!user) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null
  if (lastActivity) lastActivity.setHours(0, 0, 0, 0)

  // Si ya registró hoy, no hacer nada
  if (lastActivity && lastActivity.getTime() === today.getTime()) return

  let newStreak = 1
  if (lastActivity) {
    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      // Día consecutivo
      newStreak = user.currentStreak + 1
    }
    // Si diffDays > 1, se reinicia a 1
  }

  const newLongest = Math.max(user.longestStreak, newStreak)

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
    },
  })

  // Verificar logros de streak
  if (newStreak >= 7) await unlockAchievement(userId, "STREAK_7")
  if (newStreak >= 30) await unlockAchievement(userId, "STREAK_30")
}

// ---------------------------------------------------------------------------
// Lógica de Niveles
// ---------------------------------------------------------------------------

function calculateLevel(totalAhorrado: number, longestStreak: number): string {
  const score = totalAhorrado / 10000 + longestStreak * 2
  if (score >= 200) return "Platino"
  if (score >= 100) return "Oro"
  if (score >= 30) return "Plata"
  return "Bronce"
}

export async function updateLevel(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalAhorrado: true, longestStreak: true, nivelGamificacion: true },
  })
  if (!user) return

  const newLevel = calculateLevel(user.totalAhorrado, user.longestStreak)

  if (newLevel !== user.nivelGamificacion) {
    await prisma.user.update({
      where: { id: userId },
      data: { nivelGamificacion: newLevel },
    })

    if (newLevel === "Plata") await unlockAchievement(userId, "LEVEL_SILVER")
    if (newLevel === "Oro") await unlockAchievement(userId, "LEVEL_GOLD")
    if (newLevel === "Platino") await unlockAchievement(userId, "LEVEL_PLATINUM")
  }
}

// ---------------------------------------------------------------------------
// Logros
// ---------------------------------------------------------------------------

async function unlockAchievement(userId: string, tipo: string): Promise<void> {
  // Verificar si ya lo tiene
  const existing = await prisma.achievement.findFirst({
    where: { userId, tipo },
  })
  if (existing) return

  const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.tipo === tipo)
  if (!def) return

  await prisma.achievement.create({
    data: {
      tipo: def.tipo,
      titulo: def.titulo,
      descripcion: def.descripcion,
      icono: def.icono,
      userId,
    },
  })
}

export async function checkAndUnlockAchievements(userId: string): Promise<void> {
  // Verificar primera transacción
  const movCount = await prisma.movimiento.count({ where: { userId } })
  if (movCount >= 1) await unlockAchievement(userId, "FIRST_TRANSACTION")

  // Verificar ahorro
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalAhorrado: true },
  })
  if (user) {
    if (user.totalAhorrado >= 10000) await unlockAchievement(userId, "SAVER_10K")
    if (user.totalAhorrado >= 100000) await unlockAchievement(userId, "SAVER_100K")
    if (user.totalAhorrado >= 1000000) await unlockAchievement(userId, "SAVER_1M")
  }

  // Verificar metas alcanzadas
  const metasCompletadas = await prisma.metaAhorro.count({
    where: { userId, estado: "Completada" },
  })
  if (metasCompletadas >= 1) await unlockAchievement(userId, "GOAL_REACHED")

  await updateLevel(userId)
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export async function getGamificationStats(userId: string): Promise<GamificationStats> {
  const [user, achievements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        totalAhorrado: true,
        nivelGamificacion: true,
      },
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { desbloqueadoEn: "desc" },
    }),
  ])

  const unreadCount = achievements.filter((a) => !a.visto).length

  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    totalAhorrado: user?.totalAhorrado ?? 0,
    nivelGamificacion: user?.nivelGamificacion ?? "Bronce",
    achievements: achievements.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      titulo: a.titulo,
      descripcion: a.descripcion,
      icono: a.icono,
      desbloqueadoEn: a.desbloqueadoEn.toISOString(),
      visto: a.visto,
    })),
    unreadCount,
  }
}

export async function markAchievementsAsRead(userId: string): Promise<void> {
  await prisma.achievement.updateMany({
    where: { userId, visto: false },
    data: { visto: true },
  })
}
