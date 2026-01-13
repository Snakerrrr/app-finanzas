"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ConfiguracionPage() {
  const [showResetDialog, setShowResetDialog] = useState(false)

  const handleResetSystem = () => {
    console.log("[v0] Iniciando limpieza del sistema...")

    localStorage.removeItem("finanzas-cl-user")
    localStorage.removeItem("finanzas-cl-users")

    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("finanzas-cl-data-")) {
        localStorage.removeItem(key)
      }
    })

    console.log("[v0] Sistema limpiado completamente")
    window.location.href = "/login"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajusta las preferencias de la aplicación</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          La aplicación está configurada para el mercado chileno: formato CLP sin decimales, fechas dd-mm-aaaa, y semana
          que inicia en lunes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Formato Regional</CardTitle>
          <CardDescription>Configuración para Chile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Moneda</span>
            <span className="font-semibold">Peso Chileno (CLP)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Formato de fecha</span>
            <span className="font-semibold">DD-MM-AAAA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Primer día de la semana</span>
            <span className="font-semibold">Lunes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Idioma</span>
            <span className="font-semibold">Español (Chile)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles que eliminarán todos los datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resetear Sistema</p>
              <p className="text-sm text-muted-foreground">
                Elimina todos los usuarios y datos del sistema. Esta acción no se puede deshacer.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowResetDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Resetear
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todos los usuarios, cuentas, movimientos, presupuestos y cualquier
              otro dato del sistema. No podrás recuperar esta información.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSystem} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
