"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useData } from "@/lib/data-context"
import { createMovimiento, updateMovimiento as updateMovimientoAction } from "@/app/actions/finance"
import type { Movimiento, TipoMovimiento, MetodoPago, TipoGasto } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface MovimientoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movimiento?: Movimiento
  mode: "create" | "edit"
}

export function MovimientoDialog({ open, onOpenChange, movimiento, mode }: MovimientoDialogProps) {
  const { refreshData, categorias, cuentas, tarjetasCredito } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuickMode, setIsQuickMode] = useState(mode === "create")

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    tipoMovimiento: "Gasto" as TipoMovimiento,
    categoriaId: "",
    subcategoria: "",
    tipoGasto: "Variable" as TipoGasto,
    cuentaOrigenId: "",
    cuentaDestinoId: "",
    tarjetaCreditoId: "",
    metodoPago: "Débito" as MetodoPago,
    montoCLP: 0,
    cuotas: 1,
    notas: "",
    estadoConciliacion: "Pendiente" as "Pendiente" | "Conciliado",
    mesConciliacion: new Date().toISOString().slice(0, 7),
  })

  useEffect(() => {
    if (movimiento && mode === "edit") {
      setFormData({
        fecha: movimiento.fecha,
        descripcion: movimiento.descripcion,
        tipoMovimiento: movimiento.tipoMovimiento,
        categoriaId: movimiento.categoriaId,
        subcategoria: movimiento.subcategoria || "",
        tipoGasto: movimiento.tipoGasto || "Variable",
        cuentaOrigenId: movimiento.cuentaOrigenId || "",
        cuentaDestinoId: movimiento.cuentaDestinoId || "",
        tarjetaCreditoId: movimiento.tarjetaCreditoId || "",
        metodoPago: movimiento.metodoPago,
        montoCLP: movimiento.montoCLP,
        cuotas: movimiento.cuotas || 1,
        notas: movimiento.notas || "",
        estadoConciliacion: movimiento.estadoConciliacion,
        mesConciliacion: movimiento.mesConciliacion,
      })
    }
  }, [movimiento, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion || !formData.categoriaId || formData.montoCLP <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const movimientoData = {
      ...formData,
      subcategoria: formData.subcategoria || undefined,
      tipoGasto: formData.tipoMovimiento === "Gasto" ? formData.tipoGasto : undefined,
      cuentaOrigenId: formData.cuentaOrigenId || undefined,
      cuentaDestinoId: formData.cuentaDestinoId || undefined,
      tarjetaCreditoId: formData.tarjetaCreditoId || undefined,
      cuotas: formData.cuotas > 1 ? formData.cuotas : undefined,
      notas: formData.notas || undefined,
    }

    if (mode === "create") {
      setIsSubmitting(true)
      const result = await createMovimiento(movimientoData)
      setIsSubmitting(false)
      if (result.success) {
        await refreshData()
        router.refresh()
        toast({
          title: "Movimiento creado",
          description: "El movimiento se ha registrado exitosamente",
        })
        onOpenChange(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
      return
    }

    setIsSubmitting(true)
    const result = await updateMovimientoAction(movimiento!.id, {
      fecha: movimientoData.fecha,
      descripcion: movimientoData.descripcion,
      tipoMovimiento: movimientoData.tipoMovimiento,
      categoriaId: movimientoData.categoriaId,
      subcategoria: movimientoData.subcategoria || null,
      tipoGasto: movimientoData.tipoGasto || null,
      metodoPago: movimientoData.metodoPago,
      montoCLP: movimientoData.montoCLP,
      cuotas: movimientoData.cuotas || null,
      notas: movimientoData.notas || null,
      estadoConciliacion: formData.estadoConciliacion,
      mesConciliacion: movimientoData.mesConciliacion,
      cuentaOrigenId: movimientoData.cuentaOrigenId || null,
      cuentaDestinoId: movimientoData.cuentaDestinoId || null,
      tarjetaCreditoId: movimientoData.tarjetaCreditoId || null,
    })
    setIsSubmitting(false)

    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Movimiento actualizado",
        description: "Los cambios se han guardado correctamente",
      })
      onOpenChange(false)
      resetForm()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      tipoMovimiento: "Gasto",
      categoriaId: "",
      subcategoria: "",
      tipoGasto: "Variable",
      cuentaOrigenId: "",
      cuentaDestinoId: "",
      tarjetaCreditoId: "",
      metodoPago: "Débito",
      montoCLP: 0,
      cuotas: 1,
      notas: "",
      estadoConciliacion: "Pendiente",
      mesConciliacion: new Date().toISOString().slice(0, 7),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Agregar Movimiento" : "Editar Movimiento"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Registra un nuevo movimiento financiero" : "Modifica los datos del movimiento"}
          </DialogDescription>
        </DialogHeader>

        {/* Toggle Modo Rápido / Completo */}
        {mode === "create" && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
            <button
              type="button"
              onClick={() => setIsQuickMode(true)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isQuickMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rápido
            </button>
            <button
              type="button"
              onClick={() => setIsQuickMode(false)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                !isQuickMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoMovimiento">Tipo *</Label>
              <Select
                value={formData.tipoMovimiento}
                onValueChange={(value: TipoMovimiento) => setFormData({ ...formData, tipoMovimiento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Ej: Supermercado Jumbo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoría *</Label>
              <Select
                value={formData.categoriaId}
                onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter(
                      (cat) =>
                        cat.tipo === "Ambos" ||
                        (formData.tipoMovimiento === "Ingreso" && cat.tipo === "Ingreso") ||
                        (formData.tipoMovimiento === "Gasto" && cat.tipo === "Gasto"),
                    )
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tipoMovimiento === "Gasto" && (
              <div className="space-y-2">
                <Label htmlFor="tipoGasto">Tipo de Gasto</Label>
                <Select
                  value={formData.tipoGasto}
                  onValueChange={(value: TipoGasto) => setFormData({ ...formData, tipoGasto: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                    <SelectItem value="Ocasional">Ocasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de Pago *</Label>
              <Select
                value={formData.metodoPago}
                onValueChange={(value: MetodoPago) => setFormData({ ...formData, metodoPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Débito">Débito</SelectItem>
                  <SelectItem value="Crédito">Crédito</SelectItem>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montoCLP">Monto CLP *</Label>
              <Input
                id="montoCLP"
                type="number"
                value={formData.montoCLP || ""}
                onChange={(e) => setFormData({ ...formData, montoCLP: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* --- Campos avanzados (solo en modo completo o edición) --- */}
          {(!isQuickMode || mode === "edit") && (
            <>
              {formData.metodoPago === "Crédito" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tarjetaCreditoId">Tarjeta de Crédito</Label>
                    <Select
                      value={formData.tarjetaCreditoId}
                      onValueChange={(value) => setFormData({ ...formData, tarjetaCreditoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tarjetasCredito.map((tc) => (
                          <SelectItem key={tc.id} value={tc.id}>
                            {tc.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuotas">Cuotas</Label>
                    <Input
                      id="cuotas"
                      type="number"
                      min="1"
                      value={formData.cuotas}
                      onChange={(e) => setFormData({ ...formData, cuotas: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {(formData.metodoPago === "Débito" || formData.metodoPago === "Efectivo") && (
                <div className="space-y-2">
                  <Label htmlFor="cuentaOrigenId">Cuenta Origen</Label>
                  <Select
                    value={formData.cuentaOrigenId}
                    onValueChange={(value) => setFormData({ ...formData, cuentaOrigenId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas
                        .filter((c) => c.activo)
                        .map((cuenta) => (
                          <SelectItem key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tipoMovimiento === "Transferencia" && (
                <div className="space-y-2">
                  <Label htmlFor="cuentaDestinoId">Cuenta Destino</Label>
                  <Select
                    value={formData.cuentaDestinoId}
                    onValueChange={(value) => setFormData({ ...formData, cuentaDestinoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas
                        .filter((c) => c.activo)
                        .map((cuenta) => (
                          <SelectItem key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales (opcional)"
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? (isSubmitting ? "Guardando..." : "Crear Movimiento") : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
