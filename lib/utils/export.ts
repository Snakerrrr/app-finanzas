/**
 * Utilidades de exportación CSV y PDF (client-side)
 */

import type { MovimientoForClient, CategoriaForClient } from "@/lib/services/finance.service"
import { formatCLP } from "@/lib/utils-finance"

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export function exportMovimientosCSV(
  movimientos: MovimientoForClient[],
  categorias: CategoriaForClient[],
  filename?: string
): void {
  const headers = [
    "Fecha",
    "Descripción",
    "Tipo",
    "Categoría",
    "Tipo Gasto",
    "Método Pago",
    "Monto CLP",
    "Estado",
    "Notas",
  ]

  const rows = movimientos.map((m) => {
    const cat = categorias.find((c) => c.id === m.categoriaId)
    return [
      m.fecha,
      `"${m.descripcion.replace(/"/g, '""')}"`,
      m.tipoMovimiento,
      cat?.nombre ?? "Sin categoría",
      m.tipoGasto ?? "",
      m.metodoPago,
      m.montoCLP.toString(),
      m.estadoConciliacion,
      `"${(m.notas ?? "").replace(/"/g, '""')}"`,
    ]
  })

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

  // BOM para que Excel reconozca UTF-8
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename ?? `movimientos_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// PDF Export (HTML-based, sin dependencias externas)
// ---------------------------------------------------------------------------

export function exportMovimientosPDF(
  movimientos: MovimientoForClient[],
  categorias: CategoriaForClient[],
  titulo?: string
): void {
  const ingresos = movimientos
    .filter((m) => m.tipoMovimiento === "Ingreso")
    .reduce((s, m) => s + m.montoCLP, 0)
  const gastos = movimientos
    .filter((m) => m.tipoMovimiento === "Gasto")
    .reduce((s, m) => s + m.montoCLP, 0)
  const balance = ingresos - gastos

  const rows = movimientos
    .map((m) => {
      const cat = categorias.find((c) => c.id === m.categoriaId)
      const color = m.tipoMovimiento === "Ingreso" ? "#10b981" : "#ef4444"
      const signo = m.tipoMovimiento === "Ingreso" ? "+" : "-"
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${m.fecha}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${m.descripcion}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${cat?.nombre ?? "-"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${m.metodoPago}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;color:${color};font-weight:600">${signo}${formatCLP(m.montoCLP)}</td>
        </tr>
      `
    })
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${titulo ?? "Reporte de Movimientos"}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1f2937; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        .summary { display: flex; gap: 24px; margin-bottom: 24px; }
        .summary-card { padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; flex: 1; }
        .summary-card h3 { font-size: 12px; color: #6b7280; margin: 0 0 4px 0; text-transform: uppercase; }
        .summary-card p { font-size: 20px; font-weight: 700; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        th:last-child { text-align: right; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <h1>${titulo ?? "Reporte de Movimientos"}</h1>
      <p class="subtitle">Generado el ${new Date().toLocaleDateString("es-CL")} - ${movimientos.length} movimientos</p>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Ingresos</h3>
          <p style="color:#10b981">${formatCLP(ingresos)}</p>
        </div>
        <div class="summary-card">
          <h3>Gastos</h3>
          <p style="color:#ef4444">${formatCLP(gastos)}</p>
        </div>
        <div class="summary-card">
          <h3>Balance</h3>
          <p style="color:${balance >= 0 ? "#10b981" : "#ef4444"}">${formatCLP(balance)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Método</th>
            <th style="text-align:right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p class="footer">FinanzasCL - Reporte generado automáticamente</p>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    // Esperar a que cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
