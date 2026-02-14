"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"
import type { TipForClient } from "@/lib/services/tips.service"

interface DailyTipCardProps {
  tip: TipForClient
}

const CATEGORY_COLORS: Record<string, string> = {
  Presupuesto: "border-l-blue-500",
  Ahorro: "border-l-green-500",
  Deuda: "border-l-red-500",
  "Hábitos": "border-l-purple-500",
  "Inversión": "border-l-amber-500",
}

export function DailyTipCard({ tip }: DailyTipCardProps) {
  return (
    <Card className={`border-l-4 ${CATEGORY_COLORS[tip.categoria] ?? "border-l-primary"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 shrink-0">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{tip.titulo}</p>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {tip.categoria}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.contenido}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
