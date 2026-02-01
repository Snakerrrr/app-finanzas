"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { initialCategorias, initialCuentas } from "./initial-data"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("finanzas-cl-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Get existing users
      const usersData = localStorage.getItem("finanzas-cl-users")
      const users: Record<string, { password: string; user: User }> = usersData ? JSON.parse(usersData) : {}

      // Check if user already exists
      if (users[email]) {
        return false
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
      }

      // Save user credentials
      users[email] = { password, user: newUser }
      localStorage.setItem("finanzas-cl-users", JSON.stringify(users))

      localStorage.setItem(
        `finanzas-cl-data-${newUser.id}`,
        JSON.stringify({
          movimientos: [],
          categorias: initialCategorias,
          cuentas: initialCuentas,
          tarjetasCredito: [],
          metasAhorro: [],
          presupuestos: [],
        }),
      )

      // Set current user
      setUser(newUser)
      localStorage.setItem("finanzas-cl-user", JSON.stringify(newUser))

      return true
    } catch (error) {
      console.error("[v0] Error registering user:", error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem("finanzas-cl-users")
      if (!usersData) return false

      const users: Record<string, { password: string; user: User }> = JSON.parse(usersData)
      const userData = users[email]

      if (!userData || userData.password !== password) {
        return false
      }

      setUser(userData.user)
      localStorage.setItem("finanzas-cl-user", JSON.stringify(userData.user))
      return true
    } catch (error) {
      console.error("[v0] Error logging in:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("finanzas-cl-user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
