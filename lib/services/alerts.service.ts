/**
 * Servicio de Alertas Inteligentes (Smart Alerts)
 * Genera alertas basadas en patrones financieros del usuario
 */

import { prisma } from "@/lib/db"

export type SmartAlertForClient = {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  prioridad: string
  accion: string | null
  accionUrl: string | null
  visto: boolean
  descartado: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Generación de alertas
// ---------------------------------------------------------------------------

export async function generateSmartAlerts(userId: string): Promise<void> {
  const now = new Date()
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [presupuestos, movimientosMes, tarjetas, metas] = await Promise.all([
    prisma.presupuesto.findMany({
      where: { userId, mes: mesActual },
      include: { categoria: true },
    }),
    prisma.movimiento.findMany({
      where: { userId, mesConciliacion: mesActual },
    }),
    prisma.tarjetaCredito.findMany({ where: { userId } }),
    prisma.metaAhorro.findMany({ where: { userId, estado: "Activa" } }),
  ])

  const alertsToCreate: {
    tipo: string
    titulo: string
    mensaje: string
    prioridad: string
    accion?: string
    accionUrl?: string
  }[] = []

  // 1. Presupuesto excedido (>100%)
  for (const pres of presupuestos) {
    const gastos = movimientosMes
      .filter((m) => m.categoriaId === pres.categoriaId && m.tipoMovimiento === "Gasto")
      .reduce((sum, m) => sum + m.montoCLP, 0)
    const porcentaje = pres.montoPresupuestadoCLP > 0 ? (gastos / pres.montoPresupuestadoCLP) * 100 : 0

    if (porcentaje > 100) {
      alertsToCreate.push({
        tipo: "BUDGET_EXCEEDED",
        titulo: `Presupuesto excedido: ${pres.categoria.nombre}`,
        mensaje: `Has gastado ${Math.round(porcentaje)}% de tu presupuesto en ${pres.categoria.nombre}. Considera reducir gastos en esta categoría.`,
        prioridad: "alta",
        accion: "Ver presupuestos",
        accionUrl: "/presupuestos",
      })
    } else if (porcentaje > 80) {
      alertsToCreate.push({
        tipo: "BUDGET_WARNING",
        titulo: `Presupuesto en riesgo: ${pres.categoria.nombre}`,
        mensaje: `Llevas ${Math.round(porcentaje)}% de tu presupuesto en ${pres.categoria.nombre}. Quedan ${Math.round(pres.montoPresupuestadoCLP - gastos)} CLP disponibles.`,
        prioridad: "media",
        accion: "Ver detalle",
        accionUrl: "/presupuestos",
      })
    }
  }

  // 2. Deuda de tarjeta alta (>70% del cupo)
  for (const tc of tarjetas) {
    const usoPorcentaje = tc.cupoTotal > 0 ? (tc.deudaActual / tc.cupoTotal) * 100 : 0
    if (usoPorcentaje > 70) {
      alertsToCreate.push({
        tipo: "HIGH_DEBT",
        titulo: `Deuda alta: ${tc.nombre}`,
        mensaje: `Tu tarjeta ${tc.nombre} tiene un uso del ${Math.round(usoPorcentaje)}% del cupo. Considera hacer un abono.`,
        prioridad: usoPorcentaje > 90 ? "alta" : "media",
        accion: "Ver tarjetas",
        accionUrl: "/tarjetas",
      })
    }
  }

  // 3. Meta alcanzada
  for (const meta of metas) {
    if (meta.acumuladoCLP >= meta.objetivoCLP) {
      alertsToCreate.push({
        tipo: "GOAL_ACHIEVED",
        titulo: `¡Meta alcanzada: ${meta.nombre}!`,
        mensaje: `Felicidades, has alcanzado tu meta de ahorro "${meta.nombre}". ¡Sigue así!`,
        prioridad: "baja",
        accion: "Ver metas",
        accionUrl: "/metas",
      })
    }
  }

  // 4. Patrón de gasto alto en fin de semana
  const gastosFinSemana = movimientosMes.filter((m) => {
    const dia = new Date(m.fecha).getDay()
    return m.tipoMovimiento === "Gasto" && (dia === 0 || dia === 6)
  })
  const gastosEntreSemana = movimientosMes.filter((m) => {
    const dia = new Date(m.fecha).getDay()
    return m.tipoMovimiento === "Gasto" && dia >= 1 && dia <= 5
  })

  const promedioFinSemana = gastosFinSemana.length > 0
    ? gastosFinSemana.reduce((s, m) => s + m.montoCLP, 0) / gastosFinSemana.length
    : 0
  const promedioEntreSemana = gastosEntreSemana.length > 0
    ? gastosEntreSemana.reduce((s, m) => s + m.montoCLP, 0) / gastosEntreSemana.length
    : 0

  if (promedioFinSemana > promedioEntreSemana * 1.5 && gastosFinSemana.length >= 3) {
    alertsToCreate.push({
      tipo: "PATTERN_DETECTED",
      titulo: "Patrón detectado: Gastos de fin de semana",
      mensaje: `Tus gastos de fin de semana son un 50% más altos que entre semana. Considera establecer un presupuesto específico.`,
      prioridad: "baja",
      accion: "Ver movimientos",
      accionUrl: "/movimientos",
    })
  }

  // Evitar duplicados: solo crear alertas que no existan ya (mismo tipo, mismo mes)
  const existingAlerts = await prisma.smartAlert.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    },
    select: { tipo: true, titulo: true },
  })

  const existingKeys = new Set(existingAlerts.map((a) => `${a.tipo}:${a.titulo}`))

  const newAlerts = alertsToCreate.filter(
    (a) => !existingKeys.has(`${a.tipo}:${a.titulo}`)
  )

  if (newAlerts.length > 0) {
    await prisma.smartAlert.createMany({
      data: newAlerts.map((a) => ({
        ...a,
        userId,
        accion: a.accion ?? null,
        accionUrl: a.accionUrl ?? null,
      })),
    })
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getActiveAlerts(userId: string): Promise<SmartAlertForClient[]> {
  // NO generar alertas aquí - se hace de forma lazy en segundo plano
  const alerts = await prisma.smartAlert.findMany({
    where: { userId, descartado: false },
    orderBy: [{ visto: "asc" }, { createdAt: "desc" }],
    take: 10,
  })

  return alerts.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    mensaje: a.mensaje,
    prioridad: a.prioridad,
    accion: a.accion,
    accionUrl: a.accionUrl,
    visto: a.visto,
    descartado: a.descartado,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function markAlertAsRead(userId: string, alertId: string): Promise<void> {
  await prisma.smartAlert.updateMany({
    where: { id: alertId, userId },
    data: { visto: true },
  })
}

export async function dismissAlert(userId: string, alertId: string): Promise<void> {
  await prisma.smartAlert.updateMany({
    where: { id: alertId, userId },
    data: { descartado: true },
  })
}
