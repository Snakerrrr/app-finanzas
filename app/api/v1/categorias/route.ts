import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getDashboardData,
  createCategoria,
} from "@/lib/services/finance.service"

const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(120),
  tipo: z.enum(["Gasto", "Ingreso", "Ambos"]),
  color: z.string().min(1).max(20),
  icono: z.string().min(1).max(80),
})

// TODO: Implementar validación de Token JWT (app móvil sin cookies de sesión)
function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get("x-user-id")
  if (userId?.trim()) return userId.trim()
  return null
}

/** GET /api/v1/categorias - Lista categorías del usuario */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { error: "No autorizado. Envía el header x-user-id." },
      { status: 401 }
    )
  }

  try {
    const data = await getDashboardData(userId)
    return NextResponse.json(
      { data: data.categorias },
      { status: 200 }
    )
  } catch (e) {
    console.error("[API GET /api/v1/categorias]", e)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}

/** POST /api/v1/categorias - Crea una categoría */
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

  const parsed = createCategoriaSchema.safeParse(body)
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json(
      { error: first ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  try {
    const result = await createCategoria(userId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(
      { data: { success: true, id: result.id } },
      { status: 200 }
    )
  } catch (e) {
    console.error("[API POST /api/v1/categorias]", e)
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    )
  }
}
