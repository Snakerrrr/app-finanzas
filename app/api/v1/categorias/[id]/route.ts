import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getDashboardData,
  updateCategoria,
  deleteCategoria,
} from "@/lib/services/finance.service"
import { authenticateAPIRequest } from "@/lib/auth-api"

const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]).optional(),
  color: z.string().min(1).max(20).optional(),
  icono: z.string().min(1).max(80).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/v1/categorias/:id - Obtiene una categoría por id */
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
    const categoria = data.categorias.find((c) => c.id === id)
    if (!categoria) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: categoria }, { status: 200 })
  } catch (e) {
    console.error("[API GET /api/v1/categorias/[id]]", e)
    return NextResponse.json(
      { error: "Error al obtener la categoría" },
      { status: 500 }
    )
  }
}

/** PUT /api/v1/categorias/:id - Actualiza una categoría */
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

  const parsed = updateCategoriaSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json(
      { error: first ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  try {
    const result = await updateCategoria(userId, id, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API PUT /api/v1/categorias/[id]]", e)
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    )
  }
}

/** DELETE /api/v1/categorias/:id - Elimina una categoría */
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
    const result = await deleteCategoria(userId, id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (e) {
    console.error("[API DELETE /api/v1/categorias/[id]]", e)
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    )
  }
}
