"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/** Layout genérico de página: título, subtítulo y bloque principal (tabla/contenido). Colores neutros con animate-pulse. */
export function GenericPageSkeleton() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56 rounded-md bg-muted/60 dark:bg-muted/40" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md bg-muted/50 dark:bg-muted/30" />
      </div>
      <Skeleton className="min-h-[400px] flex-1 rounded-lg bg-muted/50 dark:bg-muted/30 animate-pulse" />
    </div>
  )
}

/** Simula una tarjeta de categoría: círculo (icono) + dos líneas de texto */
export function CategoryCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

/** Simula una tarjeta de cuenta bancaria: icono + nombre + banco + badge */
export function AccountCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 shrink-0 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

/** Simula la tabla de movimientos: cabecera + filas */
export function TransactionTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="p-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="p-3 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="p-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-3 text-right">
              <Skeleton className="ml-auto h-4 w-20" />
            </th>
            <th className="p-3 w-24" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="p-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="p-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="p-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="p-3">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
              <td className="p-3 text-right">
                <Skeleton className="ml-auto h-4 w-24" />
              </td>
              <td className="p-3">
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Solo la fila de tarjetas KPI (para Suspense granular). */
export function DashboardKPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24 rounded-md bg-muted/60 dark:bg-muted/40" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-muted/60 dark:bg-muted/40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28 rounded-md bg-muted/50 dark:bg-muted/30" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Solo los bloques de gráficos (para Suspense granular). */
export function DashboardChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40 rounded-md bg-muted/60 dark:bg-muted/40" />
            <Skeleton className="h-4 w-64 max-w-full rounded-md bg-muted/50 dark:bg-muted/30" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg bg-muted/50 dark:bg-muted/30 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Solo la lista de transacciones recientes (para Suspense granular). */
export function DashboardRecentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 rounded-md bg-muted/60 dark:bg-muted/40" />
        <Skeleton className="h-4 w-36 rounded-md bg-muted/50 dark:bg-muted/30" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-[200px] rounded-md bg-muted/50 dark:bg-muted/30" />
                <Skeleton className="h-3 w-24 rounded-md bg-muted/40 dark:bg-muted/25" />
              </div>
              <Skeleton className="h-5 w-20 shrink-0 rounded-full bg-muted/50 dark:bg-muted/30" />
              <Skeleton className="h-4 w-16 shrink-0 rounded-md bg-muted/50 dark:bg-muted/30" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** Layout de carga específico del Dashboard: 3 KPIs, gráfico grande, líneas de transacciones recientes. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40 rounded-md bg-muted/60 dark:bg-muted/40" />
        <Skeleton className="h-4 w-32 rounded-md bg-muted/50 dark:bg-muted/30" />
      </div>
      <DashboardKPISkeleton />
      <DashboardChartsSkeleton />
      <div className="md:col-span-2">
        <DashboardRecentSkeleton />
      </div>
    </div>
  )
}
