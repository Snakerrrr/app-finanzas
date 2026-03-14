export type TipoMovimiento = "Ingreso" | "Gasto" | "Transferencia"
export type TipoGasto = "Fijo" | "Variable" | "Ocasional"
export type MetodoPago = "Débito" | "Crédito" | "Efectivo" | "Transferencia"
export type EstadoConciliacion = "Pendiente" | "Conciliado"
export type EstadoMeta = "Activa" | "Completada"
export type TipoCategoria = "Gasto" | "Ingreso" | "Ambos"

export interface Movimiento {
  id: string
  fecha: string
  descripcion: string
  tipoMovimiento: string
  categoriaId: string
  subcategoria: string | null
  tipoGasto: string | null
  metodoPago: string
  montoCLP: number
  cuotas: number | null
  etiquetas: string[]
  notas: string | null
  estadoConciliacion: string
  mesConciliacion: string
  cuentaOrigenId: string | null
  cuentaDestinoId: string | null
  tarjetaCreditoId: string | null
  recurrenteId?: string | null
  categoria?: { id: string; nombre: string; tipo: string; color: string; icono: string }
  cuentaOrigen?: { id: string; nombre: string; banco: string } | null
  cuentaDestino?: { id: string; nombre: string; banco: string } | null
}

export interface Cuenta {
  id: string
  nombre: string
  banco: string
  saldoInicialMes: number
  saldoFinalMesDeclarado: number | null
  saldoCalculado: number
  activo: boolean
}

export interface TarjetaCredito {
  id: string
  nombre: string
  banco: string
  cupoTotal: number
  cupoDisponible: number
  fechaFacturacion: number
  fechaPago: number
  tasaInteresMensual: number
  deudaActual: number
  deudaFacturada: number
  deudaNoFacturada: number
}

export interface MetaAhorro {
  id: string
  nombre: string
  objetivoCLP: number
  fechaObjetivo: string
  aporteMensualSugerido: number
  acumuladoCLP: number
  cuentaDestinoId: string
  estado: EstadoMeta
}

export interface Categoria {
  id: string
  nombre: string
  tipo: TipoCategoria
  color: string
  icono: string
}

export interface Presupuesto {
  id: string
  categoriaId: string
  mes: string
  montoPresupuestadoCLP: number
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface UserData {
  movimientos: Movimiento[]
  categorias: Categoria[]
  cuentas: Cuenta[]
  tarjetasCredito: TarjetaCredito[]
  metasAhorro: MetaAhorro[]
  presupuestos: Presupuesto[]
}
