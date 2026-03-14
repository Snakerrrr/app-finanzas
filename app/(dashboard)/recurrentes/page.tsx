"use client"

import { useData } from "@/lib/data-context"
import { RecurrentesClient } from "@/components/recurrentes/recurrentes-client"

export default function RecurrentesPage() {
  const { categorias, cuentas, recurrentes } = useData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gastos Recurrentes</h1>
        <p className="text-muted-foreground">Gestiona tus gastos que se repiten periódicamente</p>
      </div>

      <RecurrentesClient
        recurrentes={recurrentes}
        categorias={categorias}
        cuentas={cuentas}
      />
    </div>
  )
}
