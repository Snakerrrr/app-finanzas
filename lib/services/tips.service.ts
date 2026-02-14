/**
 * Servicio de Consejos Financieros (Tips Diarios)
 * Obtiene un tip aleatorio del día basado en la categoría
 */

import { prisma } from "@/lib/db"

export type TipForClient = {
  id: string
  categoria: string
  titulo: string
  contenido: string
  prioridad: number
}

/**
 * Obtiene el tip del día (determinístico por fecha para que sea el mismo todo el día)
 */
export async function getDailyTip(): Promise<TipForClient | null> {
  const tips = await prisma.financialTip.findMany({
    where: { activo: true },
    orderBy: { prioridad: "desc" },
  })

  if (tips.length === 0) return null

  // Usar la fecha como seed para seleccionar un tip consistente durante el día
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  const index = dayOfYear % tips.length

  const tip = tips[index]
  return {
    id: tip.id,
    categoria: tip.categoria,
    titulo: tip.titulo,
    contenido: tip.contenido,
    prioridad: tip.prioridad,
  }
}

/**
 * Obtiene varios tips aleatorios
 */
export async function getRandomTips(count: number = 3): Promise<TipForClient[]> {
  const tips = await prisma.financialTip.findMany({
    where: { activo: true },
    orderBy: { prioridad: "desc" },
    take: count * 3, // Traer más para poder randomizar
  })

  // Shuffle y tomar los primeros N
  const shuffled = tips.sort(() => Math.random() - 0.5).slice(0, count)

  return shuffled.map((t) => ({
    id: t.id,
    categoria: t.categoria,
    titulo: t.titulo,
    contenido: t.contenido,
    prioridad: t.prioridad,
  }))
}
