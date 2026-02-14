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
} from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
  { href: "/tarjetas", label: "Tarjetas de Crédito", icon: CreditCard },
  { href: "/metas", label: "Metas de Ahorro", icon: Target },
  { href: "/conciliacion", label: "Conciliación Mensual", icon: CheckCircle2 },
  { href: "/categorias", label: "Categorías & Cuentas", icon: FolderKanban },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border bg-sidebar shadow-sm">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1.5">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">FinanzasCL</h1>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.01]",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </aside>
  )
}
