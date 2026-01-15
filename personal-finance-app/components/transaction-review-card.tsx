'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, X, DollarSign, Tag, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Categoria } from '@/lib/types'

export interface TransactionDraft {
  amount: number
  category: string
  description: string
  type: 'expense' | 'income'
  date: string // YYYY-MM-DD
}

interface TransactionReviewCardProps {
  draft: TransactionDraft | null
  categorias: Categoria[]
  open: boolean
  onSave: (draft: TransactionDraft) => void
  onCancel: () => void
}

export function TransactionReviewCard({
  draft: initialDraft,
  categorias,
  open,
  onSave,
  onCancel,
}: TransactionReviewCardProps) {
  const [draft, setDraft] = useState<TransactionDraft | null>(initialDraft)

  // Actualizar el draft cuando cambie el initialDraft
  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  // Si no hay draft, no mostrar nada
  if (!draft) {
    return null
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover todos los caracteres que no sean números
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value === '') {
      setDraft(prev => ({ ...prev, amount: 0 }))
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setDraft(prev => ({ ...prev, amount: numValue }))
    }
  }

  // Formatear el valor para mostrar en el input (con separadores de miles)
  const formatAmountForInput = (amount: number) => {
    if (amount === 0) return ''
    return amount.toLocaleString('es-CL')
  }

  const handleCategoryChange = (value: string) => {
    setDraft(prev => ({ ...prev, category: value }))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(prev => ({ ...prev, description: e.target.value }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(prev => ({ ...prev, date: e.target.value }))
  }

  const handleSave = () => {
    if (!draft) return
    if (draft.amount <= 0) {
      return
    }
    if (!draft.category) {
      return
    }
    if (!draft.description.trim()) {
      return
    }
    onSave(draft)
  }

  const handleCancel = () => {
    onCancel()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTypeLabel = (type: string) => {
    return type === 'expense' ? 'Gasto' : 'Ingreso'
  }

  const getTypeColor = (type: string) => {
    return type === 'expense' 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-green-600 dark:text-green-400'
  }

  // Filtrar categorías según el tipo de transacción
  const availableCategorias = categorias.filter(cat => {
    if (draft.type === 'expense') {
      return cat.tipo === 'Gasto' || cat.tipo === 'Ambos'
    } else {
      return cat.tipo === 'Ingreso' || cat.tipo === 'Ambos'
    }
  })

  // Encontrar la categoría actual por ID o nombre
  const currentCategory = categorias.find(
    c => c.id === draft.category || c.nombre === draft.category
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
            Revisar Nuevo Movimiento
          </DialogTitle>
          <DialogDescription>
            Revisa y edita los datos de la transacción antes de guardarla.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
        {/* Tipo de transacción (solo lectura) */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <span className={`font-medium ${getTypeColor(draft.type)}`}>
            {getTypeLabel(draft.type)}
          </span>
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="flex items-center gap-2">
            <DollarSign className="size-4" />
            Monto
          </Label>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            value={formatAmountForInput(draft.amount)}
            onChange={handleAmountChange}
            placeholder="0"
            className="text-lg font-semibold"
          />
          {draft.amount > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(draft.amount)}
            </p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Tag className="size-4" />
            Categoría
          </Label>
          <Select
            value={currentCategory?.id || draft.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {availableCategorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  <div className="flex items-center gap-2">
                    <span>{categoria.icono}</span>
                    <span>{categoria.nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="size-4" />
            Descripción
          </Label>
          <Input
            id="description"
            type="text"
            value={draft.description}
            onChange={handleDescriptionChange}
            placeholder="Descripción del movimiento"
          />
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="size-4" />
            Fecha
          </Label>
          <Input
            id="date"
            type="date"
            value={draft.date}
            onChange={handleDateChange}
            className="w-full"
          />
        </div>

        </div>
        <DialogFooter>
          <Button
            onClick={handleCancel}
            variant="outline"
          >
            <X className="size-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={draft.amount <= 0 || !draft.category || !draft.description.trim()}
          >
            <CheckCircle2 className="size-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
