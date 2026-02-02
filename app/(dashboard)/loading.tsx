import { GenericPageSkeleton } from "@/components/skeletons"

/**
 * Loading UI para todas las rutas del grupo (dashboard).
 * Se muestra automáticamente al navegar entre páginas hermanas (ej: Movimientos → Presupuestos).
 */
export default function DashboardLoading() {
  return <GenericPageSkeleton />
}
