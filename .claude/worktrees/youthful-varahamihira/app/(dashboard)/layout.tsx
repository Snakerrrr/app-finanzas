import type { ReactNode } from "react"

/**
 * Layout del grupo de rutas (dashboard). No añade segmento a la URL.
 * loading.tsx en este nivel se muestra al navegar entre páginas hermanas.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
