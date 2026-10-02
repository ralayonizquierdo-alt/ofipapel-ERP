export type LocationType = 'Almacén' | 'Tienda'

export interface Location {
  id: string
  nombre: string
  tipo: LocationType
  direccion: string
  zona: string
}

export interface SalesRep {
  id: string
  nombre: string
  zona: string
  telefono: string
  furgonId: string
  cocheId: string
}

export type VehicleType = 'Furgón de reparto' | 'Coche comercial'
export type VehicleEstado = 'En ruta' | 'En base' | 'Taller'

export interface VehicleFinanciacion {
  activa: boolean
  cuotaMensual: number
  cuotasPagadas: number
  cuotasTotales: number
}

export interface VehicleUbicacion {
  lat: number
  lon: number
  zona: string
  actualizado: string
}

export interface Vehicle {
  id: string
  tipo: VehicleType
  marca: string
  modelo: string
  anio: number
  matricula: string
  fotoUrl?: string
  comercialId: string
  kilometraje: number
  estado: VehicleEstado
  fechaAlta: string
  itvUltima: string
  itvProxima: string
  seguroCompania: string
  seguroPoliza: string
  seguroVencimiento: string
  financiacion: VehicleFinanciacion
  ubicacion: VehicleUbicacion
}

export type TipoGastoVehiculo =
  | 'Revisión periódica'
  | 'ITV'
  | 'Reparación'
  | 'Neumáticos'
  | 'Combustible'
  | 'Seguro'
  | 'Multa'
  | 'Otros'

export interface GastoVehiculo {
  id: string
  vehiculoId: string
  fecha: string
  tipo: TipoGastoVehiculo
  descripcion: string
  km?: number
  taller?: string
  importe: number
}

export type EstadoCitaVehiculo = 'Pendiente' | 'Completada'

export interface CitaVehiculo {
  id: string
  vehiculoId: string
  fecha: string
  tipo: TipoGastoVehiculo
  descripcion: string
  estado: EstadoCitaVehiculo
}

export type TarifaId = 'Tarifa 1' | 'Tarifa 2' | 'Tarifa 3' | 'Tarifa 6 (Mayor)'

export const TARIFA_IDS: TarifaId[] = ['Tarifa 1', 'Tarifa 2', 'Tarifa 3', 'Tarifa 6 (Mayor)']

/** Familia de productos. Lleva un número identificativo y agrupa varias subfamilias. */
export interface Category {
  id: string
  numero: number
  nombre: string
  margenMinorista: number
  /** % de beneficio sobre el coste para cada tarifa mayorista, ya definido por familia. */
  margenes: Record<TarifaId, number>
}

/** Subfamilia dentro de una familia — es donde se clasifican realmente los productos. */
export interface Subfamilia {
  id: string
  familiaId: string
  numero: number
  nombre: string
}

export interface Supplier {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string
  plazoEntregaDias: number
  ultimaCompra: string
}

export type IgicRate = 7 | 3 | 0

export type FormatoVenta = 'Unidad' | 'Paquete'

export interface Product {
  id: string
  sku: string
  codigoBarras: string
  nombre: string
  subfamiliaId: string
  proveedorId: string
  coste: number
  pvp: number
  tarifas: Record<TarifaId, number>
  igic: IgicRate
  unidadVenta: string
  formatoVenta: FormatoVenta
  unidadesPorPaquete: number
  ubicacion: string
  activo: boolean
  publicadoWeb: boolean
  imagenUrl?: string
}

export interface StockEntry {
  id: string
  productoId: string
  locationId: string
  unidades: number
  minimo: number
}

export type ClienteTipo = 'Mayorista' | 'Minorista'

export interface Client {
  id: string
  nombre: string
  tipo: ClienteTipo
  tarifa: string
  comercialId: string
  zona: string
  cif: string
  telefono: string
  email: string
  direccion: string
  saldoPendiente: number
  ultimoPedido: string
}

export type EstadoVenta = 'Presupuesto' | 'Pedido' | 'Albarán' | 'Facturado'

export interface OrderLine {
  productoId: string
  cantidad: number
  precioUnit: number
  igic: IgicRate
}

export type CanalVenta = 'Comercial' | 'Tienda' | 'Web'

export interface SaleOrder {
  id: string
  clienteId: string
  comercialId: string
  estado: EstadoVenta
  canal: CanalVenta
  locationId?: string
  formaPago?: 'Efectivo' | 'Tarjeta'
  fecha: string
  lineas: OrderLine[]
  total: number
}

export type EstadoCompra = 'Pendiente' | 'Recibido'

export interface PurchaseOrder {
  id: string
  proveedorId: string
  locationId: string
  estado: EstadoCompra
  fecha: string
  fechaPrevista: string
  lineas: OrderLine[]
  total: number
}

export type EstadoEnvioAeat = 'Pendiente' | 'Enviado'

export interface VerifactuEnvio {
  id: string
  invoiceId: string
  estado: EstadoEnvioAeat
  fechaEnvio: string | null
}

export interface Invoice {
  id: string
  ventaId: string
  clienteId: string
  fecha: string
  base: number
  igic: number
  total: number
}

export type UserRole = 'Administración' | 'Comercial' | 'Almacén' | 'Contabilidad'

export interface AppUser {
  id: string
  nombre: string
  usuario: string
  rol: UserRole
  ubicacionId?: string
  ultimoAcceso: string
  activo: boolean
}

export type EstadoCaja = 'Abierta' | 'Cerrada'

export interface CashSession {
  id: string
  locationId: string
  fechaApertura: string
  fechaCierre: string | null
  saldoInicial: number
  ventasEfectivo: number
  ventasTarjeta: number
  saldoContado: number | null
  estado: EstadoCaja
}

export type EstadoTransferencia = 'Pendiente' | 'En tránsito' | 'Completada'

export interface TransferLine {
  productoId: string
  cantidad: number
}

export interface StockTransfer {
  id: string
  origenId: string
  destinoId: string
  fecha: string
  estado: EstadoTransferencia
  lineas: TransferLine[]
}

export type Moneda = 'EUR' | 'USD' | 'GBP' | 'MAD'

/** Sociedad del grupo (Fase 3 · Multi-empresa / divisa). Ofipapel Canarias S.L. es la sociedad
 * matriz y es la que ya opera con todo el resto de módulos (ventas, compras, stock...). */
export interface Empresa {
  id: string
  nombre: string
  cif: string
  pais: string
  moneda: Moneda
  tipoCambioAEur: number
  esMatriz: boolean
  activa: boolean
  ingresos: number
  gastos: number
}

export type FaseOportunidad = 'Prospección' | 'Cualificación' | 'Propuesta' | 'Negociación' | 'Ganada' | 'Perdida'

export interface Oportunidad {
  id: string
  nombre: string
  clienteId: string
  comercialId: string
  fase: FaseOportunidad
  importeEstimado: number
  probabilidad: number
  fechaCierreEstimada: string
}

export type TipoContactoCRM = 'Llamada' | 'Visita' | 'Email' | 'Reunión'

export interface ContactoCRM {
  id: string
  clienteId: string
  comercialId: string
  fecha: string
  tipo: TipoContactoCRM
  notas: string
}

export interface ObjetivoComercial {
  id: string
  comercialId: string
  periodo: string
  objetivoImporte: number
}

export type TipoDispositivoHardware = 'Lector de código de barras' | 'Impresora de etiquetas' | 'Báscula' | 'Impresora de tickets'
export type EstadoDispositivo = 'Conectado' | 'Desconectado' | 'Error'

export interface DispositivoHardware {
  id: string
  tipo: TipoDispositivoHardware
  modelo: string
  locationId: string
  estado: EstadoDispositivo
  ultimaConexion: string
}

export type PlataformaApp = 'Android' | 'iOS'

export interface DispositivoApp {
  id: string
  usuarioId: string
  plataforma: PlataformaApp
  version: string
  ultimaSincronizacion: string
  estado: EstadoDispositivo
  consultaStock: boolean
  pedidosInSitu: boolean
  preparacionAlmacen: boolean
}

export type TipoReglaAutomatizacion = 'Reposición automática' | 'Alerta predictiva' | 'Regla de negocio'

export interface ReglaAutomatizacion {
  id: string
  nombre: string
  tipo: TipoReglaAutomatizacion
  condicion: string
  accion: string
  activa: boolean
}

export interface EjecucionRegla {
  id: string
  reglaId: string
  fecha: string
  resultado: string
}

export interface Database {
  locations: Location[]
  salesReps: SalesRep[]
  vehicles: Vehicle[]
  categories: Category[]
  subfamilias: Subfamilia[]
  suppliers: Supplier[]
  products: Product[]
  stock: StockEntry[]
  clients: Client[]
  sales: SaleOrder[]
  purchases: PurchaseOrder[]
  invoices: Invoice[]
  users: AppUser[]
  cashSessions: CashSession[]
  transfers: StockTransfer[]
  verifactuEnvios: VerifactuEnvio[]
  gastosVehiculos: GastoVehiculo[]
  citasVehiculos: CitaVehiculo[]
  empresas: Empresa[]
  oportunidades: Oportunidad[]
  contactosCRM: ContactoCRM[]
  objetivosComerciales: ObjetivoComercial[]
  dispositivosHardware: DispositivoHardware[]
  dispositivosApp: DispositivoApp[]
  reglasAutomatizacion: ReglaAutomatizacion[]
  ejecucionesRegla: EjecucionRegla[]
}
