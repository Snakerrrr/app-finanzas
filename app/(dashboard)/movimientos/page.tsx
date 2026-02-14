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
import { Plus, Search, Pencil, Trash2, Filter, X, ArrowLeftRight, Upload } from "lucide-react"
import { InlineEditRow } from "@/components/movimientos/inline-edit-row"
import { EmptyState } from "@/components/ui/empty-state"
import { CSVImportDialog } from "@/components/movimientos/csv-import-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MovimientoDialog } from "@/components/movimiento-dialog"
import { ExportButtons } from "@/components/export-buttons"
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
  const { movimientos, categorias, cuentas, refreshData } = useData()
  const [csvImportOpen, setCSVImportOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("todos")
  const [filterCategoria, setFilterCategoria] = useState<string>("todas")
  const [filterFechaDesde, setFilterFechaDesde] = useState("")
  const [filterFechaHasta, setFilterFechaHasta] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<string | null>(null)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)

  const hasActiveFilters = filterTipo !== "todos" || filterCategoria !== "todas" || filterFechaDesde || filterFechaHasta

  const clearFilters = () => {
    setFilterTipo("todos")
    setFilterCategoria("todas")
    setFilterFechaDesde("")
    setFilterFechaHasta("")
    setSearchTerm("")
  }

  const movimientosFiltrados = movimientos
    .filter((mov) => {
      // Filtro de búsqueda por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const catNombre = categorias.find((c) => c.id === mov.categoriaId)?.nombre?.toLowerCase() ?? ""
        if (
          !mov.descripcion.toLowerCase().includes(term) &&
          !catNombre.includes(term) &&
          !mov.notas?.toLowerCase().includes(term)
        ) {
          return false
        }
      }
      // Filtro por tipo
      if (filterTipo !== "todos" && mov.tipoMovimiento !== filterTipo) return false
      // Filtro por categoría
      if (filterCategoria !== "todas" && mov.categoriaId !== filterCategoria) return false
      // Filtro por rango de fechas
      if (filterFechaDesde && mov.fecha < filterFechaDesde) return false
      if (filterFechaHasta && mov.fecha > filterFechaHasta) return false
      return true
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCSVImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <ExportButtons
            movimientos={movimientosFiltrados}
            categorias={categorias}
            titulo="Reporte de Movimientos"
          />
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Movimiento
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Búsqueda y Filtros</CardTitle>
              <CardDescription>Encuentra movimientos por descripción, categoría o notas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </Button>
              )}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción, categoría o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                    <SelectItem value="Gasto">Gasto</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={filterFechaDesde}
                  onChange={(e) => setFilterFechaDesde(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={filterFechaHasta}
                  onChange={(e) => setFilterFechaHasta(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Movimientos</CardTitle>
          <CardDescription>{movimientosFiltrados.length} movimientos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {movimientosFiltrados.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title={searchTerm || hasActiveFilters ? "Sin resultados" : "Sin movimientos"}
              description={
                searchTerm || hasActiveFilters
                  ? "No se encontraron movimientos con los filtros aplicados. Intenta con otros criterios."
                  : "Aún no has registrado movimientos. Comienza agregando tu primer ingreso o gasto."
              }
              actionLabel={searchTerm || hasActiveFilters ? "Limpiar filtros" : "Agregar Movimiento"}
              onAction={searchTerm || hasActiveFilters ? clearFilters : handleAdd}
            />
          ) : (
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

                  // Edición inline
                  if (inlineEditId === mov.id) {
                    return (
                      <InlineEditRow
                        key={mov.id}
                        movimiento={mov}
                        categorias={categorias}
                        onSave={async () => {
                          setInlineEditId(null)
                          await refreshData()
                          router.refresh()
                        }}
                        onCancel={() => setInlineEditId(null)}
                      />
                    )
                  }

                  return (
                    <tr
                      key={mov.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onDoubleClick={() => setInlineEditId(mov.id)}
                    >
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
                          <Button variant="ghost" size="icon" onClick={() => setInlineEditId(mov.id)} title="Edición rápida">
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
          )}
        </CardContent>
      </Card>

      <MovimientoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movimiento={selectedMovimiento}
        mode={dialogMode}
      />

      <CSVImportDialog
        open={csvImportOpen}
        onOpenChange={setCSVImportOpen}
        categorias={categorias}
        cuentas={cuentas}
        onImportComplete={async () => {
          await refreshData()
          router.refresh()
        }}
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
