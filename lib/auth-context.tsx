"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import type { User } from "./types"

/**
 * Contexto de autenticación que expone la sesión de NextAuth con la misma API que antes.
 * Ya no usa localStorage: la sesión persiste en Supabase (tablas User, Account, Session) vía PrismaAdapter.
 */

interface AuthContextType {
  user: User | null
  login: (provider?: "google") => Promise<void>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function sessionUserToAppUser(sessionUser: { id: string; name?: string | null; email?: string | null }): User {
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? "",
    email: sessionUser.email ?? "",
    createdAt: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const user = session?.user ? sessionUserToAppUser(session.user) : null

  const login = async (provider: "google" = "google") => {
    await signIn(provider, { callbackUrl: "/" })
  }

  const logout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const register = async (_email: string, _password: string, _name: string): Promise<boolean> => {
    // Con autenticación solo Google, el registro es "entrar con Google" (primera vez crea el usuario en BD).
    await signIn("google", { callbackUrl: "/" })
    return true
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
