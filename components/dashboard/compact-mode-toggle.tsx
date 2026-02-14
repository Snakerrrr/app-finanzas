"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CompactModeToggleProps {
  isCompact: boolean
  onToggle: (isCompact: boolean) => void
}

export function CompactModeToggle({ isCompact, onToggle }: CompactModeToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggle(!isCompact)}
      className="gap-2"
    >
      {isCompact ? (
        <>
          Ver más
          <ChevronDown className="h-4 w-4" />
        </>
      ) : (
        <>
          Ver menos
          <ChevronUp className="h-4 w-4" />
        </>
      )}
    </Button>
  )
}

/**
 * Hook para manejar el estado del modo compacto con persistencia en localStorage
 */
export function useCompactMode(defaultValue = false) {
  const [isCompact, setIsCompact] = useState(defaultValue)
  const [mounted, setMounted] = useState(false)

  // Cargar preferencia desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem("dashboard-compact-mode")
    if (stored !== null) {
      setIsCompact(stored === "true")
    }
    setMounted(true)
  }, [])

  // Guardar preferencia en localStorage cuando cambie
  const toggleCompact = (value: boolean) => {
    setIsCompact(value)
    localStorage.setItem("dashboard-compact-mode", String(value))
  }

  return {
    isCompact: mounted ? isCompact : defaultValue,
    setIsCompact: toggleCompact,
    mounted,
  }
}
