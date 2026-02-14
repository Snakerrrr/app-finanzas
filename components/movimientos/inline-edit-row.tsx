"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X } from "lucide-react"
import type { Movimiento } from "@/lib/types"
import type { CategoriaForClient } from "@/lib/services/finance.service"
import { updateMovimiento } from "@/app/actions/finance"
import { useToast } from "@/hooks/use-toast"

interface InlineEditRowProps {
  movimiento: Movimiento
  categorias: CategoriaForClient[]
  onSave: () => void
  onCancel: () => void
}

export function InlineEditRow({ movimiento, categorias, onSave, onCancel }: InlineEditRowProps) {
  const { toast } = useToast()
  const [descripcion, setDescripcion] = useState(movimiento.descripcion)
  const [monto, setMonto] = useState(movimiento.montoCLP.toString())
  const [categoriaId, setCategoriaId] = useState(movimiento.categoriaId)
  const [fecha, setFecha] = useState(movimiento.fecha)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateMovimiento(movimiento.id, {
        descripcion,
        montoCLP: parseFloat(monto),
        categoriaId,
        fecha,
      })
      if (result.success) {
        toast({ title: "Movimiento actualizado", description: "Los cambios se guardaron correctamente" })
        onSave()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") onCancel()
  }

  return (
    <tr className="border-b bg-primary/5">
      <td className="p-2">
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-8 text-xs"
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-2">
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="h-8 text-xs"
          autoFocus
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-2">
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2 text-xs text-muted-foreground" colSpan={2}>
        {movimiento.tipoMovimiento} · {movimiento.metodoPago}
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="h-8 text-xs text-right"
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-2" />
      <td className="p-2">
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave} disabled={saving}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
