import type { Database } from '../types'

/** Los nombres de colección de Database — también son los nombres de colección en Firestore. */
export const COLLECTION_KEYS = [
  'locations',
  'salesReps',
  'vehicles',
  'categories',
  'subfamilias',
  'suppliers',
  'products',
  'stock',
  'clients',
  'sales',
  'purchases',
  'invoices',
  'users',
  'cashSessions',
  'transfers',
  'verifactuEnvios',
  'gastosVehiculos',
  'citasVehiculos',
  'empresas',
  'oportunidades',
  'contactosCRM',
  'objetivosComerciales',
  'dispositivosHardware',
  'dispositivosApp',
  'reglasAutomatizacion',
  'ejecucionesRegla',
] as const satisfies readonly (keyof Database)[]

export type CollectionKey = (typeof COLLECTION_KEYS)[number]
