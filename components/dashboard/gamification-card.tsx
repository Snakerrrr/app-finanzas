"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Star, Medal } from "lucide-react"
import { motion } from "framer-motion"
import type { GamificationStats } from "@/lib/services/gamification.service"
import { formatCLP } from "@/lib/utils-finance"

interface GamificationCardProps {
  stats: GamificationStats
}

const LEVEL_COLORS: Record<string, string> = {
  Bronce: "#cd7f32",
  Plata: "#c0c0c0",
  Oro: "#ffd700",
  Platino: "#e5e4e2",
}

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  Bronce: <Medal className="h-5 w-5" />,
  Plata: <Medal className="h-5 w-5" />,
  Oro: <Star className="h-5 w-5" />,
  Platino: <Trophy className="h-5 w-5" />,
}

export function GamificationCard({ stats }: GamificationCardProps) {
  const levelColor = LEVEL_COLORS[stats.nivelGamificacion] ?? "#cd7f32"

  return (
    <Card className="border-2" style={{ borderColor: levelColor + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: levelColor }} />
            Tu Progreso
          </CardTitle>
          <Badge
            variant="outline"
            className="gap-1 font-semibold"
            style={{ borderColor: levelColor, color: levelColor }}
          >
            {LEVEL_ICONS[stats.nivelGamificacion]}
            {stats.nivelGamificacion}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak */}
        <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              <Flame className="h-8 w-8 text-orange-500" />
            </motion.div>
            <div>
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">días de racha</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{stats.longestStreak}</p>
            <p className="text-xs text-muted-foreground">mejor racha</p>
          </div>
        </div>

        {/* Ahorro total */}
        <div className="text-center rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Ahorrado</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCLP(stats.totalAhorrado)}
          </p>
        </div>

        {/* Logros recientes */}
        {stats.achievements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Logros ({stats.achievements.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.slice(0, 6).map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                    !achievement.visto ? "bg-primary/10 border-primary" : "bg-muted/40"
                  }`}
                >
                  <span className="text-base">{achievement.icono}</span>
                  <span className="font-medium">{achievement.titulo}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
