import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getDashboardData,
  createMovimiento,
  ensureDefaultCategories,
  type CreateMovimientoInput,
} from "@/lib/services/finance.service"

const TIPOS_MOVIMIENTO = ["Ingreso", "Gasto", "Transferencia"] as const
const METODOS_PAGO = ["Débito", "Crédito", "Efectivo", "Transferencia"] as const
const TIPOS_GASTO = ["Fijo", "Variable", "Ocasional"] as const
const ESTADOS_CONCILIACION = ["Pendiente", "Conciliado"] as const

const createMovimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descripcion: z.string().min(1).max(500),
  tipoMovimiento: z.enum(TIPOS_MOVIMIENTO),
  categoriaId: z.string().min(1),
  subcategoria: z.string().optional(),
  tipoGasto: z.enum(TIPOS_GASTO).optional(),
  metodoPago: z.enum(METODOS_PAGO),
  montoCLP: z.number().positive(),
  cuotas: z.number().int().min(1).optional(),
  notas: z.string().optional(),
  estadoConciliacion: z.enum(ESTADOS_CONCILIACION).default("Pendiente"),
  mesConciliacion: z.string().regex(/^\d{4}-\d{2}$/),
  cuentaOrigenId: z.string().optional(),
  cuentaDestinoId: z.string().optional(),
  tarjetaCreditoId: z.string().optional(),
})

// TODO: Implementar validación de Token JWT (app móvil sin cookies de sesión)
function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get("x-user-id")
  if (userId?.trim()) return userId.trim()
  return null
}

/** GET /api/v1/movimientos - Lista movimientos del usuario */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { error: "No autorizado. Envía el header x-user-id." },
      { status: 401 }
    )
  }

  try {
    await ensureDefaultCategories(userId)
    const data = await getDashboardData(userId)
    return NextResponse.json(
      {
        data: {
          movimientos: data.movimientos,
          movimientosMes: data.movimientosMes,
          balanceTotal: data.balanceTotal,
        },
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("[API GET /api/v1/movimientos]", e)
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    )
  }
}

/** POST /api/v1/movimientos - Crea un movimiento */
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { error: "No autorizado. Envía el header x-user-id." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  const parsed = createMovimientoSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json(
      { error: first ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  const payload: CreateMovimientoInput = {
    ...parsed.data,
    subcategoria: parsed.data.subcategoria,
    tipoGasto: parsed.data.tipoGasto,
    cuotas: parsed.data.cuotas,
    notas: parsed.data.notas,
    cuentaOrigenId: parsed.data.cuentaOrigenId,
    cuentaDestinoId: parsed.data.cuentaDestinoId,
    tarjetaCreditoId: parsed.data.tarjetaCreditoId,
  }

  try {
    await ensureDefaultCategories(userId)
    const result = await createMovimiento(userId, payload)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API POST /api/v1/movimientos]", e)
    return NextResponse.json(
      { error: "Error al crear el movimiento" },
      { status: 500 }
    )
  }
}
