"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, Check, Wallet, PiggyBank, Target, BarChart3, Sparkles } from "lucide-react"

interface OnboardingWizardProps {
  onComplete: () => void
}

const STEPS = [
  {
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    title: "¡Bienvenido a FinanzasCL!",
    description: "Tu asistente financiero personal. Te guiaremos para configurar tu cuenta en menos de 2 minutos.",
    tip: "Podrás modificar todo esto después en Configuración.",
  },
  {
    icon: <Wallet className="h-12 w-12 text-blue-500" />,
    title: "Registra tus Cuentas",
    description: "Agrega tus cuentas bancarias para hacer seguimiento de tus saldos y movimientos.",
    tip: "Ve a 'Categorías & Cuentas' para agregar tus cuentas bancarias.",
    action: { label: "Ir a Cuentas", href: "/categorias" },
  },
  {
    icon: <PiggyBank className="h-12 w-12 text-green-500" />,
    title: "Define Presupuestos",
    description: "Establece límites de gasto por categoría para controlar tus finanzas mes a mes.",
    tip: "Recomendamos empezar con 3-5 categorías principales como Alimentación, Transporte y Entretenimiento.",
    action: { label: "Crear Presupuesto", href: "/presupuestos" },
  },
  {
    icon: <Target className="h-12 w-12 text-purple-500" />,
    title: "Crea una Meta de Ahorro",
    description: "Define un objetivo financiero. Puede ser un fondo de emergencia, vacaciones o cualquier meta.",
    tip: "Un buen punto de partida es ahorrar 3 meses de gastos como fondo de emergencia.",
    action: { label: "Crear Meta", href: "/metas" },
  },
  {
    icon: <BarChart3 className="h-12 w-12 text-amber-500" />,
    title: "¡Listo para empezar!",
    description: "Tu dashboard te mostrará un resumen completo de tus finanzas. Registra tu primer movimiento para comenzar.",
    tip: "Usa el botón '+' flotante para registrar gastos rápidamente desde cualquier página.",
  },
]

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const isLastStep = currentStep === STEPS.length - 1
  const step = STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="text-center pb-2">
          {/* Indicador de progreso */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-2 bg-primary/60" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-center">{step.icon}</div>
              <CardTitle className="text-2xl">{step.title}</CardTitle>
              <CardDescription className="text-base">{step.description}</CardDescription>
            </motion.div>
          </AnimatePresence>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {/* Tip */}
              <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground">
                💡 {step.tip}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navegación */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {STEPS.length}
            </span>

            {isLastStep ? (
              <Button onClick={onComplete} className="gap-2">
                Comenzar
                <Check className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)} className="gap-2">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Botón saltar */}
          {!isLastStep && (
            <div className="text-center">
              <Button variant="link" size="sm" onClick={onComplete} className="text-xs text-muted-foreground">
                Saltar tutorial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
