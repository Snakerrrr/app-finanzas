"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login: loginGoogle, isLoading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/",
      })
      if (result?.ok && result.url) {
        toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente" })
        router.push(result.url)
        return
      }
      toast({
        title: "Error",
        description: result?.error === "CredentialsSignin" ? "Email o contraseña incorrectos" : "No se pudo iniciar sesión",
        variant: "destructive",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await loginGoogle("google")
      toast({ title: "Redirigiendo", description: "Iniciando sesión con Google..." })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">FinanzasCL</CardTitle>
          <CardDescription className="text-center">
            Ingresa a tu cuenta para gestionar tus finanzas personales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión con email"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <LogIn className="h-5 w-5" />
            {isLoading ? "Conectando..." : "Ingresar con Google"}
          </Button>

          <div className="mt-4 text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
