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
import { createCuenta, updateCuenta as updateCuentaAction } from "@/app/actions/finance"
import type { Cuenta } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface CuentaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuenta?: Cuenta
  mode: "create" | "edit"
}

export function CuentaDialog({ open, onOpenChange, cuenta, mode }: CuentaDialogProps) {
  const { refreshData } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    banco: "",
    saldoInicialMes: 0,
    saldoFinalMesDeclarado: undefined as number | undefined,
    activo: true,
  })

  useEffect(() => {
    if (cuenta && mode === "edit") {
      setFormData({
        nombre: cuenta.nombre,
        banco: cuenta.banco,
        saldoInicialMes: cuenta.saldoInicialMes,
        saldoFinalMesDeclarado: cuenta.saldoFinalMesDeclarado,
        activo: cuenta.activo,
      })
    }
  }, [cuenta, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.banco.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      setIsSubmitting(true)
      const result = await createCuenta({
        nombre: formData.nombre.trim(),
        banco: formData.banco.trim(),
        saldoInicialMes: Number(formData.saldoInicialMes) || 0,
      })
      setIsSubmitting(false)

      if (result.success) {
        await refreshData()
        router.refresh()
        toast({
          title: "Cuenta creada",
          description: "La cuenta se ha guardado en la base de datos",
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
    const result = await updateCuentaAction(cuenta!.id, {
      nombre: formData.nombre.trim(),
      banco: formData.banco.trim(),
      saldoInicialMes: Number(formData.saldoInicialMes) || 0,
      saldoFinalMesDeclarado: formData.saldoFinalMesDeclarado ?? null,
      activo: formData.activo,
    })
    setIsSubmitting(false)

    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Cuenta actualizada",
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
      saldoInicialMes: 0,
      saldoFinalMesDeclarado: undefined,
      activo: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nueva Cuenta" : "Editar Cuenta"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Registra una nueva cuenta bancaria" : "Modifica los datos de la cuenta"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Cuenta *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Cuenta Corriente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="Ej: Banco de Chile"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldoInicialMes">Saldo Inicial del Mes CLP</Label>
            <Input
              id="saldoInicialMes"
              type="number"
              value={formData.saldoInicialMes || ""}
              onChange={(e) => setFormData({ ...formData, saldoInicialMes: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldoFinalMesDeclarado">Saldo Final del Mes Declarado CLP (opcional)</Label>
            <Input
              id="saldoFinalMesDeclarado"
              type="number"
              value={formData.saldoFinalMesDeclarado || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  saldoFinalMesDeclarado: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="activo">Cuenta Activa</Label>
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? (isSubmitting ? "Guardando..." : "Crear Cuenta") : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
