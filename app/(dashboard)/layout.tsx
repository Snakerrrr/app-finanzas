import type { ReactNode } from "react"
import { FloatingActionButton } from "@/components/floating-action-button"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"

/**
 * Layout del grupo de rutas (dashboard). No añade segmento a la URL.
 * loading.tsx en este nivel se muestra al navegar entre páginas hermanas.
 * Incluye el FAB (Floating Action Button) para agregar transacciones rápidamente.
 * Incluye el Onboarding interactivo para nuevos usuarios.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OnboardingWrapper />
      {children}
      {/* FAB Global para agregar transacciones */}
      <FloatingActionButton />
    </>
  )
}
