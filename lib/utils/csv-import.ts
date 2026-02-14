/**
 * Utilidad para importar movimientos desde CSV
 * Soporta formatos comunes de bancos chilenos y formato genérico
 */

export type CSVRow = {
  fecha: string
  descripcion: string
  monto: number
  tipo: "Ingreso" | "Gasto"
  categoria?: string
  notas?: string
}

export type CSVImportResult = {
  rows: CSVRow[]
  errors: string[]
  totalRows: number
}

/**
 * Parsea un archivo CSV y retorna las filas procesadas
 */
export function parseCSV(content: string): CSVImportResult {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return { rows: [], errors: ["El archivo está vacío o no tiene datos"], totalRows: 0 }
  }

  // Detectar separador (coma o punto y coma)
  const header = lines[0]
  const separator = header.includes(";") ? ";" : ","

  const headers = header.split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ""))

  // Mapeo flexible de columnas
  const colMap = detectColumns(headers)

  if (!colMap.fecha || !colMap.descripcion || !colMap.monto) {
    return {
      rows: [],
      errors: [
        `Columnas requeridas no encontradas. Se necesitan: fecha, descripcion, monto. Encontradas: ${headers.join(", ")}`,
      ],
      totalRows: lines.length - 1,
    }
  }

  const rows: CSVRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseLine(line, separator)

    try {
      const fecha = parseDate(values[colMap.fecha] ?? "")
      const descripcion = (values[colMap.descripcion] ?? "").replace(/"/g, "").trim()
      const montoRaw = (values[colMap.monto] ?? "").replace(/"/g, "").replace(/\./g, "").replace(",", ".").trim()
      const monto = Math.abs(parseFloat(montoRaw))

      if (!fecha || !descripcion || isNaN(monto)) {
        errors.push(`Fila ${i + 1}: datos inválidos (fecha=${values[colMap.fecha]}, monto=${values[colMap.monto]})`)
        continue
      }

      // Detectar tipo
      let tipo: "Ingreso" | "Gasto" = "Gasto"
      if (colMap.tipo !== undefined) {
        const tipoVal = (values[colMap.tipo] ?? "").toLowerCase()
        if (tipoVal.includes("ingreso") || tipoVal.includes("abono") || tipoVal.includes("income")) {
          tipo = "Ingreso"
        }
      } else {
        // Si el monto original era positivo, es ingreso
        const montoOriginal = parseFloat(montoRaw)
        if (montoOriginal > 0) tipo = "Ingreso"
      }

      const categoria = colMap.categoria !== undefined ? (values[colMap.categoria] ?? "").replace(/"/g, "").trim() : undefined
      const notas = colMap.notas !== undefined ? (values[colMap.notas] ?? "").replace(/"/g, "").trim() : undefined

      rows.push({ fecha, descripcion, monto, tipo, categoria, notas })
    } catch {
      errors.push(`Fila ${i + 1}: error al procesar`)
    }
  }

  return { rows, errors, totalRows: lines.length - 1 }
}

function detectColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}

  headers.forEach((h, i) => {
    if (h.includes("fecha") || h.includes("date") || h.includes("dia")) map.fecha = i
    if (h.includes("descripcion") || h.includes("description") || h.includes("detalle") || h.includes("concepto") || h.includes("glosa")) map.descripcion = i
    if (h.includes("monto") || h.includes("amount") || h.includes("valor") || h.includes("importe")) map.monto = i
    if (h.includes("tipo") || h.includes("type") || h.includes("movimiento")) map.tipo = i
    if (h.includes("categoria") || h.includes("category") || h.includes("rubro")) map.categoria = i
    if (h.includes("nota") || h.includes("note") || h.includes("observacion") || h.includes("comentario")) map.notas = i
  })

  return map
}

function parseLine(line: string, separator: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === separator && !inQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function parseDate(raw: string): string {
  const cleaned = raw.replace(/"/g, "").trim()

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  // Formato YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymdMatch) return cleaned

  // Formato YYYY/MM/DD
  const ymdSlash = cleaned.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (ymdSlash) return cleaned.replace(/\//g, "-")

  return ""
}
