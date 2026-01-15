'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Procesando autenticación...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener la sesión del hash de la URL
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (session) {
          setStatus('success')
          setMessage('¡Autenticación exitosa! Redirigiendo...')
          
          // Redirigir a configuración después de 1 segundo
          setTimeout(() => {
            router.push('/configuracion')
          }, 1000)
        } else {
          setStatus('error')
          setMessage('No se pudo obtener la sesión. Intenta nuevamente.')
        }
      } catch (error) {
        console.error('Error en callback de autenticación:', error)
        setStatus('error')
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al autenticarte. Intenta nuevamente.'
        )
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-center text-sm text-muted-foreground">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                <p className="text-center text-sm font-medium">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-center text-sm text-muted-foreground">{message}</p>
                <button
                  onClick={() => router.push('/configuracion')}
                  className="text-sm text-primary hover:underline"
                >
                  Volver a Configuración
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
