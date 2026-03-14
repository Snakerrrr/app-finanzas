"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { getDashboardData } from "@/app/actions/finance"
import { getRecurringTransactions } from "@/app/actions/recurring"
import { getUserGroups } from "@/app/actions/family"
import type { Movimiento, Categoria, Cuenta, TarjetaCredito, MetaAhorro, Presupuesto } from "./types"
import type { RecurringForClient } from "./services/recurring.service"
import type { FamilyGroupForClient } from "./services/family.service"
import { useAuth } from "./auth-context"

interface DataContextType {
  movimientos: Movimiento[]
  categorias: Categoria[]
  cuentas: Cuenta[]
  tarjetasCredito: TarjetaCredito[]
  metasAhorro: MetaAhorro[]
  presupuestos: Presupuesto[]
  recurrentes: RecurringForClient[]
  familyGroups: FamilyGroupForClient[]
  refreshData: () => Promise<void>
  refreshRecurrentes: () => Promise<void>
  refreshFamilyGroups: () => Promise<void>
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

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [tarjetasCredito, setTarjetasCredito] = useState<TarjetaCredito[]>([])
  const [metasAhorro, setMetasAhorro] = useState<MetaAhorro[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [recurrentes, setRecurrentes] = useState<RecurringForClient[]>([])
  const [familyGroups, setFamilyGroups] = useState<FamilyGroupForClient[]>([])

  const refreshData = useCallback(async () => {
    try {
      const data = await getDashboardData()
      if (!data) return
      setMovimientos(data.movimientos as Movimiento[])
      setCategorias(data.categorias as Categoria[])
      setCuentas(data.cuentas)
      setTarjetasCredito(data.tarjetasCredito)
      setMetasAhorro(data.metasAhorro as MetaAhorro[])
      setPresupuestos(data.presupuestos)
    } catch (err) {
      console.error("Error refreshing data:", err)
    }
  }, [])

  const refreshRecurrentes = useCallback(async () => {
    try {
      const data = await getRecurringTransactions()
      setRecurrentes(data)
    } catch (err) {
      console.error("Error refreshing recurrentes:", err)
    }
  }, [])

  const refreshFamilyGroups = useCallback(async () => {
    try {
      const data = await getUserGroups()
      setFamilyGroups(data)
    } catch (err) {
      console.error("Error refreshing family groups:", err)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setMovimientos([])
      setCategorias([])
      setCuentas([])
      setTarjetasCredito([])
      setMetasAhorro([])
      setPresupuestos([])
      setRecurrentes([])
      setFamilyGroups([])
      return
    }

    let cancelled = false

    const loadAll = async () => {
      const [dashData, recData, famData] = await Promise.allSettled([
        getDashboardData(),
        getRecurringTransactions(),
        getUserGroups(),
      ])

      if (cancelled) return

      if (dashData.status === "fulfilled" && dashData.value) {
        const d = dashData.value
        setMovimientos(d.movimientos as Movimiento[])
        setCategorias(d.categorias as Categoria[])
        setCuentas(d.cuentas)
        setTarjetasCredito(d.tarjetasCredito)
        setMetasAhorro(d.metasAhorro as MetaAhorro[])
        setPresupuestos(d.presupuestos)
      }
      if (recData.status === "fulfilled") setRecurrentes(recData.value)
      if (famData.status === "fulfilled") setFamilyGroups(famData.value)
    }

    loadAll()
    return () => { cancelled = true }
  }, [user])

  // CRUD callbacks memoized to prevent unnecessary re-renders
  const addMovimiento = useCallback((mov: Omit<Movimiento, "id">) => {
    setMovimientos((prev) => [{ ...mov, id: generateId("mov") }, ...prev])
  }, [])

  const updateMovimiento = useCallback((id: string, mov: Partial<Movimiento>) => {
    setMovimientos((prev) => prev.map((m) => (m.id === id ? { ...m, ...mov } : m)))
  }, [])

  const deleteMovimiento = useCallback((id: string) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const addCategoria = useCallback((cat: Omit<Categoria, "id">) => {
    setCategorias((prev) => [...prev, { ...cat, id: generateId("cat") }])
  }, [])

  const updateCategoria = useCallback((id: string, cat: Partial<Categoria>) => {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...cat } : c)))
  }, [])

  const deleteCategoria = useCallback((id: string) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addCuenta = useCallback((cuenta: Omit<Cuenta, "id" | "saldoCalculado">) => {
    setCuentas((prev) => [...prev, { ...cuenta, id: generateId("cta"), saldoCalculado: cuenta.saldoInicialMes }])
  }, [])

  const updateCuenta = useCallback((id: string, cuenta: Partial<Cuenta>) => {
    setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cuenta } : c)))
  }, [])

  const deleteCuenta = useCallback((id: string) => {
    setCuentas((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addTarjetaCredito = useCallback((tarjeta: Omit<TarjetaCredito, "id">) => {
    setTarjetasCredito((prev) => [...prev, { ...tarjeta, id: generateId("tc") }])
  }, [])

  const updateTarjetaCredito = useCallback((id: string, tarjeta: Partial<TarjetaCredito>) => {
    setTarjetasCredito((prev) => prev.map((t) => (t.id === id ? { ...t, ...tarjeta } : t)))
  }, [])

  const deleteTarjetaCredito = useCallback((id: string) => {
    setTarjetasCredito((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addMetaAhorro = useCallback((meta: Omit<MetaAhorro, "id">) => {
    setMetasAhorro((prev) => [...prev, { ...meta, id: generateId("meta") }])
  }, [])

  const updateMetaAhorro = useCallback((id: string, meta: Partial<MetaAhorro>) => {
    setMetasAhorro((prev) => prev.map((m) => (m.id === id ? { ...m, ...meta } : m)))
  }, [])

  const deleteMetaAhorro = useCallback((id: string) => {
    setMetasAhorro((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const agregarAporteMeta = useCallback((id: string, monto: number) => {
    setMetasAhorro((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const nuevoAcumulado = m.acumuladoCLP + monto
        return { ...m, acumuladoCLP: nuevoAcumulado, estado: nuevoAcumulado >= m.objetivoCLP ? "Completada" as const : "Activa" as const }
      }),
    )
  }, [])

  const addPresupuesto = useCallback((pres: Omit<Presupuesto, "id">) => {
    setPresupuestos((prev) => [...prev, { ...pres, id: generateId("pres") }])
  }, [])

  const updatePresupuesto = useCallback((id: string, pres: Partial<Presupuesto>) => {
    setPresupuestos((prev) => prev.map((p) => (p.id === id ? { ...p, ...pres } : p)))
  }, [])

  const deletePresupuesto = useCallback((id: string) => {
    setPresupuestos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const value = useMemo<DataContextType>(() => ({
    movimientos, categorias, cuentas, tarjetasCredito, metasAhorro, presupuestos, recurrentes, familyGroups,
    refreshData, refreshRecurrentes, refreshFamilyGroups,
    addMovimiento, updateMovimiento, deleteMovimiento,
    addCategoria, updateCategoria, deleteCategoria,
    addCuenta, updateCuenta, deleteCuenta,
    addTarjetaCredito, updateTarjetaCredito, deleteTarjetaCredito,
    addMetaAhorro, updateMetaAhorro, deleteMetaAhorro, agregarAporteMeta,
    addPresupuesto, updatePresupuesto, deletePresupuesto,
  }), [
    movimientos, categorias, cuentas, tarjetasCredito, metasAhorro, presupuestos, recurrentes, familyGroups,
    refreshData, refreshRecurrentes, refreshFamilyGroups,
    addMovimiento, updateMovimiento, deleteMovimiento,
    addCategoria, updateCategoria, deleteCategoria,
    addCuenta, updateCuenta, deleteCuenta,
    addTarjetaCredito, updateTarjetaCredito, deleteTarjetaCredito,
    addMetaAhorro, updateMetaAhorro, deleteMetaAhorro, agregarAporteMeta,
    addPresupuesto, updatePresupuesto, deletePresupuesto,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within DataProvider")
  }
  return context
}
