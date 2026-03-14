"use client"

import type { ReactNode } from "react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export function DashboardContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        collapsed ? "ml-[68px]" : "ml-64"
      )}
    >
      {children}
    </div>
  )
}
