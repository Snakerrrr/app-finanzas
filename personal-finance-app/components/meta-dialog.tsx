"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { useData } from "@/lib/data-context"
import type { MetaAhorro } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface MetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta?: MetaAhorro
  mode: "create" | "edit"
}

export function MetaDialog({ open, onOpenChange, meta, mode }: MetaDialogProps) {
  const { addMetaAhorro, updateMetaAhorro, cuentas } = useData()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nombre: "",
    objetivoCLP: 0,
    fechaObjetivo: "",
    aporteMensualSugerido: 0,
    acumuladoCLP: 0,
    cuentaDestinoId: "",
    estado: "Activa" as "Activa" | "Completada",
  })

  useEffect(() => {
    if (meta && mode === "edit") {
      setFormData({
        nombre: meta.nombre,
        objetivoCLP: meta.objetivoCLP,
        fechaObjetivo: meta.fechaObjetivo,
        aporteMensualSugerido: meta.aporteMensualSugerido,
        acumuladoCLP: meta.acumuladoCLP,
        cuentaDestinoId: meta.cuentaDestinoId,
        estado: meta.estado,
      })
    }
  }, [meta, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || formData.objetivoCLP <= 0 || !formData.fechaObjetivo || !formData.cuentaDestinoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      addMetaAhorro(formData)
      toast({
        title: "Meta creada",
        description: "La meta de ahorro se ha registrado exitosamente",
      })
    } else {
      updateMetaAhorro(meta!.id, formData)
      toast({
        title: "Meta actualizada",
        description: "Los cambios se han guardado correctamente",
      })
    }

    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      objetivoCLP: 0,
      fechaObjetivo: "",
      aporteMensualSugerido: 0,
      acumuladoCLP: 0,
      cuentaDestinoId: "",
      estado: "Activa",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nueva Meta de Ahorro" : "Editar Meta de Ahorro"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Crea una nueva meta de ahorro" : "Modifica los datos de la meta de ahorro"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Meta *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Fondo de Emergencia"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="objetivoCLP">Objetivo CLP *</Label>
              <Input
                id="objetivoCLP"
                type="number"
                value={formData.objetivoCLP || ""}
                onChange={(e) => setFormData({ ...formData, objetivoCLP: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acumuladoCLP">Acumulado CLP</Label>
              <Input
                id="acumuladoCLP"
                type="number"
                value={formData.acumuladoCLP || ""}
                onChange={(e) => setFormData({ ...formData, acumuladoCLP: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaObjetivo">Fecha Objetivo *</Label>
            <Input
              id="fechaObjetivo"
              type="date"
              value={formData.fechaObjetivo}
              onChange={(e) => setFormData({ ...formData, fechaObjetivo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aporteMensualSugerido">Aporte Mensual Sugerido CLP</Label>
            <Input
              id="aporteMensualSugerido"
              type="number"
              value={formData.aporteMensualSugerido || ""}
              onChange={(e) => setFormData({ ...formData, aporteMensualSugerido: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuentaDestinoId">Cuenta Destino *</Label>
            <Select
              value={formData.cuentaDestinoId}
              onValueChange={(value) => setFormData({ ...formData, cuentaDestinoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta..." />
              </SelectTrigger>
              <SelectContent>
                {cuentas
                  .filter((c) => c.activo)
                  .map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre} - {cuenta.banco}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "create" ? "Crear Meta" : "Guardar Cambios"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
