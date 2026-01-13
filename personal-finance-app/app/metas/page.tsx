"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { formatCLP, calculateAporteMensualSugerido } from "@/lib/utils-finance"
import { Target, TrendingUp, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { MetaDialog } from "@/components/meta-dialog"
import { AporteMetaDialog } from "@/components/aporte-meta-dialog"
import type { MetaAhorro } from "@/lib/types"
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

export default function MetasPage() {
  const { metasAhorro, cuentas, deleteMetaAhorro } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedMeta, setSelectedMeta] = useState<MetaAhorro | undefined>()
  const [aporteDialogOpen, setAporteDialogOpen] = useState(false)
  const [metaAporte, setMetaAporte] = useState<{ id: string; nombre: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [metaToDelete, setMetaToDelete] = useState<string | null>(null)

  const metasActivas = metasAhorro.filter((m) => m.estado === "Activa")
  const totalObjetivo = metasAhorro.reduce((sum, m) => sum + m.objetivoCLP, 0)
  const totalAcumulado = metasAhorro.reduce((sum, m) => sum + m.acumuladoCLP, 0)
  const progresoTotal = totalObjetivo > 0 ? (totalAcumulado / totalObjetivo) * 100 : 0

  const handleAdd = () => {
    setDialogMode("create")
    setSelectedMeta(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (meta: MetaAhorro) => {
    setDialogMode("edit")
    setSelectedMeta(meta)
    setDialogOpen(true)
  }

  const handleAportar = (meta: MetaAhorro) => {
    setMetaAporte({ id: meta.id, nombre: meta.nombre })
    setAporteDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setMetaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (metaToDelete) {
      deleteMetaAhorro(metaToDelete)
      toast({
        title: "Meta eliminada",
        description: "La meta de ahorro se ha eliminado correctamente",
      })
      setMetaToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas de Ahorro</h1>
          <p className="text-muted-foreground">Planifica y alcanza tus objetivos financieros</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Meta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Metas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metasActivas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCLP(totalAcumulado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progresoTotal.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Metas individuales */}
      <div className="grid gap-4 md:grid-cols-2">
        {metasAhorro.map((meta) => {
          const progreso = meta.objetivoCLP > 0 ? (meta.acumuladoCLP / meta.objetivoCLP) * 100 : 0
          const faltante = meta.objetivoCLP - meta.acumuladoCLP
          const cuenta = cuentas.find((c) => c.id === meta.cuentaDestinoId)
          const aporteActualizado = calculateAporteMensualSugerido(meta)

          return (
            <Card key={meta.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {meta.nombre}
                    </CardTitle>
                    <CardDescription>Cuenta: {cuenta?.nombre}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.estado === "Activa" ? "default" : "secondary"}>{meta.estado}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(meta.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progreso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Objetivo</span>
                    <span className="font-semibold">{formatCLP(meta.objetivoCLP)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Acumulado</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCLP(meta.acumuladoCLP)}
                    </span>
                  </div>
                  <Progress value={progreso} className="h-3" />
                  <div className="text-center text-sm font-semibold">{progreso.toFixed(1)}%</div>
                </div>

                {/* Información adicional */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Faltante</span>
                    <span className="font-semibold">{formatCLP(faltante)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Fecha objetivo
                    </span>
                    <span className="font-semibold">{meta.fechaObjetivo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Aporte mensual sugerido
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCLP(aporteActualizado)}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                {meta.estado === "Activa" && (
                  <Button className="w-full" size="sm" onClick={() => handleAportar(meta)}>
                    Aportar a esta meta
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <MetaDialog open={dialogOpen} onOpenChange={setDialogOpen} meta={selectedMeta} mode={dialogMode} />

      {metaAporte && (
        <AporteMetaDialog
          open={aporteDialogOpen}
          onOpenChange={setAporteDialogOpen}
          metaId={metaAporte.id}
          metaNombre={metaAporte.nombre}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La meta de ahorro será eliminada permanentemente.
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
