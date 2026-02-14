import { cache } from "react"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getDashboardData } from "@/app/actions/finance"
import { DashboardClient } from "@/components/dashboard-client"
import {
  DashboardKPISkeleton,
  DashboardChartsSkeleton,
  DashboardRecentSkeleton,
} from "@/components/skeletons"

const getCachedDashboardData = cache(getDashboardData)

/**
 * Solo carga los datos financieros críticos (1 query batch).
 * Alertas, gamificación y tips se cargan lazy en el cliente.
 */
async function DashboardAsync() {
  const data = await getCachedDashboardData()
  if (!data) redirect("/login")

  return <DashboardClient initialData={data} />
}

export default async function DashboardPage() {
  return (
    <Suspense 
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-9 w-40 animate-pulse rounded-md bg-muted/60" />
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted/50" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted/60" />
          </div>
          <DashboardKPISkeleton />
          <DashboardChartsSkeleton />
          <DashboardRecentSkeleton />
        </div>
      }
    >
      <DashboardAsync />
    </Suspense>
  )
}
