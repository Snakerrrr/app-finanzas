"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1, type: "spring" }}
        className="rounded-full bg-muted p-4 mb-4"
      >
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </motion.div>

      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
