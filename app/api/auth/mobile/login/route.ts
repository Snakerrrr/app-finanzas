/**
 * Endpoint de Login para Apps Móviles
 *
 * POST /api/auth/mobile/login
 * Body: { email: string, password: string }
 * Response: { token: string, user: { id, email, name } }
 *
 * Este endpoint genera un JWT token para que apps móviles (React Native, Capacitor)
 * puedan autenticarse usando Bearer tokens en lugar de cookies.
 */

import { prisma } from "@/lib/db"
import { generateMobileToken } from "@/lib/auth-api"
import { logAuthEvent } from "@/lib/logger"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validar entrada
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos", details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const { email, password } = validation.data

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    })

    if (!user) {
      logAuthEvent("error", { email, reason: "user_not_found" })
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Verificar contraseña
    if (!user.password) {
      logAuthEvent("error", { email, userId: user.id, reason: "no_password_set" })
      return new Response(
        JSON.stringify({ error: "Usuario creado con OAuth. Usa login de Google en la web." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      logAuthEvent("error", { email, userId: user.id, reason: "invalid_password" })
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Generar JWT token
    const token = generateMobileToken(user.id, user.email!)

    logAuthEvent("login", { userId: user.id, email: user.email, method: "mobile_jwt" })

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    logAuthEvent("error", { error: error instanceof Error ? error.message : String(error) })
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
