'use client'

import { useState } from 'react'
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Info,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCloudSync } from '@/hooks/useCloudSync'
import { useToast } from '@/hooks/use-toast'
import { SyncIndicator } from '@/components/sync-indicator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function CloudSyncPanel() {
  const {
    user,
    loading,
    lastSync,
    lastSyncError,
    sessionKey,
    isSyncing,
    syncStatus,
    signInWithPassword,
    signUp,
    signOut,
    uploadBackup,
    downloadBackup,
    validateAndDownloadBackup,
    setSessionKey,
  } = useCloudSync()

  const { toast } = useToast()

  // Estados para autenticación
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Estados para sincronización
  const [passphrase, setPassphrase] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [pendingPassphrase, setPendingPassphrase] = useState('')

  // Manejar login
  const handleLogin = async () => {
    setAuthError(null)

    if (!email.trim()) {
      setAuthError('El email es requerido')
      return
    }

    if (!password.trim()) {
      setAuthError('La contraseña es requerida')
      return
    }

    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsAuthenticating(true)
    try {
      await signInWithPassword(email.trim(), password)
      toast({
        title: '✅ Sesión iniciada',
        description: 'Has iniciado sesión correctamente.',
      })
      setEmail('')
      setPassword('')
      setAuthError(null)
      // El onAuthStateChange actualizará automáticamente el estado del usuario
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión. Intenta nuevamente.'
      
      // Mensaje especial para credenciales inválidas
      if (errorMessage === 'invalid_login_credentials') {
        setAuthError('Usuario no encontrado o contraseña incorrecta. ¿Quizás necesitas ir a la pestaña "Crear Cuenta"?')
      } else {
        setAuthError(errorMessage)
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Manejar registro
  const handleSignUp = async () => {
    setAuthError(null)

    if (!email.trim()) {
      setAuthError('El email es requerido')
      return
    }

    if (!password.trim()) {
      setAuthError('La contraseña es requerida')
      return
    }

    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsAuthenticating(true)
    try {
      const { needsConfirmation } = await signUp(email.trim(), password)
      
      if (needsConfirmation) {
        // Si requiere confirmación, mostrar alerta pero no cambiar de pestaña
        toast({
          title: '✅ Cuenta creada',
          description: 'Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.',
        })
        setEmail('')
        setPassword('')
        setAuthMode('login') // Cambiar a modo login después del registro
        setAuthError(null)
      } else {
        // Si no requiere confirmación, el usuario ya está autenticado
        toast({
          title: '✅ ¡Cuenta creada!',
          description: 'Ya puedes sincronizar tus datos.',
        })
        setEmail('')
        setPassword('')
        setAuthError(null)
        // El onAuthStateChange actualizará automáticamente el estado del usuario
        // y el componente cambiará automáticamente al panel de sincronización
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el usuario. Intenta nuevamente.'
      setAuthError(errorMessage)
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Estado 2: Logueado - Cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      })
      setPassphrase('')
    } catch (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: 'No se pudo cerrar la sesión. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  // Subir backup
  const handleUploadBackup = async () => {
    if (!passphrase.trim()) {
      toast({
        title: 'Clave requerida',
        description: 'Por favor ingresa tu clave de encriptación personal.',
        variant: 'destructive',
      })
      return
    }

    if (passphrase.length < 8) {
      toast({
        title: 'Clave muy corta',
        description: 'La clave debe tener al menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      await uploadBackup(passphrase, false)
      // Guardar sessionKey para auto-save
      setSessionKey(passphrase)
      toast({
        title: '✅ Backup subido exitosamente',
        description: 'Tus datos han sido encriptados y guardados en la nube. La sincronización automática está activa.',
      })
      setPassphrase('')
    } catch (error) {
      toast({
        title: 'Error al subir backup',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo subir el backup. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Descargar backup (con confirmación)
  const handleDownloadBackup = async () => {
    if (!passphrase.trim()) {
      toast({
        title: 'Clave requerida',
        description: 'Por favor ingresa tu clave de encriptación personal.',
        variant: 'destructive',
      })
      return
    }

    setIsDownloading(true)
    try {
      // Validar la passphrase y descargar (sin restaurar todavía)
      await validateAndDownloadBackup(passphrase)
      // Si la validación es exitosa, guardar sessionKey y mostrar diálogo de confirmación
      setSessionKey(passphrase)
      setPendingPassphrase(passphrase)
      setShowRestoreDialog(true)
    } catch (error) {
      toast({
        title: 'Error al validar backup',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo validar el backup. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Confirmar restauración
  const handleConfirmRestore = async () => {
    if (!pendingPassphrase) return

    setIsDownloading(true)
    try {
      await downloadBackup(pendingPassphrase)
      // La sessionKey se guarda automáticamente en downloadBackup
      toast({
        title: '✅ Backup restaurado exitosamente',
        description: 'Tus datos han sido restaurados desde la nube. La página se recargará y la sincronización automática se activará.',
      })
      setPassphrase('')
      setPendingPassphrase('')
      setShowRestoreDialog(false)
      // La página se recargará automáticamente en downloadBackup
    } catch (error) {
      toast({
        title: 'Error al restaurar backup',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo restaurar el backup. Intenta nuevamente.',
        variant: 'destructive',
      })
      setShowRestoreDialog(false)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca'
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Cargando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado 1: No logueado
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="size-5" />
            Sincronización en la Nube
          </CardTitle>
          <CardDescription>
            Guarda tus datos de forma segura en la nube con encriptación end-to-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs 
            value={authMode} 
            defaultValue="login"
            onValueChange={(v) => {
              setAuthMode(v as 'login' | 'signup')
              setAuthError(null)
              setEmail('')
              setPassword('')
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="size-4" />
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="size-4" />
                Crear Cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              {authError && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-900/50">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    <span>{authError}</span>
                    {authError.includes('Usuario no encontrado') && (
                      <div className="mt-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-red-600 dark:text-red-400 underline font-medium"
                          onClick={() => {
                            setAuthMode('signup')
                            setAuthError(null)
                            setEmail('')
                            setPassword('')
                          }}
                        >
                          Ir a Crear Cuenta →
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setAuthError(null)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAuthenticating) {
                      handleLogin()
                    }
                  }}
                  disabled={isAuthenticating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setAuthError(null)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAuthenticating) {
                      handleLogin()
                    }
                  }}
                  disabled={isAuthenticating}
                />
              </div>

              <Button
                onClick={handleLogin}
                disabled={isAuthenticating || !email.trim() || !password.trim()}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {authError && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-900/50">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    <span>{authError}</span>
                    {authError.includes('ya está registrado') && (
                      <div className="mt-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-red-600 dark:text-red-400 underline font-medium"
                          onClick={() => {
                            setAuthMode('login')
                            setAuthError(null)
                          }}
                        >
                          Ir a Iniciar Sesión →
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-email">Correo Electrónico</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setAuthError(null)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAuthenticating) {
                      handleSignUp()
                    }
                  }}
                  disabled={isAuthenticating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Contraseña</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setAuthError(null)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAuthenticating) {
                      handleSignUp()
                    }
                  }}
                  disabled={isAuthenticating}
                />
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              </div>

              <Button
                onClick={handleSignUp}
                disabled={isAuthenticating || !email.trim() || !password.trim() || password.length < 6}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>

              <Alert className="border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
                <Info className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
                  Al crear una cuenta, podrás sincronizar tus datos de forma segura en la nube.
                  Tu cuenta se creará inmediatamente.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  // Estado 2: Logueado
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Cloud className="size-5" />
                Sincronización en la Nube
              </CardTitle>
              <CardDescription>
                Tus datos están encriptados con una clave personal que solo tú conoces.
              </CardDescription>
            </div>
            {user && (
              <SyncIndicator 
                status={syncStatus} 
                isSyncing={isSyncing}
                className="mt-1"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información del usuario */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="size-4" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Advertencia sobre la clave */}
          <Alert className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
            <Shield className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs">
              <strong>⚠️ Importante:</strong> Tu clave de encriptación personal no se guarda en
              ningún lado. Si la pierdes, perderás acceso a tus datos encriptados. Guárdala en un
              lugar seguro.
            </AlertDescription>
          </Alert>

          {/* Input de clave de encriptación */}
          <div className="space-y-2">
            <Label htmlFor="passphrase" className="flex items-center gap-2">
              <Lock className="size-4" />
              Clave de Encriptación Personal
            </Label>
            <Input
              id="passphrase"
              type="password"
              placeholder="Ingresa tu clave de encriptación"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres. Esta clave encripta/desencripta tus datos.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              onClick={handleUploadBackup}
              disabled={isUploading || !passphrase.trim() || passphrase.length < 8}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <CloudUpload className="size-4" />
                  Subir a la Nube
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadBackup}
              disabled={isDownloading || !passphrase.trim() || passphrase.length < 8}
              variant="outline"
              className="flex-1"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <CloudDownload className="size-4" />
                  Bajar de la Nube
                </>
              )}
            </Button>
          </div>

          {/* Feedback de última sincronización */}
          {lastSync && (
            <Alert className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs">
                <strong>Última sincronización exitosa:</strong> {formatLastSync(lastSync)}
              </AlertDescription>
            </Alert>
          )}

          {lastSyncError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">
                <strong>Error en última sincronización:</strong> {lastSyncError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación para restaurar */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmar Restauración</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reemplazará todos tus datos locales con los datos del backup en la nube.
              <br />
              <br />
              <strong>¿Estás seguro de que deseas continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDownloading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={isDownloading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Sí, Restaurar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
