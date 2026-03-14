"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  Target,
  CheckCircle2,
  Settings,
  FolderKanban,
  TrendingUp,
  Repeat,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/recurrentes", label: "Gastos Recurrentes", icon: Repeat },
  { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
  { href: "/tarjetas", label: "Tarjetas de Crédito", icon: CreditCard },
  { href: "/metas", label: "Metas de Ahorro", icon: Target },
  { href: "/conciliacion", label: "Conciliación Mensual", icon: CheckCircle2 },
  { href: "/familia", label: "Grupo Familiar", icon: Users },
  { href: "/categorias", label: "Categorías & Cuentas", icon: FolderKanban },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar shadow-sm transition-all duration-300 ease-in-out z-20",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border bg-gradient-to-r from-primary/5 to-transparent">
          {collapsed ? (
            <div className="flex w-full justify-center">
              <button
                onClick={toggle}
                className="rounded-lg p-2 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title="Expandir sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary p-1.5">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground">FinanzasCL</h1>
              </div>
              <button
                onClick={toggle}
                className="rounded-lg p-2 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title="Colapsar sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("space-y-1 transition-all duration-300", collapsed ? "p-2" : "p-4")}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.01]",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "truncate transition-all duration-300",
                    collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      </aside>
    </TooltipProvider>
  )
}
