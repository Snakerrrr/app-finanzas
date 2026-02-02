"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { formatCLP, getCurrentMonth, calculatePresupuestoUsage } from "@/lib/utils-finance"
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { PresupuestoDialog } from "@/components/presupuesto-dialog"
import type { Presupuesto } from "@/lib/types"
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

export default function PresupuestosPage() {
  const { movimientos, categorias, presupuestos, deletePresupuesto } = useData()
  const { toast } = useToast()
  const mesActual = getCurrentMonth()
  const presupuestoUsage = calculatePresupuestoUsage(movimientos, presupuestos, mesActual)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [presupuestoToDelete, setPresupuestoToDelete] = useState<string | null>(null)

  const totalPresupuestado = presupuestos.reduce((sum, p) => sum + p.montoPresupuestadoCLP, 0)
  const totalGastado = presupuestoUsage.reduce((sum, p) => sum + p.gastado, 0)
  const porcentajeTotal = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0

  const dataGrafico = presupuestoUsage.map((p) => {
    const categoria = categorias.find((c) => c.id === p.categoriaId)
    return {
      categoria: categoria?.nombre || "Desconocido",
      presupuestado: p.presupuestado,
      gastado: p.gastado,
    }
  })

  const handleAdd = () => {
    setDialogMode("create")
    setSelectedPresupuesto(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (presupuesto: Presupuesto) => {
    setDialogMode("edit")
    setSelectedPresupuesto(presupuesto)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setPresupuestoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (presupuestoToDelete) {
      deletePresupuesto(presupuestoToDelete)
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente",
      })
      setPresupuestoToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de presupuestos por categoría</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Presupuesto
        </Button>
      </div>

      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(totalPresupuestado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(totalGastado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Uso del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{porcentajeTotal.toFixed(1)}%</div>
              {porcentajeTotal >= 100 && <AlertTriangle className="h-5 w-5 text-red-500" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico comparativo */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto vs Real</CardTitle>
          <CardDescription>Comparación por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dataGrafico}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="categoria" className="text-xs" angle={-45} textAnchor="end" height={100} />
              <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCLP(value)}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Bar dataKey="presupuestado" fill="#3b82f6" name="Presupuestado" />
              <Bar dataKey="gastado" fill="#ef4444" name="Gastado" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalle por categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Categoría</CardTitle>
          <CardDescription>Progreso individual de cada presupuesto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {presupuestoUsage.map((p) => {
              const categoria = categorias.find((c) => c.id === p.categoriaId)
              const presupuesto = presupuestos.find((pr) => pr.categoriaId === p.categoriaId && pr.mes === mesActual)
              const isWarning = p.porcentaje >= 80 && p.porcentaje < 100
              const isDanger = p.porcentaje >= 100

              return (
                <div key={p.categoriaId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" style={{ borderColor: categoria?.color }}>
                        {categoria?.nombre}
                      </Badge>
                      {isWarning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      {isDanger && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-semibold">{formatCLP(p.gastado)}</span>
                        <span className="text-muted-foreground"> / {formatCLP(p.presupuestado)}</span>
                        <span
                          className={`ml-2 ${isDanger ? "text-red-600" : isWarning ? "text-yellow-600" : "text-green-600"}`}
                        >
                          ({p.porcentaje.toFixed(1)}%)
                        </span>
                      </div>
                      {presupuesto && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(presupuesto)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(presupuesto.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(p.porcentaje, 100)} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <PresupuestoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        presupuesto={selectedPresupuesto}
        mode={dialogMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
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
