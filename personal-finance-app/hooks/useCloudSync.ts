'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { supabase } from '@/lib/supabase'
import { encryptData, decryptData } from '@/lib/crypto'
import type { User } from '@supabase/supabase-js'
import type { UserData } from '@/lib/types'
import { db } from '@/lib/db'
import { syncMovimientosToDexie } from '@/lib/db'

interface CloudSyncState {
  user: User | null
  loading: boolean
  lastSync: Date | null
  lastSyncError: string | null
  sessionKey: string | null // Clave de encriptación en memoria
  isSyncing: boolean // Estado de sincronización automática
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' // Estado visual del sync
}

interface BackupData {
  userData: UserData
  timestamp: string
  version: string
}

export function useCloudSync() {
  const [state, setState] = useState<CloudSyncState>({
    user: null,
    loading: true,
    lastSync: null,
    lastSyncError: null,
    sessionKey: null,
    isSyncing: false,
    syncStatus: 'idle',
  })

  // Referencias para debounce y control de auto-save
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataHashRef = useRef<string>('')
  const isManualSyncRef = useRef(false) // Flag para evitar auto-save durante sync manual

  // Observar cambios en la tabla de transacciones usando useLiveQuery
  const transactionCount = useLiveQuery(() => db.transactions.count(), [])
  const transactions = useLiveQuery(() => db.transactions.toArray(), [])

  /**
   * Exporta todos los datos del DataContext y Dexie
   */
  const exportAllData = useCallback(async (): Promise<UserData> => {
    try {
      // Obtener datos de localStorage (DataContext)
      const storageKey = `finanzas-cl-data-${state.user?.id || 'local'}`
      const savedData = localStorage.getItem(storageKey)

      let userData: UserData = {
        movimientos: [],
        categorias: [],
        cuentas: [],
        tarjetasCredito: [],
        metasAhorro: [],
        presupuestos: [],
      }

      if (savedData) {
        try {
          userData = JSON.parse(savedData)
        } catch (parseError) {
          console.warn('Error al parsear datos de localStorage:', parseError)
        }
      }

      // También obtener transacciones de Dexie para sincronización
      const dexieTransactions = await db.transactions.toArray()

      if (dexieTransactions.length > 0) {
        console.log(`Exportando ${dexieTransactions.length} transacciones de Dexie`)
      }

      return userData
    } catch (error) {
      console.error('Error al exportar datos:', error)
      throw new Error('No se pudo exportar los datos. Intenta nuevamente.')
    }
  }, [state.user?.id])

  // Calcular hash de los datos para detectar cambios
  const calculateDataHash = useCallback(async (): Promise<string> => {
    try {
      const userData = await exportAllData()
      // Crear un hash simple basado en el contenido
      const dataString = JSON.stringify(userData)
      return btoa(dataString).slice(0, 50) // Hash simple para comparación
    } catch {
      return ''
    }
  }, [exportAllData])

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }))
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Inicia sesión con email y contraseña
   */
  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          // Manejar errores específicos de Supabase
          if (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
            throw new Error('invalid_login_credentials')
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor confirma tu email antes de iniciar sesión')
          }
          throw error
        }

        // La sesión se actualizará automáticamente vía onAuthStateChange
        if (!data.session) {
          throw new Error('No se pudo crear la sesión')
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error)
        throw new Error(
          error instanceof Error
            ? error.message
            : 'No se pudo iniciar sesión. Intenta nuevamente.'
        )
      }
    },
    []
  )

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          // Manejar errores específicos
          if (error.message.includes('User already registered')) {
            throw new Error('Este email ya está registrado. Inicia sesión en su lugar.')
          }
          if (error.message.includes('Password')) {
            throw new Error('La contraseña debe tener al menos 6 caracteres')
          }
          throw error
        }

        // Verificar si necesita confirmación de email
        const needsConfirmation = data.user && !data.session

        return { needsConfirmation: !!needsConfirmation }
      } catch (error) {
        console.error('Error al registrar usuario:', error)
        throw new Error(
          error instanceof Error
            ? error.message
            : 'No se pudo registrar el usuario. Intenta nuevamente.'
        )
      }
    },
    []
  )

  /**
   * Cierra la sesión del usuario
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Limpiar sessionKey al cerrar sesión
      setState(prev => ({
        ...prev,
        sessionKey: null,
        syncStatus: 'idle',
      }))
      
      // Limpiar timer de debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      throw new Error('No se pudo cerrar la sesión. Intenta nuevamente.')
    }
  }, [])

  /**
   * Establece la sessionKey (clave de encriptación en memoria)
   */
  const setSessionKey = useCallback((key: string | null) => {
    setState(prev => ({
      ...prev,
      sessionKey: key,
    }))
  }, [])


  /**
   * Restaura todos los datos en el DataContext y Dexie
   */
  const restoreAllData = useCallback(
    async (userData: UserData): Promise<void> => {
      try {
        if (!state.user?.id) {
          throw new Error('Usuario no autenticado')
        }

        // Guardar en localStorage (DataContext)
        const storageKey = `finanzas-cl-data-${state.user.id}`
        localStorage.setItem(storageKey, JSON.stringify(userData))

        // Sincronizar movimientos con Dexie
        if (userData.movimientos && userData.movimientos.length > 0) {
          await syncMovimientosToDexie(userData.movimientos)
        } else {
          // Si no hay movimientos, limpiar Dexie
          await db.transactions.clear()
        }

        // Recargar la página para que el DataContext tome los nuevos datos
        window.location.reload()
      } catch (error) {
        console.error('Error al restaurar datos:', error)
        throw new Error('No se pudo restaurar los datos. Intenta nuevamente.')
      }
    },
    [state.user?.id]
  )

  /**
   * Sube un backup encriptado a Supabase
   * @param passphrase - Clave de encriptación
   * @param isAutoSave - Si es true, no actualiza sessionKey ni muestra errores intrusivos
   */
  const uploadBackup = useCallback(
    async (passphrase: string, isAutoSave: boolean = false): Promise<void> => {
      try {
        if (!state.user?.id) {
          throw new Error('Debes iniciar sesión para subir un backup')
        }

        // Si es auto-save, marcar como manual sync para evitar loops
        if (isAutoSave) {
          isManualSyncRef.current = true
        }

        // 1. Exportar todos los datos
        const userData = await exportAllData()

        // 2. Crear objeto de backup con metadata
        const backupData: BackupData = {
          userData,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }

        // 3. Encriptar los datos
        const encryptedData = encryptData(backupData, passphrase)

        // 4. Hacer upsert a Supabase
        const { error } = await supabase
          .from('user_backups')
          .upsert(
            {
              user_id: state.user.id,
              encrypted_data: encryptedData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )

        if (error) {
          throw error
        }

        // 5. Actualizar hash de referencia
        const newHash = await calculateDataHash()
        lastDataHashRef.current = newHash

        // 6. Actualizar estado de última sincronización
        setState(prev => ({
          ...prev,
          lastSync: new Date(),
          lastSyncError: null,
          syncStatus: 'success',
          // Guardar sessionKey si es la primera vez
          sessionKey: prev.sessionKey || (isAutoSave ? null : passphrase),
        }))

        // Resetear flag después de un delay
        if (isAutoSave) {
          setTimeout(() => {
            isManualSyncRef.current = false
          }, 1000)
        }
      } catch (error) {
        console.error('Error al subir backup:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo subir el backup. Intenta nuevamente.'

        setState(prev => ({
          ...prev,
          lastSyncError: errorMessage,
          syncStatus: 'error',
        }))

        // Solo lanzar error si NO es auto-save (para no interrumpir al usuario)
        if (!isAutoSave) {
          throw new Error(errorMessage)
        }
      }
    },
    [state.user?.id, exportAllData, calculateDataHash]
  )

  /**
   * Valida la passphrase y descarga el backup (sin restaurar)
   * Retorna los datos desencriptados para que el componente decida si restaurar
   */
  const validateAndDownloadBackup = useCallback(
    async (passphrase: string): Promise<{ backupData: BackupData; updatedAt: string }> => {
      try {
        if (!state.user?.id) {
          throw new Error('Debes iniciar sesión para descargar un backup')
        }

        // 1. Obtener backup de Supabase
        const { data, error } = await supabase
          .from('user_backups')
          .select('encrypted_data, updated_at')
          .eq('user_id', state.user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('No se encontró ningún backup en la nube.')
          }
          throw error
        }

        if (!data || !data.encrypted_data) {
          throw new Error('No hay datos de backup disponibles.')
        }

        // 2. Desencriptar los datos
        let backupData: BackupData
        try {
          backupData = decryptData(data.encrypted_data, passphrase)
        } catch (decryptError) {
          if (
            decryptError instanceof Error &&
            decryptError.message.includes('Contraseña incorrecta')
          ) {
            throw new Error('Contraseña de encriptación incorrecta.')
          }
          throw decryptError
        }

        // 3. Validar estructura del backup
        if (!backupData.userData) {
          throw new Error('El backup está corrupto o tiene un formato inválido.')
        }

        return {
          backupData,
          updatedAt: data.updated_at || new Date().toISOString(),
        }
      } catch (error) {
        console.error('Error al descargar backup:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo descargar el backup. Intenta nuevamente.'

        setState(prev => ({
          ...prev,
          lastSyncError: errorMessage,
        }))

        throw new Error(errorMessage)
      }
    },
    [state.user?.id]
  )

  /**
   * Descarga y restaura un backup desde Supabase
   */
  const downloadBackup = useCallback(
    async (passphrase: string): Promise<void> => {
      try {
        // Validar y descargar
        const { backupData, updatedAt } = await validateAndDownloadBackup(passphrase)

        // Guardar sessionKey antes de restaurar
        setState(prev => ({
          ...prev,
          sessionKey: passphrase,
        }))

        // Restaurar los datos
        await restoreAllData(backupData.userData)

        // Actualizar estado (aunque la página se recargará)
        setState(prev => ({
          ...prev,
          lastSync: new Date(updatedAt),
          lastSyncError: null,
          syncStatus: 'success',
        }))
      } catch (error) {
        // El error ya fue manejado en validateAndDownloadBackup
        throw error
      }
    },
    [validateAndDownloadBackup, restoreAllData]
  )

  // Auto-save: Detectar cambios y sincronizar automáticamente
  useEffect(() => {
    // Solo si hay usuario, sessionKey, y no es un sync manual
    if (!state.user?.id || !state.sessionKey || isManualSyncRef.current) {
      return
    }

    // Si no hay transacciones aún, esperar
    if (transactionCount === undefined || transactions === undefined) {
      return
    }

    // Función para verificar y sincronizar
    const checkAndSync = async () => {
      try {
        const currentHash = await calculateDataHash()
        
        // Si el hash cambió, hay cambios pendientes
        if (currentHash !== lastDataHashRef.current && currentHash !== '') {
          // Actualizar estado a "syncing"
          setState(prev => ({
            ...prev,
            isSyncing: true,
            syncStatus: 'syncing',
          }))

          // Ejecutar auto-save
          await uploadBackup(state.sessionKey!, true)

          // Resetear estado después de un delay
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              isSyncing: false,
            }))
          }, 2000)
        }
      } catch (error) {
        // Error silencioso - solo actualizar estado visual
        console.error('Error en auto-save:', error)
        setState(prev => ({
          ...prev,
          isSyncing: false,
          syncStatus: 'error',
        }))
      }
    }

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce de 5 segundos
    debounceTimerRef.current = setTimeout(() => {
      checkAndSync()
    }, 5000)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [transactionCount, transactions, state.user?.id, state.sessionKey, calculateDataHash, uploadBackup])

  // Inicializar hash al montar
  useEffect(() => {
    if (state.user?.id && state.sessionKey) {
      calculateDataHash().then(hash => {
        lastDataHashRef.current = hash
      })
    }
  }, [state.user?.id, state.sessionKey, calculateDataHash])

  return {
    user: state.user,
    loading: state.loading,
    lastSync: state.lastSync,
    lastSyncError: state.lastSyncError,
    sessionKey: state.sessionKey,
    isSyncing: state.isSyncing,
    syncStatus: state.syncStatus,
    signInWithPassword,
    signUp,
    signOut,
    uploadBackup,
    downloadBackup,
    validateAndDownloadBackup,
    setSessionKey,
  }
}
