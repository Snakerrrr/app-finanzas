import { getDashboardData, getMovimientos } from "@/lib/services/finance.service"
import { cached } from "@/lib/cache"
import type { Intention } from "./router"

/**
 * Paso 2 del Router Agent: ejecuta la lógica de negocio según la intención.
 * Devuelve un string de contexto que se inyecta en el System Prompt del sintetizador.
 */
export async function executeIntent(
  intention: Intention,
  userId: string
): Promise<string> {
  switch (intention.intent) {
    case "BALANCE":
      return await executeBalance(userId)

    case "MOVIMIENTOS":
      return await executeMovimientos(userId, intention.parameters)

    default:
      return "No se requieren datos financieros para esta respuesta."
  }
}

async function executeBalance(userId: string): Promise<string> {
  try {
    // Caché de 30s: si el usuario pregunta 3 veces seguidas, solo 1 query a BD
    const balanceData = await cached(`balance:${userId}`, 30, () =>
      getDashboardData(userId)
    )

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

    console.log("✅ Balance obtenido:", JSON.stringify(resumen))
    return `DATOS DE BALANCE ACTUAL: ${JSON.stringify(resumen, null, 2)}`
  } catch (error) {
    console.error("❌ Error obteniendo balance:", error)
    return "Hubo un error técnico al consultar el balance."
  }
}

async function executeMovimientos(
  userId: string,
  params: Intention["parameters"]
): Promise<string> {
  try {
    const filters = {
      startDate: params.startDate ?? undefined,
      endDate: params.endDate ?? undefined,
    }

    const movimientos = await getMovimientos(userId, filters)

    let resultados = movimientos
    if (params.category != null && params.category !== "") {
      const cat = params.category.toLowerCase()
      resultados = movimientos.filter((m) =>
        JSON.stringify({ desc: m.descripcion, cat: m.categoria?.nombre })
          .toLowerCase()
          .includes(cat)
      )
    }

    const preview = resultados.slice(0, 15).map((m) => ({
      fecha: m.fecha,
      descripcion: m.descripcion,
      tipo: m.tipoMovimiento,
      monto: m.montoCLP,
      categoria: m.categoria?.nombre,
    }))

    console.log(`✅ Movimientos encontrados: ${resultados.length} (mostrando ${preview.length})`)
    return `LISTADO DE MOVIMIENTOS (${resultados.length} total, mostrando ${preview.length}):\n${JSON.stringify(preview, null, 2)}`
  } catch (error) {
    console.error("❌ Error obteniendo movimientos:", error)
    return "Hubo un error técnico al consultar los movimientos."
  }
}
