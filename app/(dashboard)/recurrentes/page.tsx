import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getRecurringTransactions } from "@/app/actions/recurring"
import { getDashboardData } from "@/app/actions/finance"
import { RecurrentesClient } from "@/components/recurrentes/recurrentes-client"

async function RecurrentesContent() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [recurrentes, dashboardData] = await Promise.all([
    getRecurringTransactions(),
    getDashboardData(),
  ])

  if (!dashboardData) redirect("/login")

  return (
    <RecurrentesClient
      recurrentes={recurrentes}
      categorias={dashboardData.categorias}
      cuentas={dashboardData.cuentas}
    />
  )
}

export default function RecurrentesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gastos Recurrentes</h1>
        <p className="text-muted-foreground">Gestiona tus gastos que se repiten periódicamente</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/60" />
            ))}
          </div>
        }
      >
        <RecurrentesContent />
      </Suspense>
    </div>
  )
}
