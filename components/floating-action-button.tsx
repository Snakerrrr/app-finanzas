"use client"

import { useState } from "react"
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FABOption {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
}

interface FloatingActionButtonProps {
  /**
   * Si es true, muestra solo el botón "+" que abre un modal/página
   * Si es false, muestra el botón expandible con 3 opciones
   */
  simple?: boolean
  /**
   * Callback cuando se hace click en modo simple
   */
  onSimpleClick?: () => void
}

export function FloatingActionButton({ simple = false, onSimpleClick }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const options: FABOption[] = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Ingreso",
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => {
        router.push("/movimientos?tipo=ingreso")
        setIsOpen(false)
      },
    },
    {
      icon: <TrendingDown className="h-5 w-5" />,
      label: "Gasto",
      color: "bg-red-500 hover:bg-red-600",
      onClick: () => {
        router.push("/movimientos?tipo=gasto")
        setIsOpen(false)
      },
    },
    {
      icon: <ArrowLeftRight className="h-5 w-5" />,
      label: "Transferencia",
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => {
        router.push("/movimientos?tipo=transferencia")
        setIsOpen(false)
      },
    },
  ]

  const handleMainClick = () => {
    if (simple && onSimpleClick) {
      onSimpleClick()
    } else {
      setIsOpen(!isOpen)
    }
  }

  return (
    <>
      {/* Backdrop cuando está abierto */}
      <AnimatePresence>
        {isOpen && !simple && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Container del FAB */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <div className="relative flex flex-col items-end gap-3">
          {/* Opciones expandibles */}
          {!simple && (
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {options.map((option, index) => (
                    <motion.div
                      key={option.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      {/* Label del botón */}
                      <motion.span
                        className="rounded-md bg-popover px-3 py-2 text-sm font-medium shadow-lg border"
                        whileHover={{ scale: 1.05 }}
                      >
                        {option.label}
                      </motion.span>

                      {/* Botón de acción */}
                      <Button
                        size="lg"
                        className={cn("h-12 w-12 rounded-full shadow-lg", option.color)}
                        onClick={option.onClick}
                      >
                        {option.icon}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Botón principal */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-primary shadow-xl hover:shadow-2xl"
              onClick={handleMainClick}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}
