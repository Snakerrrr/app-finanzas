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
import { useData } from "@/lib/data-context"
import { createTarjeta, updateTarjeta as updateTarjetaAction } from "@/app/actions/finance"
import type { TarjetaCredito } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface TarjetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tarjeta?: TarjetaCredito
  mode: "create" | "edit"
}

export function TarjetaDialog({ open, onOpenChange, tarjeta, mode }: TarjetaDialogProps) {
  const { refreshData } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    banco: "",
    cupoTotal: 0,
    cupoDisponible: 0,
    fechaFacturacion: 15,
    fechaPago: 10,
    tasaInteresMensual: 2.5,
    deudaActual: 0,
    deudaFacturada: 0,
    deudaNoFacturada: 0,
  })

  useEffect(() => {
    if (tarjeta && mode === "edit") {
      setFormData({
        nombre: tarjeta.nombre,
        banco: tarjeta.banco,
        cupoTotal: tarjeta.cupoTotal,
        cupoDisponible: tarjeta.cupoDisponible,
        fechaFacturacion: tarjeta.fechaFacturacion,
        fechaPago: tarjeta.fechaPago,
        tasaInteresMensual: tarjeta.tasaInteresMensual,
        deudaActual: tarjeta.deudaActual,
        deudaFacturada: tarjeta.deudaFacturada,
        deudaNoFacturada: tarjeta.deudaNoFacturada,
      })
    }
  }, [tarjeta, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.banco || formData.cupoTotal <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      setIsSubmitting(true)
      const result = await createTarjeta({
        nombre: formData.nombre.trim(),
        banco: formData.banco.trim(),
        cupoTotal: Number(formData.cupoTotal),
        cupoDisponible: Number(formData.cupoDisponible),
        fechaFacturacion: Number(formData.fechaFacturacion),
        fechaPago: Number(formData.fechaPago),
        tasaInteresMensual: Number(formData.tasaInteresMensual),
        deudaActual: Number(formData.deudaActual) || 0,
        deudaFacturada: Number(formData.deudaFacturada) || 0,
        deudaNoFacturada: Number(formData.deudaNoFacturada) || 0,
      })
      setIsSubmitting(false)

      if (result.success) {
        await refreshData()
        router.refresh()
        toast({
          title: "Tarjeta creada",
          description: "La tarjeta de crédito se ha registrado exitosamente",
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
    const result = await updateTarjetaAction(tarjeta!.id, {
      nombre: formData.nombre.trim(),
      banco: formData.banco.trim(),
      cupoTotal: Number(formData.cupoTotal),
      cupoDisponible: Number(formData.cupoDisponible),
      fechaFacturacion: Number(formData.fechaFacturacion),
      fechaPago: Number(formData.fechaPago),
      tasaInteresMensual: Number(formData.tasaInteresMensual),
      deudaActual: Number(formData.deudaActual) || 0,
      deudaFacturada: Number(formData.deudaFacturada) || 0,
      deudaNoFacturada: Number(formData.deudaNoFacturada) || 0,
    })
    setIsSubmitting(false)

    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Tarjeta actualizada",
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
      nombre: "",
      banco: "",
      cupoTotal: 0,
      cupoDisponible: 0,
      fechaFacturacion: 15,
      fechaPago: 10,
      tasaInteresMensual: 2.5,
      deudaActual: 0,
      deudaFacturada: 0,
      deudaNoFacturada: 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Agregar Tarjeta" : "Editar Tarjeta"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Registra una nueva tarjeta de crédito"
              : "Modifica los datos de la tarjeta de crédito"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Tarjeta *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Visa Santander"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="Ej: Santander"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cupoTotal">Cupo Total CLP *</Label>
              <Input
                id="cupoTotal"
                type="number"
                value={formData.cupoTotal || ""}
                onChange={(e) => setFormData({ ...formData, cupoTotal: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cupoDisponible">Cupo Disponible CLP *</Label>
              <Input
                id="cupoDisponible"
                type="number"
                value={formData.cupoDisponible || ""}
                onChange={(e) => setFormData({ ...formData, cupoDisponible: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaFacturacion">Día Facturación *</Label>
              <Input
                id="fechaFacturacion"
                type="number"
                min="1"
                max="31"
                value={formData.fechaFacturacion}
                onChange={(e) => setFormData({ ...formData, fechaFacturacion: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaPago">Día Pago *</Label>
              <Input
                id="fechaPago"
                type="number"
                min="1"
                max="31"
                value={formData.fechaPago}
                onChange={(e) => setFormData({ ...formData, fechaPago: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasaInteresMensual">Tasa Interés Mensual % *</Label>
            <Input
              id="tasaInteresMensual"
              type="number"
              step="0.1"
              value={formData.tasaInteresMensual}
              onChange={(e) => setFormData({ ...formData, tasaInteresMensual: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deudaFacturada">Deuda Facturada CLP</Label>
              <Input
                id="deudaFacturada"
                type="number"
                value={formData.deudaFacturada || ""}
                onChange={(e) => setFormData({ ...formData, deudaFacturada: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deudaNoFacturada">Deuda No Facturada CLP</Label>
              <Input
                id="deudaNoFacturada"
                type="number"
                value={formData.deudaNoFacturada || ""}
                onChange={(e) => setFormData({ ...formData, deudaNoFacturada: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deudaActual">Deuda Actual Total CLP</Label>
            <Input
              id="deudaActual"
              type="number"
              value={formData.deudaActual || ""}
              onChange={(e) => setFormData({ ...formData, deudaActual: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? (isSubmitting ? "Guardando..." : "Crear Tarjeta") : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
