export type TipoMovimiento = "Ingreso" | "Gasto" | "Transferencia"
export type TipoGasto = "Fijo" | "Variable" | "Ocasional"
export type MetodoPago = "Débito" | "Crédito" | "Efectivo" | "Transferencia"
export type EstadoConciliacion = "Pendiente" | "Conciliado"
export type EstadoMeta = "Activa" | "Completada"
export type TipoCategoria = "Gasto" | "Ingreso" | "Ambos"

export interface Movimiento {
  id: string
  fecha: string // YYYY-MM-DD
  descripcion: string
  tipoMovimiento: TipoMovimiento
  categoriaId: string
  subcategoria?: string
  tipoGasto?: TipoGasto
  cuentaOrigenId?: string
  cuentaDestinoId?: string
  tarjetaCreditoId?: string
  metodoPago: MetodoPago
  montoCLP: number
  cuotas?: number
  etiquetas?: string[]
  notas?: string
  estadoConciliacion: EstadoConciliacion
  mesConciliacion: string // YYYY-MM
}

export interface Cuenta {
  id: string
  nombre: string
  banco: string
  saldoInicialMes: number
  saldoFinalMesDeclarado?: number
  saldoCalculado: number
  activo: boolean
}

export interface TarjetaCredito {
  id: string
  nombre: string
  banco: string
  cupoTotal: number
  cupoDisponible: number
  fechaFacturacion: number // día del mes
  fechaPago: number // día del mes
  tasaInteresMensual: number
  deudaActual: number
  deudaFacturada: number
  deudaNoFacturada: number
}

export interface MetaAhorro {
  id: string
  nombre: string
  objetivoCLP: number
  fechaObjetivo: string // YYYY-MM-DD
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
  mes: string // YYYY-MM
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
