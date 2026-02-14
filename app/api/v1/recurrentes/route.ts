import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateAPIRequest } from "@/lib/auth-api"
import {
  getRecurringTransactions,
  createRecurringTransaction,
} from "@/lib/services/recurring.service"

const createSchema = z.object({
  descripcion: z.string().min(1).max(500),
  montoCLP: z.number().positive(),
  frecuencia: z.enum(["mensual", "quincenal", "semanal"]),
  diaMes: z.number().int().min(1).max(31).optional().nullable(),
  categoriaId: z.string().min(1),
  cuentaOrigenId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  autoCrear: z.boolean().optional(),
  proximaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

/** GET /api/v1/recurrentes */
export async function GET(request: NextRequest) {
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: authResult.error || "No autorizado" }, { status: 401 })
  }

  try {
    const data = await getRecurringTransactions(authResult.userId)
    return NextResponse.json({ data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

/** POST /api/v1/recurrentes */
export async function POST(request: NextRequest) {
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: authResult.error || "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return NextResponse.json({ error: first ?? "Datos inválidos" }, { status: 400 })
    }

    const result = await createRecurringTransaction(authResult.userId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: { id: result.id } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
