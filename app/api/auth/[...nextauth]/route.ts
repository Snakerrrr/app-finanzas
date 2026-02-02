import { handlers } from "@/auth"

/**
 * API Route de NextAuth.js (Auth.js).
 * Exporta GET y POST para que las rutas /api/auth/* (signin, signout, callback, etc.) funcionen.
 */
export const { GET, POST } = handlers
