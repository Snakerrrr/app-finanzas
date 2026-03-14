"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { DataProvider } from "@/lib/data-context"
import { FloatingActionButton } from "@/components/floating-action-button"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <AppSidebar />
        <div className="ml-64">
          <TopBar />
          <main className="mt-16 p-6">
            <OnboardingWrapper />
            {children}
            <FloatingActionButton />
          </main>
        </div>
      </DataProvider>
    </ProtectedRoute>
  )
}
