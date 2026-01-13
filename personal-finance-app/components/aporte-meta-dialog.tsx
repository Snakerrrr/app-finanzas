"use client"

import type React from "react"
import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"

interface AporteMetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metaId: string
  metaNombre: string
}

export function AporteMetaDialog({ open, onOpenChange, metaId, metaNombre }: AporteMetaDialogProps) {
  const { agregarAporteMeta } = useData()
  const { toast } = useToast()
  const [monto, setMonto] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (monto <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    agregarAporteMeta(metaId, monto)
    toast({
      title: "Aporte registrado",
      description: `Se ha agregado ${monto.toLocaleString("es-CL")} CLP a ${metaNombre}`,
    })

    onOpenChange(false)
    setMonto(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Aportar a Meta</DialogTitle>
          <DialogDescription>Registra un aporte a: {metaNombre}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto CLP *</Label>
            <Input
              id="monto"
              type="number"
              value={monto || ""}
              onChange={(e) => setMonto(Number(e.target.value))}
              placeholder="0"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Aporte</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
