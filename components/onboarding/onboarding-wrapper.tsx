"use client"

import { useState, useEffect } from "react"
import { OnboardingWizard } from "./onboarding-wizard"

/**
 * Wrapper que muestra el onboarding solo si el usuario no lo ha completado.
 * Usa localStorage para persistir el estado.
 */
export function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem("onboarding-completed")
    if (!completed) {
      setShowOnboarding(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem("onboarding-completed", "true")
    setShowOnboarding(false)
  }

  if (!mounted || !showOnboarding) return null

  return <OnboardingWizard onComplete={handleComplete} />
}
