"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ConciliacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conciliación Mensual</h1>
        <p className="text-muted-foreground">Concilia tus cuentas con tus cartolas bancarias</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Funcionalidad en Desarrollo</AlertTitle>
        <AlertDescription>
          La conciliación mensual te permitirá verificar que tus movimientos registrados coincidan con tus cartolas
          bancarias.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>Características que incluirá esta sección</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Selector de mes y cuenta para conciliar
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Comparación entre saldo calculado y saldo declarado
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Marcar movimientos como conciliados
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Crear movimientos de ajuste automáticos
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
