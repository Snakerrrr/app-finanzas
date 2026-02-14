import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  updateMovimiento,
  deleteMovimiento,
  getDashboardData,
  type UpdateMovimientoInput,
} from "@/lib/services/finance.service"
import { authenticateAPIRequest } from "@/lib/auth-api"

const TIPOS_MOVIMIENTO = ["Ingreso", "Gasto", "Transferencia"] as const
const METODOS_PAGO = ["Débito", "Crédito", "Efectivo", "Transferencia"] as const
const TIPOS_GASTO = ["Fijo", "Variable", "Ocasional"] as const
const ESTADOS_CONCILIACION = ["Pendiente", "Conciliado"] as const

const updateMovimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  descripcion: z.string().min(1).max(500).optional(),
  tipoMovimiento: z.enum(TIPOS_MOVIMIENTO).optional(),
  categoriaId: z.string().min(1).optional(),
  subcategoria: z.string().optional().nullable(),
  tipoGasto: z.enum(TIPOS_GASTO).optional().nullable(),
  metodoPago: z.enum(METODOS_PAGO).optional(),
  montoCLP: z.number().positive().optional(),
  cuotas: z.number().int().min(1).optional().nullable(),
  notas: z.string().optional().nullable(),
  estadoConciliacion: z.enum(ESTADOS_CONCILIACION).optional(),
  mesConciliacion: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  cuentaOrigenId: z.string().optional().nullable(),
  cuentaDestinoId: z.string().optional().nullable(),
  tarjetaCreditoId: z.string().optional().nullable(),
})

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/v1/movimientos/:id - Obtiene un movimiento por id */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Autenticación dual: cookies (web) o Bearer token (móvil)
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || "No autorizado" },
      { status: 401 }
    )
  }
  
  const userId = authResult.userId

  const { id } = await context.params
  try {
    const data = await getDashboardData(userId)
    const movimiento = data.movimientos.find((m) => m.id === id)
    if (!movimiento) {
      return NextResponse.json(
        { error: "Movimiento no encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: movimiento }, { status: 200 })
  } catch (e) {
    console.error("[API GET /api/v1/movimientos/[id]]", e)
    return NextResponse.json(
      { error: "Error al obtener el movimiento" },
      { status: 500 }
    )
  }
}

/** PUT /api/v1/movimientos/:id - Actualiza un movimiento */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  // Autenticación dual: cookies (web) o Bearer token (móvil)
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || "No autorizado" },
      { status: 401 }
    )
  }
  
  const userId = authResult.userId

  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  const parsed = updateMovimientoSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json(
      { error: first ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  try {
    const result = await updateMovimiento(userId, id, parsed.data as UpdateMovimientoInput)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API PUT /api/v1/movimientos/[id]]", e)
    return NextResponse.json(
      { error: "Error al actualizar el movimiento" },
      { status: 500 }
    )
  }
}

/** DELETE /api/v1/movimientos/:id - Elimina un movimiento */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Autenticación dual: cookies (web) o Bearer token (móvil)
  const authResult = await authenticateAPIRequest(request)
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || "No autorizado" },
      { status: 401 }
    )
  }
  
  const userId = authResult.userId

  const { id } = await context.params
  try {
    const result = await deleteMovimiento(userId, id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API DELETE /api/v1/movimientos/[id]]", e)
    return NextResponse.json(
      { error: "Error al eliminar el movimiento" },
      { status: 500 }
    )
  }
}
