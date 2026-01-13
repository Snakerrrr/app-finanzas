"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  movimientos as initialMovimientos,
  categorias as initialCategorias,
  cuentas as initialCuentas,
  tarjetasCredito as initialTarjetasCredito,
  metasAhorro as initialMetasAhorro,
  presupuestos as initialPresupuestos,
} from "./mock-data"
import type { Movimiento, Categoria, Cuenta, TarjetaCredito, MetaAhorro, Presupuesto, UserData } from "./types"
import { useAuth } from "./auth-context"
import { syncMovimientosToDexie, upsertTransaction, deleteTransaction } from "./db"

interface DataContextType {
  movimientos: Movimiento[]
  categorias: Categoria[]
  cuentas: Cuenta[]
  tarjetasCredito: TarjetaCredito[]
  metasAhorro: MetaAhorro[]
  presupuestos: Presupuesto[]
  addMovimiento: (mov: Omit<Movimiento, "id">) => void
  updateMovimiento: (id: string, mov: Partial<Movimiento>) => void
  deleteMovimiento: (id: string) => void
  addCategoria: (cat: Omit<Categoria, "id">) => void
  updateCategoria: (id: string, cat: Partial<Categoria>) => void
  deleteCategoria: (id: string) => void
  addCuenta: (cuenta: Omit<Cuenta, "id" | "saldoCalculado">) => void
  updateCuenta: (id: string, cuenta: Partial<Cuenta>) => void
  deleteCuenta: (id: string) => void
  addTarjetaCredito: (tarjeta: Omit<TarjetaCredito, "id">) => void
  updateTarjetaCredito: (id: string, tarjeta: Partial<TarjetaCredito>) => void
  deleteTarjetaCredito: (id: string) => void
  addMetaAhorro: (meta: Omit<MetaAhorro, "id">) => void
  updateMetaAhorro: (id: string, meta: Partial<MetaAhorro>) => void
  deleteMetaAhorro: (id: string) => void
  agregarAporteMeta: (id: string, monto: number) => void
  addPresupuesto: (pres: Omit<Presupuesto, "id">) => void
  updatePresupuesto: (id: string, pres: Partial<Presupuesto>) => void
  deletePresupuesto: (id: string) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [tarjetasCredito, setTarjetasCredito] = useState<TarjetaCredito[]>([])
  const [metasAhorro, setMetasAhorro] = useState<MetaAhorro[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar datos desde localStorage al montar
  useEffect(() => {
    if (user) {
      const storageKey = `finanzas-cl-data-${user.id}`
      const savedData = localStorage.getItem(storageKey)

      if (savedData) {
        try {
          const userData: UserData = JSON.parse(savedData)
          setMovimientos(userData.movimientos || [])
          setCategorias(userData.categorias || [])
          setCuentas(userData.cuentas || [])
          setTarjetasCredito(userData.tarjetasCredito || [])
          setMetasAhorro(userData.metasAhorro || [])
          setPresupuestos(userData.presupuestos || [])
          
          // Sincronizar movimientos con Dexie para la búsqueda inteligente
          if (userData.movimientos && userData.movimientos.length > 0) {
            syncMovimientosToDexie(userData.movimientos).catch(console.error)
          }
        } catch (error) {
          console.error('Error al cargar datos desde localStorage:', error)
          // Si hay error, usar datos iniciales
          setMovimientos(initialMovimientos)
          setCategorias(initialCategorias)
          setCuentas(initialCuentas)
          setTarjetasCredito(initialTarjetasCredito)
          setMetasAhorro(initialMetasAhorro)
          setPresupuestos(initialPresupuestos)
          syncMovimientosToDexie(initialMovimientos).catch(console.error)
        }
      } else {
        // No hay datos guardados, usar datos iniciales
        setMovimientos(initialMovimientos)
        setCategorias(initialCategorias)
        setCuentas(initialCuentas)
        setTarjetasCredito(initialTarjetasCredito)
        setMetasAhorro(initialMetasAhorro)
        setPresupuestos(initialPresupuestos)
        
        // Sincronizar movimientos iniciales con Dexie
        syncMovimientosToDexie(initialMovimientos).catch(console.error)
      }
      setIsInitialized(true)
    } else {
      setMovimientos([])
      setCategorias([])
      setCuentas([])
      setTarjetasCredito([])
      setMetasAhorro([])
      setPresupuestos([])
      setIsInitialized(false)
    }
  }, [user])

  // Guardar datos en localStorage cuando cambien (solo después de la inicialización)
  useEffect(() => {
    if (user && isInitialized) {
      const storageKey = `finanzas-cl-data-${user.id}`
      const userData: UserData = {
        movimientos,
        categorias,
        cuentas,
        tarjetasCredito,
        metasAhorro,
        presupuestos,
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(userData))
        console.log('Datos guardados en localStorage:', { 
          movimientos: movimientos.length, 
          categorias: categorias.length,
          cuentas: cuentas.length 
        })
      } catch (error) {
        console.error('Error al guardar en localStorage:', error)
      }
      
      // Sincronizar movimientos con Dexie cuando cambien
      if (movimientos.length > 0) {
        syncMovimientosToDexie(movimientos).catch(console.error)
      }
    }
  }, [user, isInitialized, movimientos, categorias, cuentas, tarjetasCredito, metasAhorro, presupuestos])

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // MOVIMIENTOS CRUD
  const addMovimiento = (mov: Omit<Movimiento, "id">) => {
    const newMovimiento: Movimiento = {
      ...mov,
      id: generateId("mov"),
    }
    setMovimientos((prev) => {
      const updated = [newMovimiento, ...prev]
      // Sincronizar con Dexie
      upsertTransaction(newMovimiento).catch(console.error)
      return updated
    })
  }

  const updateMovimiento = (id: string, mov: Partial<Movimiento>) => {
    setMovimientos((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id) {
          const updatedMov = { ...m, ...mov }
          // Sincronizar con Dexie
          upsertTransaction(updatedMov).catch(console.error)
          return updatedMov
        }
        return m
      })
      return updated
    })
  }

  const deleteMovimiento = (id: string) => {
    setMovimientos((prev) => {
      const updated = prev.filter((m) => m.id !== id)
      // Eliminar de Dexie
      deleteTransaction(id).catch(console.error)
      return updated
    })
  }

  // CATEGORIAS CRUD
  const addCategoria = (cat: Omit<Categoria, "id">) => {
    const newCategoria: Categoria = {
      ...cat,
      id: generateId("cat"),
    }
    setCategorias((prev) => [...prev, newCategoria])
  }

  const updateCategoria = (id: string, cat: Partial<Categoria>) => {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...cat } : c)))
  }

  const deleteCategoria = (id: string) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id))
  }

  // CUENTAS CRUD
  const addCuenta = (cuenta: Omit<Cuenta, "id" | "saldoCalculado">) => {
    const newCuenta: Cuenta = {
      ...cuenta,
      id: generateId("cta"),
      saldoCalculado: cuenta.saldoInicialMes,
    }
    setCuentas((prev) => [...prev, newCuenta])
  }

  const updateCuenta = (id: string, cuenta: Partial<Cuenta>) => {
    setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cuenta } : c)))
  }

  const deleteCuenta = (id: string) => {
    setCuentas((prev) => prev.filter((c) => c.id !== id))
  }

  // TARJETAS CREDITO CRUD
  const addTarjetaCredito = (tarjeta: Omit<TarjetaCredito, "id">) => {
    const newTarjeta: TarjetaCredito = {
      ...tarjeta,
      id: generateId("tc"),
    }
    setTarjetasCredito((prev) => [...prev, newTarjeta])
  }

  const updateTarjetaCredito = (id: string, tarjeta: Partial<TarjetaCredito>) => {
    setTarjetasCredito((prev) => prev.map((t) => (t.id === id ? { ...t, ...tarjeta } : t)))
  }

  const deleteTarjetaCredito = (id: string) => {
    setTarjetasCredito((prev) => prev.filter((t) => t.id !== id))
  }

  // METAS AHORRO CRUD
  const addMetaAhorro = (meta: Omit<MetaAhorro, "id">) => {
    const newMeta: MetaAhorro = {
      ...meta,
      id: generateId("meta"),
    }
    setMetasAhorro((prev) => [...prev, newMeta])
  }

  const updateMetaAhorro = (id: string, meta: Partial<MetaAhorro>) => {
    setMetasAhorro((prev) => prev.map((m) => (m.id === id ? { ...m, ...meta } : m)))
  }

  const deleteMetaAhorro = (id: string) => {
    setMetasAhorro((prev) => prev.filter((m) => m.id !== id))
  }

  const agregarAporteMeta = (id: string, monto: number) => {
    setMetasAhorro((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nuevoAcumulado = m.acumuladoCLP + monto
          const estado: "Activa" | "Completada" = nuevoAcumulado >= m.objetivoCLP ? "Completada" : "Activa"
          return { ...m, acumuladoCLP: nuevoAcumulado, estado }
        }
        return m
      }),
    )
  }

  // PRESUPUESTOS CRUD
  const addPresupuesto = (pres: Omit<Presupuesto, "id">) => {
    const newPresupuesto: Presupuesto = {
      ...pres,
      id: generateId("pres"),
    }
    setPresupuestos((prev) => [...prev, newPresupuesto])
  }

  const updatePresupuesto = (id: string, pres: Partial<Presupuesto>) => {
    setPresupuestos((prev) => prev.map((p) => (p.id === id ? { ...p, ...pres } : p)))
  }

  const deletePresupuesto = (id: string) => {
    setPresupuestos((prev) => prev.filter((p) => p.id !== id))
  }

  const value: DataContextType = {
    movimientos,
    categorias,
    cuentas,
    tarjetasCredito,
    metasAhorro,
    presupuestos,
    addMovimiento,
    updateMovimiento,
    deleteMovimiento,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    addCuenta,
    updateCuenta,
    deleteCuenta,
    addTarjetaCredito,
    updateTarjetaCredito,
    deleteTarjetaCredito,
    addMetaAhorro,
    updateMetaAhorro,
    deleteMetaAhorro,
    agregarAporteMeta,
    addPresupuesto,
    updatePresupuesto,
    deletePresupuesto,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within DataProvider")
  }
  return context
}
