"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { parseCSV, type CSVRow } from "@/lib/utils/csv-import"
import { createMovimiento } from "@/app/actions/finance"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, AlertTriangle, Check, Loader2 } from "lucide-react"
import type { CategoriaForClient, CuentaForClient } from "@/lib/services/finance.service"
import { formatCLP } from "@/lib/utils-finance"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: CategoriaForClient[]
  cuentas: CuentaForClient[]
  onImportComplete: () => void
}

type ImportStep = "upload" | "preview" | "mapping" | "importing" | "done"

export function CSVImportDialog({
  open,
  onOpenChange,
  categorias,
  cuentas,
  onImportComplete,
}: CSVImportDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<ImportStep>("upload")
  const [rows, setRows] = useState<CSVRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [defaultCategoriaId, setDefaultCategoriaId] = useState("")
  const [defaultCuentaId, setDefaultCuentaId] = useState("")
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 })

  const reset = () => {
    setStep("upload")
    setRows([])
    setErrors([])
    setImportProgress(0)
    setImportResults({ success: 0, failed: 0 })
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const result = parseCSV(content)
      setRows(result.rows)
      setErrors(result.errors)
      setStep(result.rows.length > 0 ? "preview" : "upload")

      if (result.rows.length === 0 && result.errors.length > 0) {
        toast({
          title: "Error al leer CSV",
          description: result.errors[0],
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file, "utf-8")
  }, [toast])

  const handleImport = async () => {
    if (!defaultCuentaId) {
      toast({ title: "Selecciona una cuenta", variant: "destructive" })
      return
    }

    setStep("importing")
    let success = 0
    let failed = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const result = await createMovimiento({
          fecha: row.fecha,
          descripcion: row.descripcion,
          montoCLP: row.monto,
          tipoMovimiento: row.tipo,
          metodoPago: "Débito",
          tipoGasto: "Variable",
          estadoConciliacion: "Pendiente",
          categoriaId: defaultCategoriaId || categorias[0]?.id || "",
          cuentaId: defaultCuentaId,
        })
        if (result.success) success++
        else failed++
      } catch {
        failed++
      }
      setImportProgress(Math.round(((i + 1) / rows.length) * 100))
    }

    setImportResults({ success, failed })
    setStep("done")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Movimientos desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con tus movimientos. Se necesitan columnas: fecha, descripción, monto.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra un archivo CSV o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>Seleccionar Archivo</span>
                </Button>
              </label>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Formato esperado:</p>
              <p>fecha;descripcion;monto;tipo</p>
              <p>15/01/2026;Supermercado;-25000;Gasto</p>
              <p>01/01/2026;Sueldo;1500000;Ingreso</p>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {rows.length} movimientos detectados
              </p>
              {errors.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.length} errores
                </Badge>
              )}
            </div>

            {/* Preview table */}
            <div className="rounded-md border max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-right">Monto</th>
                    <th className="p-2 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{row.fecha}</td>
                      <td className="p-2 max-w-[200px] truncate">{row.descripcion}</td>
                      <td className="p-2 text-right font-mono">{formatCLP(row.monto)}</td>
                      <td className="p-2 text-center">
                        <Badge variant={row.tipo === "Ingreso" ? "default" : "destructive"} className="text-[10px]">
                          {row.tipo}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="p-2 text-center text-xs text-muted-foreground">
                  ... y {rows.length - 20} más
                </p>
              )}
            </div>

            {/* Mapping */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Categoría por defecto</label>
                <Select value={defaultCategoriaId} onValueChange={setDefaultCategoriaId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Cuenta destino *</label>
                <Select value={defaultCuentaId} onValueChange={setDefaultCuentaId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-1">
                <p className="font-medium text-destructive">Errores encontrados:</p>
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-muted-foreground">{e}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={!defaultCuentaId}>
                Importar {rows.length} movimientos
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Importando movimientos...</p>
            <div className="w-full max-w-xs bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold">Importación completada</p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {importResults.success} exitosos
              </span>
              {importResults.failed > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {importResults.failed} fallidos
                </span>
              )}
            </div>
            <Button
              onClick={() => {
                reset()
                onOpenChange(false)
                onImportComplete()
              }}
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
