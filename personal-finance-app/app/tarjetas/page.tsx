"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { formatCLP } from "@/lib/utils-finance"
import { CreditCard, Calendar, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react"
import { TarjetaDialog } from "@/components/tarjeta-dialog"
import type { TarjetaCredito } from "@/lib/types"
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
import { useToast } from "@/hooks/use-toast"

export default function TarjetasPage() {
  const { tarjetasCredito, deleteTarjetaCredito } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaCredito | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tarjetaToDelete, setTarjetaToDelete] = useState<string | null>(null)

  const deudaTotal = tarjetasCredito.reduce((sum, tc) => sum + tc.deudaActual, 0)
  const cupoTotalDisponible = tarjetasCredito.reduce((sum, tc) => sum + tc.cupoDisponible, 0)

  const handleAdd = () => {
    setDialogMode("create")
    setSelectedTarjeta(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (tarjeta: TarjetaCredito) => {
    setDialogMode("edit")
    setSelectedTarjeta(tarjeta)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setTarjetaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (tarjetaToDelete) {
      deleteTarjetaCredito(tarjetaToDelete)
      toast({
        title: "Tarjeta eliminada",
        description: "La tarjeta de crédito se ha eliminado correctamente",
      })
      setTarjetaToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarjetas de Crédito</h1>
          <p className="text-muted-foreground">Gestión de tarjetas y control de deudas</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tarjeta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCLP(deudaTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cupo Disponible Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCLP(cupoTotalDisponible)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 md:grid-cols-2">
        {tarjetasCredito.map((tc) => {
          const usoDelCupo = ((tc.cupoTotal - tc.cupoDisponible) / tc.cupoTotal) * 100

          return (
            <Card key={tc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {tc.nombre}
                    </CardTitle>
                    <CardDescription>{tc.banco}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{usoDelCupo.toFixed(0)}% usado</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(tc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cupo */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cupo Total</span>
                    <span className="font-semibold">{formatCLP(tc.cupoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cupo Disponible</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCLP(tc.cupoDisponible)}
                    </span>
                  </div>
                  <Progress value={usoDelCupo} className="h-2" />
                </div>

                {/* Deudas */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda Facturada</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{formatCLP(tc.deudaFacturada)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda No Facturada</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatCLP(tc.deudaNoFacturada)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total Deuda</span>
                    <span className="text-red-600 dark:text-red-400">{formatCLP(tc.deudaActual)}</span>
                  </div>
                </div>

                {/* Fechas importantes */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Facturación: Día {tc.fechaFacturacion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Pago: Día {tc.fechaPago}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Interés mensual: {tc.tasaInteresMensual}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <TarjetaDialog open={dialogOpen} onOpenChange={setDialogOpen} tarjeta={selectedTarjeta} mode={dialogMode} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
