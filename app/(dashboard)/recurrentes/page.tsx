"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { getRecurringTransactions } from "@/app/actions/recurring"
import { RecurrentesClient } from "@/components/recurrentes/recurrentes-client"
import type { RecurringForClient } from "@/lib/services/recurring.service"

export default function RecurrentesPage() {
  const { categorias, cuentas } = useData()
  const [recurrentes, setRecurrentes] = useState<RecurringForClient[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getRecurringTransactions().then((data) => {
      setRecurrentes(data)
      setLoaded(true)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gastos Recurrentes</h1>
        <p className="text-muted-foreground">Gestiona tus gastos que se repiten periódicamente</p>
      </div>

      {!loaded ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      ) : (
        <RecurrentesClient
          recurrentes={recurrentes}
          categorias={categorias}
          cuentas={cuentas}
        />
      )}
    </div>
  )
}
