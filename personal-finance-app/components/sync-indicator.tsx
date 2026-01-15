'use client'

import { Cloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SyncIndicatorProps {
  status: 'idle' | 'syncing' | 'success' | 'error'
  isSyncing?: boolean
  className?: string
}

export function SyncIndicator({ status, isSyncing = false, className }: SyncIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: Loader2,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          message: 'Guardando...',
          animate: 'animate-spin',
        }
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          message: 'Todo sincronizado',
          animate: '',
        }
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          message: 'Error de sincronización',
          animate: '',
        }
      case 'idle':
      default:
        return {
          icon: Cloud,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          message: 'Desconectado',
          animate: '',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-help',
            config.bgColor,
            className
          )}
        >
          <Icon
            className={cn('size-4', config.color, config.animate)}
          />
          <span className={cn('text-xs font-medium', config.color)}>
            {config.message}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {status === 'idle' && 'Inicia sesión y configura tu clave para activar la sincronización automática'}
          {status === 'syncing' && 'Tus cambios se están guardando automáticamente en la nube'}
          {status === 'success' && 'Todos tus datos están sincronizados con la nube'}
          {status === 'error' && 'Hubo un problema al sincronizar. Se reintentará automáticamente.'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
