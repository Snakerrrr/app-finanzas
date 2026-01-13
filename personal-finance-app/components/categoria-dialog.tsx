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
import type { Categoria, TipoCategoria } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface CategoriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria?: Categoria
  mode: "create" | "edit"
}

export function CategoriaDialog({ open, onOpenChange, categoria, mode }: CategoriaDialogProps) {
  const { addCategoria, updateCategoria } = useData()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "Gasto" as TipoCategoria,
    color: "#3b82f6",
    icono: "DollarSign",
  })

  useEffect(() => {
    if (categoria && mode === "edit") {
      setFormData({
        nombre: categoria.nombre,
        tipo: categoria.tipo,
        color: categoria.color,
        icono: categoria.icono,
      })
    }
  }, [categoria, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      addCategoria(formData)
      toast({
        title: "Categoría creada",
        description: "La categoría se ha registrado exitosamente",
      })
    } else {
      updateCategoria(categoria!.id, formData)
      toast({
        title: "Categoría actualizada",
        description: "Los cambios se han guardado correctamente",
      })
    }

    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "Gasto",
      color: "#3b82f6",
      icono: "DollarSign",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nueva Categoría" : "Editar Categoría"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Crea una nueva categoría" : "Modifica los datos de la categoría"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Supermercado"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoCategoria) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasto">Gasto</SelectItem>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20"
                required
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icono">Icono (nombre)</Label>
            <Input
              id="icono"
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              placeholder="Ej: ShoppingCart"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "create" ? "Crear Categoría" : "Guardar Cambios"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
