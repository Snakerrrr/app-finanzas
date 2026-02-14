import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateAPIRequest } from "@/lib/auth-api"
import {
  getRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "@/lib/services/recurring.service"

const updateSchema = z.object({
  descripcion: z.string().min(1).max(500).optional(),
  montoCLP: z.number().positive().optional(),
  frecuencia: z.enum(["mensual", "quincenal", "semanal"]).optional(),
  diaMes: z.number().int().min(1).max(31).optional().nullable(),
  categoriaId: z.string().min(1).optional(),
  cuentaOrigenId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  autoCrear: z.boolean().optional(),
  proximaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/** GET /api/v1/recurrentes/:id */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: authResult.error || "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await getRecurringTransaction(authResult.userId, id)
    if (!data) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }
    return NextResponse.json({ data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

/** PUT /api/v1/recurrentes/:id */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: authResult.error || "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return NextResponse.json({ error: first ?? "Datos inválidos" }, { status: 400 })
    }

    const result = await updateRecurringTransaction(authResult.userId, id, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

/** DELETE /api/v1/recurrentes/:id */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json({ error: authResult.error || "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await deleteRecurringTransaction(authResult.userId, id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
