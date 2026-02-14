"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { exportMovimientosCSV, exportMovimientosPDF } from "@/lib/utils/export"
import type { MovimientoForClient, CategoriaForClient } from "@/lib/services/finance.service"

interface ExportButtonsProps {
  movimientos: MovimientoForClient[]
  categorias: CategoriaForClient[]
  titulo?: string
}

export function ExportButtons({ movimientos, categorias, titulo }: ExportButtonsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportMovimientosCSV(movimientos, categorias)}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportMovimientosPDF(movimientos, categorias, titulo)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
