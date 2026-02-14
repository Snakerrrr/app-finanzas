"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Repeat } from "lucide-react"
import { RecurrentTransactionCard } from "./recurrent-transaction-card"
import { RecurrentForm } from "./recurrent-form"
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "@/app/actions/recurring"
import type { RecurringForClient } from "@/lib/services/recurring.service"
import type { CategoriaForClient, CuentaForClient } from "@/lib/services/finance.service"
import { useToast } from "@/hooks/use-toast"
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
import { formatCLP } from "@/lib/utils-finance"

interface RecurrentesClientProps {
  recurrentes: RecurringForClient[]
  categorias: CategoriaForClient[]
  cuentas: CuentaForClient[]
}

export function RecurrentesClient({ recurrentes, categorias, cuentas }: RecurrentesClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringForClient | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const activos = recurrentes.filter((r) => r.activo)
  const inactivos = recurrentes.filter((r) => !r.activo)
  const totalMensual = activos
    .filter((r) => r.frecuencia === "mensual")
    .reduce((sum, r) => sum + r.montoCLP, 0)
  const totalQuincenal = activos
    .filter((r) => r.frecuencia === "quincenal")
    .reduce((sum, r) => sum + r.montoCLP * 2, 0) // x2 para mensualizar
  const totalSemanal = activos
    .filter((r) => r.frecuencia === "semanal")
    .reduce((sum, r) => sum + r.montoCLP * 4.33, 0) // x4.33 para mensualizar
  const totalEstimadoMensual = totalMensual + totalQuincenal + totalSemanal

  const getCategoriaName = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? ""

  const handleCreate = (data: Parameters<typeof createRecurringTransaction>[0]) => {
    startTransition(async () => {
      const result = await createRecurringTransaction(data)
      if (result.success) {
        toast({ title: "Gasto recurrente creado", description: "Se ha registrado correctamente" })
        setFormOpen(false)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleUpdate = (data: Parameters<typeof createRecurringTransaction>[0]) => {
    if (!editItem) return
    startTransition(async () => {
      const result = await updateRecurringTransaction(editItem.id, data)
      if (result.success) {
        toast({ title: "Gasto recurrente actualizado" })
        setEditItem(null)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleToggleActive = (id: string, activo: boolean) => {
    startTransition(async () => {
      const result = await updateRecurringTransaction(id, { activo })
      if (!result.success) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteRecurringTransaction(deleteId)
      if (result.success) {
        toast({ title: "Gasto recurrente eliminado" })
        setDeleteId(null)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Gasto mensual estimado</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCLP(totalEstimadoMensual)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-xl font-bold">{activos.length}</p>
          </div>
        </div>

        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Recurrente
        </Button>
      </div>

      {/* Lista de recurrentes activos */}
      {activos.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Activos ({activos.length})
          </h2>
          {activos.map((item) => (
            <RecurrentTransactionCard
              key={item.id}
              item={item}
              categoriaNombre={getCategoriaName(item.categoriaId)}
              onToggleActive={handleToggleActive}
              onEdit={(item) => setEditItem(item)}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Repeat className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Sin gastos recurrentes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega tus gastos fijos como arriendo, servicios o suscripciones
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Agregar primero
          </Button>
        </div>
      )}

      {/* Lista de inactivos */}
      {inactivos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Inactivos ({inactivos.length})
          </h2>
          {inactivos.map((item) => (
            <RecurrentTransactionCard
              key={item.id}
              item={item}
              categoriaNombre={getCategoriaName(item.categoriaId)}
              onToggleActive={handleToggleActive}
              onEdit={(item) => setEditItem(item)}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog - Crear */}
      <RecurrentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categorias={categorias}
        cuentas={cuentas}
        onSubmit={handleCreate}
        isLoading={isPending}
      />

      {/* Form Dialog - Editar */}
      {editItem && (
        <RecurrentForm
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          categorias={categorias}
          cuentas={cuentas}
          editItem={editItem}
          onSubmit={handleUpdate}
          isLoading={isPending}
        />
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto recurrente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
