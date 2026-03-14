import { describe, it, expect, vi } from "vitest"

// Mock prisma before importing the service
vi.mock("@/lib/db", () => ({
  prisma: {
    cuenta: {
      findMany: vi.fn().mockResolvedValue([
        { id: "c1", nombre: "Cuenta Corriente", banco: "BancoEstado", saldoInicialMes: 500000, saldoCalculado: 450000, saldoFinalMesDeclarado: null, activo: true, userId: "u1" },
      ]),
    },
    movimiento: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "m1", fecha: new Date("2026-02-01"), descripcion: "Supermercado", tipoMovimiento: "Gasto",
          montoCLP: 50000, metodoPago: "Débito", estadoConciliacion: "Pendiente",
          mesConciliacion: "2026-02", subcategoria: null, tipoGasto: "Variable",
          cuotas: null, notas: null, recurrenteId: null, etiquetas: [],
          categoriaId: "cat1", cuentaOrigenId: "c1", cuentaDestinoId: null, tarjetaCreditoId: null,
          categoria: { id: "cat1", nombre: "Comida", tipo: "Gasto", color: "#f59e0b", icono: "ShoppingCart" },
          cuentaOrigen: { id: "c1", nombre: "Cuenta Corriente" },
          cuentaDestino: null,
        },
        {
          id: "m2", fecha: new Date("2026-02-05"), descripcion: "Sueldo", tipoMovimiento: "Ingreso",
          montoCLP: 1000000, metodoPago: "Transferencia", estadoConciliacion: "Conciliado",
          mesConciliacion: "2026-02", subcategoria: null, tipoGasto: null,
          cuotas: null, notas: null, recurrenteId: null, etiquetas: [],
          categoriaId: "cat2", cuentaOrigenId: null, cuentaDestinoId: "c1", tarjetaCreditoId: null,
          categoria: { id: "cat2", nombre: "Ingreso Laboral", tipo: "Ingreso", color: "#10b981", icono: "DollarSign" },
          cuentaOrigen: null,
          cuentaDestino: { id: "c1", nombre: "Cuenta Corriente" },
        },
      ]),
    },
    categoria: {
      findMany: vi.fn().mockResolvedValue([
        { id: "cat1", nombre: "Comida", tipo: "Gasto", color: "#f59e0b", icono: "ShoppingCart" },
        { id: "cat2", nombre: "Ingreso Laboral", tipo: "Ingreso", color: "#10b981", icono: "DollarSign" },
      ]),
      count: vi.fn().mockResolvedValue(2),
    },
    tarjetaCredito: { findMany: vi.fn().mockResolvedValue([]) },
    metaAhorro: { findMany: vi.fn().mockResolvedValue([]) },
    presupuesto: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock("@/lib/cache", () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  cacheKeys: { dashboard: (id: string) => `dashboard:${id}`, movimientos: (id: string) => `movimientos:${id}` },
  invalidateUserCache: vi.fn().mockResolvedValue(undefined),
}))

describe("Chat Executor - Finance Service Integration", () => {
  it("getDashboardData returns correct balance calculation", async () => {
    const { getDashboardData } = await import("@/lib/services/finance.service")
    const data = await getDashboardData("u1")
    expect(data).toBeDefined()
    expect(data.balanceTotal).toBe(450000)
    expect(data.cuentas).toHaveLength(1)
    expect(data.categorias).toHaveLength(2)
  })

  it("getDashboardData filters movements by current month", async () => {
    const { getDashboardData } = await import("@/lib/services/finance.service")
    const data = await getDashboardData("u1")
    expect(data.movimientos).toHaveLength(2)
  })

  it("getMovimientos returns filtered data", async () => {
    const { getMovimientos } = await import("@/lib/services/finance.service")
    const movimientos = await getMovimientos("u1", {})
    expect(movimientos).toHaveLength(2)
    expect(movimientos[0]).toHaveProperty("descripcion")
    expect(movimientos[0]).toHaveProperty("montoCLP")
  })
})
