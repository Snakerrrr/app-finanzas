/**
 * Autenticación API - Dual Mode (Web + Mobile)
 *
 * Soporta dos métodos de autenticación:
 * 1. Cookies de sesión (NextAuth.js) - Para web
 * 2. Bearer token (JWT) - Para apps móviles nativas
 */

import { auth } from "@/auth"
import jwt from "jsonwebtoken"
import { logger } from "@/lib/logger"

const JWT_SECRET = process.env.AUTH_SECRET!
const JWT_EXPIRATION = "7d" // Token válido por 7 días

export interface AuthResult {
  success: boolean
  userId?: string
  error?: string
}

/**
 * Autentica una request API usando cookies (web) o Bearer token (móvil)
 * 
 * @param request - Request de Next.js
 * @returns AuthResult con userId si es válido
 */
export async function authenticateAPIRequest(request: Request): Promise<AuthResult> {
  try {
    // 1. Intentar autenticación con cookies (NextAuth.js) - WEB
    const session = await auth()
    if (session?.user?.id) {
      return { success: true, userId: session.user.id }
    }

    // 2. Intentar autenticación con Bearer token - MOBILE
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
        return { success: true, userId: decoded.userId }
      } catch (error) {
        logger.warn({ error }, "Token JWT inválido o expirado")
        return { success: false, error: "Token inválido o expirado" }
      }
    }

    // 3. Sin autenticación
    return { success: false, error: "No autenticado" }
  } catch (error) {
    logger.error({ error }, "Error en authenticateAPIRequest")
    return { success: false, error: "Error de autenticación" }
  }
}

/**
 * Genera un JWT token para apps móviles
 * 
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @returns Token JWT firmado
 */
export function generateMobileToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: "mobile",
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      issuer: "finanzas-cl",
    }
  )
}

/**
 * Helper para verificar si un token es válido
 * 
 * @param token - Token JWT
 * @returns true si es válido, false si no
 */
export function verifyMobileToken(token: string): { valid: boolean; userId?: string; email?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; type: string }
    
    if (decoded.type !== "mobile") {
      return { valid: false }
    }
    
    return { valid: true, userId: decoded.userId, email: decoded.email }
  } catch (error) {
    return { valid: false }
  }
}
