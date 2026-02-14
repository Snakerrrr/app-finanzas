"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { formatCLP } from "@/lib/utils-finance"
import { Calendar, Repeat, Trash2, Edit, AlertCircle } from "lucide-react"
import type { RecurringForClient } from "@/lib/services/recurring.service"

interface RecurrentTransactionCardProps {
  item: RecurringForClient
  categoriaNombre?: string
  onToggleActive: (id: string, activo: boolean) => void
  onEdit: (item: RecurringForClient) => void
  onDelete: (id: string) => void
}

function getFrecuenciaLabel(frecuencia: string): string {
  switch (frecuencia) {
    case "semanal": return "Semanal"
    case "quincenal": return "Quincenal"
    case "mensual": return "Mensual"
    default: return frecuencia
  }
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function RecurrentTransactionCard({
  item,
  categoriaNombre,
  onToggleActive,
  onEdit,
  onDelete,
}: RecurrentTransactionCardProps) {
  const diasRestantes = getDaysUntil(item.proximaFecha)
  const esProximo = diasRestantes <= 3 && diasRestantes >= 0
  const esVencido = diasRestantes < 0

  return (
    <Card className={`transition-all ${!item.activo ? "opacity-60" : ""} ${esProximo ? "border-amber-400 dark:border-amber-500" : ""} ${esVencido ? "border-red-400 dark:border-red-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info principal */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{item.descripcion}</h3>
              {esProximo && (
                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs shrink-0">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Próximo
                </Badge>
              )}
              {esVencido && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  Vencido
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {getFrecuenciaLabel(item.frecuencia)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {item.proximaFecha}
              </span>
              {categoriaNombre && (
                <Badge variant="secondary" className="text-xs">
                  {categoriaNombre}
                </Badge>
              )}
            </div>

            {item.autoCrear && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                Auto-crear
              </Badge>
            )}
          </div>

          {/* Monto y acciones */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              -{formatCLP(item.montoCLP)}
            </p>

            <div className="flex items-center gap-2">
              <Switch
                checked={item.activo}
                onCheckedChange={(checked) => onToggleActive(item.id, checked)}
                className="scale-75"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
