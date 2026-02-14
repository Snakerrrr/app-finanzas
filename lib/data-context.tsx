"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getDashboardData } from "@/app/actions/finance"
import type { Movimiento, Categoria, Cuenta, TarjetaCredito, MetaAhorro, Presupuesto } from "./types"
import { useAuth } from "./auth-context"

interface DataContextType {
  movimientos: Movimiento[]
  categorias: Categoria[]
  cuentas: Cuenta[]
  tarjetasCredito: TarjetaCredito[]
  metasAhorro: MetaAhorro[]
  presupuestos: Presupuesto[]
  refreshData: () => Promise<void>
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

  const refreshData = useCallback(async () => {
    const data = await getDashboardData()
    if (!data) {
      setMovimientos([])
      setCategorias([])
      setCuentas([])
      setTarjetasCredito([])
      setMetasAhorro([])
      setPresupuestos([])
      return
    }
    setMovimientos(data.movimientos)
    setCategorias(data.categorias)
    setCuentas(data.cuentas)
    setTarjetasCredito(data.tarjetasCredito)
    setMetasAhorro(data.metasAhorro)
    setPresupuestos(data.presupuestos)
  }, [])

  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      setMovimientos([])
      setCategorias([])
      setCuentas([])
      setTarjetasCredito([])
      setMetasAhorro([])
      setPresupuestos([])
    }
  }, [user, refreshData])

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // MOVIMIENTOS CRUD
  const addMovimiento = (mov: Omit<Movimiento, "id">) => {
    const newMovimiento: Movimiento = {
      ...mov,
      id: generateId("mov"),
    }
    setMovimientos((prev) => [newMovimiento, ...prev])
  }

  const updateMovimiento = (id: string, mov: Partial<Movimiento>) => {
    setMovimientos((prev) => prev.map((m) => (m.id === id ? { ...m, ...mov } : m)))
  }

  const deleteMovimiento = (id: string) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id))
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
    refreshData,
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
