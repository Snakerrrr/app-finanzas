/**
 * Utilidades para calcular la salud financiera del usuario
 * Score de 0-100 basado en múltiples factores
 */

export interface FinancialHealthInput {
  ingresosMes: number
  gastosMes: number
  ahorroNeto: number
  deudaTotal: number
  presupuestosCumplidos: number
  presupuestosTotales: number
  metasProgreso: number // Progreso promedio de metas (0-100)
}

export interface FinancialHealthResult {
  score: number // 0-100
  nivel: "critico" | "malo" | "regular" | "bueno" | "excelente"
  color: string // Color del semáforo
  mensaje: string
  desglose: {
    balance: { score: number; peso: number }
    presupuesto: { score: number; peso: number }
    ahorro: { score: number; peso: number }
    deuda: { score: number; peso: number }
  }
}

/**
 * Calcula el score de salud financiera (0-100)
 * Basado en 4 pilares con pesos diferentes
 */
export function calculateFinancialHealthScore(input: FinancialHealthInput): FinancialHealthResult {
  const { ingresosMes, gastosMes, ahorroNeto, deudaTotal, presupuestosCumplidos, presupuestosTotales, metasProgreso } =
    input

  // 1. BALANCE (25%) - ¿Ahorra o gasta más de lo que gana?
  let balanceScore = 0
  if (ahorroNeto > 0) {
    // Positivo: score basado en % de ahorro sobre ingresos
    const ratioAhorro = ingresosMes > 0 ? (ahorroNeto / ingresosMes) * 100 : 0
    balanceScore = Math.min(100, ratioAhorro * 5) // 20% ahorro = 100 puntos
  } else {
    // Negativo: penalización por déficit
    const ratioDeficit = ingresosMes > 0 ? Math.abs(ahorroNeto / ingresosMes) * 100 : 100
    balanceScore = Math.max(0, 100 - ratioDeficit * 2) // -50% ingresos = 0 puntos
  }

  // 2. PRESUPUESTO (25%) - ¿Cumple sus presupuestos?
  let presupuestoScore = 0
  if (presupuestosTotales > 0) {
    const ratioCumplimiento = (presupuestosCumplidos / presupuestosTotales) * 100
    presupuestoScore = ratioCumplimiento
  } else {
    // Sin presupuestos = score neutro (50)
    presupuestoScore = 50
  }

  // 3. AHORRO (25%) - ¿Está ahorrando para metas?
  let ahorroScore = metasProgreso // Ya viene en 0-100

  // 4. DEUDA (25%) - ¿Qué % de ingresos va a deuda?
  let deudaScore = 100
  if (deudaTotal > 0 && ingresosMes > 0) {
    const ratioDeuda = (deudaTotal / ingresosMes) * 100
    if (ratioDeuda < 30) {
      deudaScore = 100 // Deuda < 30% ingresos = excelente
    } else if (ratioDeuda < 50) {
      deudaScore = 80 - (ratioDeuda - 30) * 2 // 30-50% = 80-40 puntos
    } else if (ratioDeuda < 100) {
      deudaScore = 40 - (ratioDeuda - 50) * 0.8 // 50-100% = 40-0 puntos
    } else {
      deudaScore = 0 // Deuda > ingresos = crítico
    }
  }

  // Calcular score final ponderado
  const pesos = { balance: 0.25, presupuesto: 0.25, ahorro: 0.25, deuda: 0.25 }
  const scoreFinal =
    balanceScore * pesos.balance +
    presupuestoScore * pesos.presupuesto +
    ahorroScore * pesos.ahorro +
    deudaScore * pesos.deuda

  // Determinar nivel y color
  let nivel: FinancialHealthResult["nivel"]
  let color: string
  let mensaje: string

  if (scoreFinal >= 80) {
    nivel = "excelente"
    color = "#10b981" // Verde
    mensaje = "¡Excelente! Tu salud financiera es óptima"
  } else if (scoreFinal >= 60) {
    nivel = "bueno"
    color = "#22c55e" // Verde claro
    mensaje = "Bien. Tu situación financiera es saludable"
  } else if (scoreFinal >= 40) {
    nivel = "regular"
    color = "#f59e0b" // Amarillo
    mensaje = "Regular. Hay áreas que puedes mejorar"
  } else if (scoreFinal >= 20) {
    nivel = "malo"
    color = "#ef4444" // Rojo
    mensaje = "Atención. Tu salud financiera necesita mejoras"
  } else {
    nivel = "critico"
    color = "#dc2626" // Rojo oscuro
    mensaje = "Crítico. Toma acción inmediata sobre tus finanzas"
  }

  return {
    score: Math.round(scoreFinal),
    nivel,
    color,
    mensaje,
    desglose: {
      balance: { score: Math.round(balanceScore), peso: pesos.balance },
      presupuesto: { score: Math.round(presupuestoScore), peso: pesos.presupuesto },
      ahorro: { score: Math.round(ahorroScore), peso: pesos.ahorro },
      deuda: { score: Math.round(deudaScore), peso: pesos.deuda },
    },
  }
}

/**
 * Obtiene recomendaciones basadas en el desglose de salud financiera
 */
export function getFinancialHealthRecommendations(result: FinancialHealthResult): string[] {
  const recommendations: string[] = []
  const { desglose } = result

  if (desglose.balance.score < 50) {
    recommendations.push("Reduce gastos innecesarios para mejorar tu balance mensual")
  }

  if (desglose.presupuesto.score < 50) {
    recommendations.push("Define presupuestos realistas y haz seguimiento semanal")
  }

  if (desglose.ahorro.score < 40) {
    recommendations.push("Crea un fondo de emergencia de al menos 3 meses de gastos")
  }

  if (desglose.deuda.score < 50) {
    recommendations.push("Prioriza pagar deudas con mayores intereses primero")
  }

  if (recommendations.length === 0) {
    recommendations.push("¡Sigue así! Mantén estos hábitos financieros saludables")
  }

  return recommendations
}
