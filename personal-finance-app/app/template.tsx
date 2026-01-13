"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { DataProvider } from "@/lib/data-context"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/registro"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <DataProvider>
        <AppSidebar />
        <div className="ml-64">
          <TopBar />
          <main className="mt-16 p-6">{children}</main>
        </div>
      </DataProvider>
    </ProtectedRoute>
  )
}
