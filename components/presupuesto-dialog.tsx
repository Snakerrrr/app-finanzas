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
import { useData } from "@/lib/data-context"
import { createPresupuesto } from "@/app/actions/finance"
import type { Presupuesto } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface PresupuestoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presupuesto?: Presupuesto
  mode: "create" | "edit"
}

export function PresupuestoDialog({ open, onOpenChange, presupuesto, mode }: PresupuestoDialogProps) {
  const { updatePresupuesto, refreshData, categorias } = useData()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    categoriaId: "",
    mes: new Date().toISOString().slice(0, 7),
    montoPresupuestadoCLP: 0,
  })

  useEffect(() => {
    if (presupuesto && mode === "edit") {
      setFormData({
        categoriaId: presupuesto.categoriaId,
        mes: presupuesto.mes,
        montoPresupuestadoCLP: presupuesto.montoPresupuestadoCLP,
      })
    }
  }, [presupuesto, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoriaId || formData.montoPresupuestadoCLP < 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos correctamente",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      setIsSubmitting(true)
      const result = await createPresupuesto({
        categoriaId: formData.categoriaId,
        mes: formData.mes,
        montoPresupuestadoCLP: Number(formData.montoPresupuestadoCLP),
      })
      setIsSubmitting(false)

      if (result.success) {
        await refreshData()
        router.refresh()
        toast({
          title: "Presupuesto creado",
          description: "El presupuesto se ha guardado en la base de datos",
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

    updatePresupuesto(presupuesto!.id, formData)
    toast({
      title: "Presupuesto actualizado",
      description: "Los cambios se han guardado correctamente",
    })
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      categoriaId: "",
      mes: new Date().toISOString().slice(0, 7),
      montoPresupuestadoCLP: 0,
    })
  }

  // Filtrar solo categorías de gasto
  const categoriasGasto = categorias.filter((cat) => cat.tipo === "Gasto" || cat.tipo === "Ambos")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Crear Presupuesto" : "Editar Presupuesto"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Define un nuevo presupuesto para una categoría" : "Modifica el presupuesto existente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoriaId">Categoría *</Label>
            <Select
              value={formData.categoriaId}
              onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categoriasGasto.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mes">Mes *</Label>
            <Input
              id="mes"
              type="month"
              value={formData.mes}
              onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
              disabled={mode === "edit"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoPresupuestadoCLP">Monto Presupuestado CLP *</Label>
            <Input
              id="montoPresupuestadoCLP"
              type="number"
              value={formData.montoPresupuestadoCLP || ""}
              onChange={(e) => setFormData({ ...formData, montoPresupuestadoCLP: Number(e.target.value) })}
              placeholder="0"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? (isSubmitting ? "Guardando..." : "Crear Presupuesto") : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
