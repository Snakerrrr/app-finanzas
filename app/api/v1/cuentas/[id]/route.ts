import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getDashboardData,
  updateCuenta,
  deleteCuenta,
} from "@/lib/services/finance.service"
import { authenticateAPIRequest } from "@/lib/auth-api"

const updateCuentaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  banco: z.string().min(1).max(120).optional(),
  saldoInicialMes: z.number().optional(),
  activo: z.boolean().optional(),
  saldoFinalMesDeclarado: z.number().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/v1/cuentas/:id - Obtiene una cuenta por id */
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
    const cuenta = data.cuentas.find((c) => c.id === id)
    if (!cuenta) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: cuenta }, { status: 200 })
  } catch (e) {
    console.error("[API GET /api/v1/cuentas/[id]]", e)
    return NextResponse.json(
      { error: "Error al obtener la cuenta" },
      { status: 500 }
    )
  }
}

/** PUT /api/v1/cuentas/:id - Actualiza una cuenta */
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

  const parsed = updateCuentaSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json(
      { error: first ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  try {
    const result = await updateCuenta(userId, id, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API PUT /api/v1/cuentas/[id]]", e)
    return NextResponse.json(
      { error: "Error al actualizar la cuenta" },
      { status: 500 }
    )
  }
}

/** DELETE /api/v1/cuentas/:id - Elimina una cuenta */
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
    const result = await deleteCuenta(userId, id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API DELETE /api/v1/cuentas/[id]]", e)
    return NextResponse.json(
      { error: "Error al eliminar la cuenta" },
      { status: 500 }
    )
  }
}
