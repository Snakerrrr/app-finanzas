"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { DataProvider } from "@/lib/data-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { FloatingActionButton } from "@/components/floating-action-button"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { DashboardContent } from "@/components/dashboard-content-wrapper"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <SidebarProvider>
          <AppSidebar />
          <DashboardContent>
            <TopBar />
            <main className="mt-16 p-6">
              <OnboardingWrapper />
              {children}
              <FloatingActionButton />
            </main>
          </DashboardContent>
        </SidebarProvider>
      </DataProvider>
    </ProtectedRoute>
  )
}
