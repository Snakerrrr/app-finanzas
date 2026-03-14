import { getDashboardData, getMovimientos } from "@/lib/services/finance.service"
import { logger, logChatEvent } from "@/lib/logger"
import type { ClassifiedIntent } from "@/lib/types/chat"

export type ExecutorResult = {
  systemContext: string
}

export async function executeIntent(
  userId: string,
  intention: ClassifiedIntent
): Promise<ExecutorResult> {
  switch (intention.intent) {
    case "BALANCE":
      return executeBalance(userId)

    case "MOVIMIENTOS":
      return executeMovimientos(userId, intention)

    default:
      logChatEvent("executor", {
        userId,
        intent: intention.intent,
        success: true,
        note: "No requiere consulta a BD",
      })
      return { systemContext: "No se requieren datos financieros para esta respuesta." }
  }
}

async function executeBalance(userId: string): Promise<ExecutorResult> {
  try {
    const balanceData = await getDashboardData(userId)
    const ingresosMes = balanceData.movimientosMes
      .filter((m) => m.tipoMovimiento === "Ingreso")
      .reduce((s, m) => s + m.montoCLP, 0)
    const gastosMes = balanceData.movimientosMes
      .filter((m) => m.tipoMovimiento === "Gasto")
      .reduce((s, m) => s + m.montoCLP, 0)
    const resumen = {
      balanceTotal: balanceData.balanceTotal,
      ingresosDelMes: ingresosMes,
      gastosDelMes: gastosMes,
      cantidadMovimientosMes: balanceData.movimientosMes.length,
    }
    logChatEvent("executor", {
      userId,
      intent: "BALANCE",
      success: true,
      dataSize: JSON.stringify(resumen).length,
    })
    return { systemContext: `DATOS DE BALANCE ACTUAL: ${JSON.stringify(resumen, null, 2)}` }
  } catch (error) {
    logger.error({ userId, error, intent: "BALANCE" }, "Error en executor")
    logChatEvent("error", {
      userId,
      intent: "BALANCE",
      error: error instanceof Error ? error.message : String(error),
    })
    return { systemContext: "Hubo un error técnico al consultar el balance." }
  }
}

async function executeMovimientos(
  userId: string,
  intention: ClassifiedIntent
): Promise<ExecutorResult> {
  try {
    const filters = {
      startDate: intention.parameters.startDate ?? undefined,
      endDate: intention.parameters.endDate ?? undefined,
    }

    const movimientos = await getMovimientos(userId, filters)

    let resultados = movimientos
    if (intention.parameters.category != null && intention.parameters.category !== "") {
      const cat = intention.parameters.category.toLowerCase()
      resultados = movimientos.filter((m) =>
        JSON.stringify({ desc: m.descripcion, cat: m.categoria?.nombre }).toLowerCase().includes(cat)
      )
    }

    const preview = resultados.slice(0, 10).map((m) => ({
      fecha: m.fecha,
      descripcion: m.descripcion,
      tipo: m.tipoMovimiento,
      monto: m.montoCLP,
      categoria: m.categoria?.nombre,
    }))

    logChatEvent("executor", {
      userId,
      intent: "MOVIMIENTOS",
      success: true,
      total: resultados.length,
      shown: preview.length,
      filters,
    })

    return {
      systemContext: `LISTADO DE MOVIMIENTOS (${preview.length} mostrados):\n${JSON.stringify(preview, null, 2)}`,
    }
  } catch (error) {
    logger.error({ userId, error, intent: "MOVIMIENTOS" }, "Error en executor")
    logChatEvent("error", {
      userId,
      intent: "MOVIMIENTOS",
      error: error instanceof Error ? error.message : String(error),
    })
    return { systemContext: "Hubo un error técnico al consultar los movimientos." }
  }
}
