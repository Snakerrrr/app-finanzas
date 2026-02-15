"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RecurringForClient } from "@/lib/services/recurring.service"
import type { CategoriaForClient, CuentaForClient } from "@/lib/services/finance.service"

interface RecurrentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: CategoriaForClient[]
  cuentas: CuentaForClient[]
  editItem?: RecurringForClient | null
  onSubmit: (data: {
    descripcion: string
    montoCLP: number
    frecuencia: string
    diaMes?: number | null
    categoriaId: string
    cuentaOrigenId?: string | null
    activo: boolean
    autoCrear: boolean
    proximaFecha: string
  }) => void
  isLoading?: boolean
}

export function RecurrentForm({
  open,
  onOpenChange,
  categorias,
  cuentas,
  editItem,
  onSubmit,
  isLoading = false,
}: RecurrentFormProps) {
  const [descripcion, setDescripcion] = useState(editItem?.descripcion ?? "")
  const [montoCLP, setMontoCLP] = useState(editItem?.montoCLP?.toString() ?? "")
  const [frecuencia, setFrecuencia] = useState(editItem?.frecuencia ?? "mensual")
  const [diaMes, setDiaMes] = useState(editItem?.diaMes?.toString() ?? "")
  const [categoriaId, setCategoriaId] = useState(editItem?.categoriaId ?? "")
  const [cuentaOrigenId, setCuentaOrigenId] = useState(editItem?.cuentaOrigenId ?? "none")
  const [activo, setActivo] = useState(editItem?.activo ?? true)
  const [autoCrear, setAutoCrear] = useState(editItem?.autoCrear ?? false)
  const [proximaFecha, setProximaFecha] = useState(
    editItem?.proximaFecha ?? new Date().toISOString().slice(0, 10)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      descripcion,
      montoCLP: parseFloat(montoCLP),
      frecuencia,
      diaMes: frecuencia === "mensual" && diaMes ? parseInt(diaMes) : null,
      categoriaId,
      cuentaOrigenId: cuentaOrigenId === "none" ? null : cuentaOrigenId || null,
      activo,
      autoCrear,
      proximaFecha,
    })
  }

  const categoriasGasto = categorias.filter((c) => c.tipo === "Gasto" || c.tipo === "Ambos")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Editar" : "Nuevo"} Gasto Recurrente</DialogTitle>
          <DialogDescription>
            {editItem
              ? "Modifica los datos del gasto recurrente"
              : "Configura un gasto que se repite periódicamente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Ej: Arriendo, Netflix, Gimnasio..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto (CLP)</Label>
            <Input
              id="monto"
              type="number"
              placeholder="0"
              min="1"
              value={montoCLP}
              onChange={(e) => setMontoCLP(e.target.value)}
              required
            />
          </div>

          {/* Frecuencia */}
          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Select value={frecuencia} onValueChange={setFrecuencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Día del mes (solo para mensual) */}
          {frecuencia === "mensual" && (
            <div className="space-y-2">
              <Label htmlFor="diaMes">Día del mes</Label>
              <Input
                id="diaMes"
                type="number"
                placeholder="1-31"
                min="1"
                max="31"
                value={diaMes}
                onChange={(e) => setDiaMes(e.target.value)}
              />
            </div>
          )}

          {/* Categoría */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriasGasto.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cuenta */}
          <div className="space-y-2">
            <Label>Cuenta (opcional)</Label>
            <Select value={cuentaOrigenId} onValueChange={setCuentaOrigenId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cuenta específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cuenta</SelectItem>
                {cuentas.filter((c) => c.activo).map((cuenta) => (
                  <SelectItem key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} - {cuenta.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Próxima fecha */}
          <div className="space-y-2">
            <Label htmlFor="proximaFecha">Próxima fecha</Label>
            <Input
              id="proximaFecha"
              type="date"
              value={proximaFecha}
              onChange={(e) => setProximaFecha(e.target.value)}
              required
            />
          </div>

          {/* Switches */}
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="activo" className="text-sm">Activo</Label>
                <p className="text-xs text-muted-foreground">Recibir recordatorios</p>
              </div>
              <Switch id="activo" checked={activo} onCheckedChange={setActivo} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoCrear" className="text-sm">Auto-crear transacción</Label>
                <p className="text-xs text-muted-foreground">Crear movimiento automáticamente</p>
              </div>
              <Switch id="autoCrear" checked={autoCrear} onCheckedChange={setAutoCrear} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !descripcion || !montoCLP || !categoriaId}>
              {isLoading ? "Guardando..." : editItem ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
