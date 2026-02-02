import { cache } from "react"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getDashboardData } from "@/app/actions/finance"
import {
  DashboardHeader,
  DashboardKPISection,
  DashboardChartsSection,
  DashboardRecentSection,
} from "@/components/dashboard-client"
import {
  DashboardKPISkeleton,
  DashboardChartsSkeleton,
  DashboardRecentSkeleton,
} from "@/components/skeletons"

const getCachedDashboardData = cache(getDashboardData)

async function DashboardKPIsAsync() {
  const data = await getCachedDashboardData()
  if (!data) redirect("/login")
  return <DashboardKPISection initialData={data} />
}

async function DashboardChartsAsync() {
  const data = await getCachedDashboardData()
  if (!data) redirect("/login")
  return <DashboardChartsSection initialData={data} />
}

async function DashboardRecentAsync() {
  const data = await getCachedDashboardData()
  if (!data) redirect("/login")
  return <DashboardRecentSection initialData={data} />
}

async function DashboardHeaderAsync() {
  const data = await getCachedDashboardData()
  if (!data) redirect("/login")
  return <DashboardHeader initialData={data} />
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="space-y-2">
          <div className="h-9 w-40 animate-pulse rounded-md bg-muted/60" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted/50" />
        </div>
      }>
        <DashboardHeaderAsync />
      </Suspense>

      <Suspense fallback={<DashboardKPISkeleton />}>
        <DashboardKPIsAsync />
      </Suspense>

      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardChartsAsync />
      </Suspense>

      <Suspense fallback={<DashboardRecentSkeleton />}>
        <DashboardRecentAsync />
      </Suspense>
    </div>
  )
}
