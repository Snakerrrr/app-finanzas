"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useData } from "@/lib/data-context"
import { deleteMovimiento } from "@/app/actions/finance"
import { formatCLP, formatDate } from "@/lib/utils-finance"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { MovimientoDialog } from "@/components/movimiento-dialog"
import type { Movimiento } from "@/lib/types"
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

export default function MovimientosPage() {
  const { movimientos, categorias, refreshData } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<string | null>(null)

  const movimientosFiltrados = movimientos
    .filter((mov) => {
      if (!searchTerm) return true
      return (
        mov.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categorias
          .find((c) => c.id === mov.categoriaId)
          ?.nombre.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const handleAdd = () => {
    setDialogMode("create")
    setSelectedMovimiento(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (movimiento: Movimiento) => {
    setDialogMode("edit")
    setSelectedMovimiento(movimiento)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setMovimientoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!movimientoToDelete) {
      setDeleteDialogOpen(false)
      return
    }
    const result = await deleteMovimiento(movimientoToDelete)
    setDeleteDialogOpen(false)
    setMovimientoToDelete(null)
    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento se ha eliminado correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">Libro completo de movimientos financieros</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Movimiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
          <CardDescription>Encuentra movimientos por descripción o categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Movimientos</CardTitle>
          <CardDescription>{movimientosFiltrados.length} movimientos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Fecha</th>
                  <th className="p-3 text-left text-sm font-medium">Descripción</th>
                  <th className="p-3 text-left text-sm font-medium">Categoría</th>
                  <th className="p-3 text-left text-sm font-medium">Tipo</th>
                  <th className="p-3 text-left text-sm font-medium">Método</th>
                  <th className="p-3 text-right text-sm font-medium">Monto</th>
                  <th className="p-3 text-center text-sm font-medium">Estado</th>
                  <th className="p-3 text-center text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((mov) => {
                  const categoria = categorias.find((c) => c.id === mov.categoriaId)

                  return (
                    <tr key={mov.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(mov.fecha)}</td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{mov.descripcion}</div>
                        {mov.cuotas && mov.cuotas > 1 && (
                          <div className="text-xs text-muted-foreground">{mov.cuotas} cuotas</div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" style={{ borderColor: categoria?.color }}>
                          {categoria?.nombre}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            mov.tipoMovimiento === "Ingreso"
                              ? "default"
                              : mov.tipoMovimiento === "Gasto"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {mov.tipoMovimiento}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{mov.metodoPago}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-semibold ${
                            mov.tipoMovimiento === "Ingreso"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {mov.tipoMovimiento === "Ingreso" ? "+" : "-"}
                          {formatCLP(mov.montoCLP)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={mov.estadoConciliacion === "Conciliado" ? "default" : "secondary"}>
                          {mov.estadoConciliacion}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(mov)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(mov.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <MovimientoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movimiento={selectedMovimiento}
        mode={dialogMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento será eliminado permanentemente.
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
