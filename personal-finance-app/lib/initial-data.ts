import type { Categoria, Cuenta, TarjetaCredito, MetaAhorro, Presupuesto, Movimiento } from "./types"

// Categorías predeterminadas para nuevos usuarios
export const initialCategorias: Categoria[] = [
  { id: "cat-1", nombre: "Sueldo", tipo: "Ingreso", color: "#10b981", icono: "DollarSign" },
  { id: "cat-2", nombre: "Ingresos Extra", tipo: "Ingreso", color: "#34d399", icono: "TrendingUp" },
  { id: "cat-3", nombre: "Arriendo/Dividendo", tipo: "Gasto", color: "#ef4444", icono: "Home" },
  { id: "cat-4", nombre: "Supermercado", tipo: "Gasto", color: "#f59e0b", icono: "ShoppingCart" },
  { id: "cat-5", nombre: "Transporte", tipo: "Gasto", color: "#3b82f6", icono: "Bus" },
  { id: "cat-6", nombre: "Bencina", tipo: "Gasto", color: "#8b5cf6", icono: "Fuel" },
  { id: "cat-7", nombre: "Servicios Básicos", tipo: "Gasto", color: "#ec4899", icono: "Zap" },
  { id: "cat-8", nombre: "Internet/Telefonía", tipo: "Gasto", color: "#06b6d4", icono: "Wifi" },
  { id: "cat-9", nombre: "Salud", tipo: "Gasto", color: "#14b8a6", icono: "Heart" },
  { id: "cat-10", nombre: "Farmacia", tipo: "Gasto", color: "#f97316", icono: "Pill" },
  { id: "cat-11", nombre: "Suscripciones", tipo: "Gasto", color: "#a855f7", icono: "Tv" },
  { id: "cat-12", nombre: "Delivery/Restaurantes", tipo: "Gasto", color: "#f43f5e", icono: "UtensilsCrossed" },
  { id: "cat-13", nombre: "Educación", tipo: "Gasto", color: "#6366f1", icono: "GraduationCap" },
  { id: "cat-14", nombre: "Entretenimiento", tipo: "Gasto", color: "#ec4899", icono: "Sparkles" },
  { id: "cat-15", nombre: "Ropa", tipo: "Gasto", color: "#8b5cf6", icono: "Shirt" },
  { id: "cat-16", nombre: "Ajuste/Corrección", tipo: "Ambos", color: "#64748b", icono: "Settings" },
]

// Cuentas de ejemplo para nuevos usuarios
export const initialCuentas: Cuenta[] = [
  {
    id: "cta-1",
    nombre: "Cuenta Corriente",
    banco: "Banco de Chile",
    saldoInicialMes: 0,
    saldoCalculado: 0,
    activo: true,
  },
  {
    id: "cta-2",
    nombre: "Cuenta Vista",
    banco: "BancoEstado",
    saldoInicialMes: 0,
    saldoCalculado: 0,
    activo: true,
  },
  {
    id: "cta-3",
    nombre: "Efectivo",
    banco: "N/A",
    saldoInicialMes: 0,
    saldoCalculado: 0,
    activo: true,
  },
]

// Datos opcionales de ejemplo para demostración
export const exampleTarjeta: TarjetaCredito = {
  id: "tc-1",
  nombre: "Tarjeta de Crédito",
  banco: "Banco",
  cupoTotal: 1000000,
  cupoDisponible: 1000000,
  fechaFacturacion: 15,
  fechaPago: 10,
  tasaInteresMensual: 2.5,
  deudaActual: 0,
  deudaFacturada: 0,
  deudaNoFacturada: 0,
}

export const exampleMeta: MetaAhorro = {
  id: "meta-1",
  nombre: "Fondo de Emergencia",
  objetivoCLP: 3000000,
  fechaObjetivo: "2026-12-31",
  aporteMensualSugerido: 250000,
  acumuladoCLP: 0,
  cuentaDestinoId: "cta-2",
  estado: "Activa",
}

export const examplePresupuesto: Presupuesto = {
  id: "pres-1",
  categoriaId: "cat-4",
  mes: new Date().toISOString().slice(0, 7),
  montoPresupuestadoCLP: 250000,
}

export const exampleMovimiento: Movimiento = {
  id: "mov-1",
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "Movimiento de ejemplo",
  tipoMovimiento: "Gasto",
  categoriaId: "cat-4",
  tipoGasto: "Variable",
  metodoPago: "Débito",
  cuentaOrigenId: "cta-1",
  montoCLP: 50000,
  estadoConciliacion: "Pendiente",
  mesConciliacion: new Date().toISOString().slice(0, 7),
}
