import {
  collection,
  doc,
  getDocs,
  runTransaction,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { firestore } from './firebase'
import { COLLECTION_KEYS } from './collections'
import type { Database } from '../types'
import { generateDatabase } from './seed'

const BATCH_SIZE = 400

type AnyItem = { id: string } & DocumentData

async function writeItemsInBatches(collectionName: string, items: AnyItem[]): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(firestore)
    chunk.forEach((item) => batch.set(doc(firestore, collectionName, item.id), item))
    await batch.commit()
  }
}

async function deleteItemsInBatches(collectionName: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(firestore)
    chunk.forEach((id) => batch.delete(doc(firestore, collectionName, id)))
    await batch.commit()
  }
}

/**
 * Carga los datos de ejemplo en Firestore la primera vez que alguien abre la app (base de datos
 * vacía). Usa una transacción sobre meta/seed para que, si Luis y Rubén la abren a la vez, solo
 * uno de los dos haga la carga — el otro simplemente recibirá los datos por los listeners en vivo.
 */
export async function seedIfEmpty(): Promise<void> {
  const metaRef = doc(firestore, 'meta', 'seed')
  const claimed = await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(metaRef)
    if (snap.exists() && (snap.data().status === 'seeding' || snap.data().status === 'done')) {
      return false
    }
    tx.set(metaRef, { status: 'seeding', startedAt: Date.now() })
    return true
  })
  if (!claimed) return

  const fresh = generateDatabase()
  for (const key of COLLECTION_KEYS) {
    await writeItemsInBatches(key, fresh[key] as unknown as AnyItem[])
  }
  const batch = writeBatch(firestore)
  batch.set(metaRef, { status: 'done', finishedAt: Date.now() })
  await batch.commit()
}

/** Compara dos listas por id y aplica solo los altas/bajas/cambios reales a Firestore. */
async function reconcileCollection(collectionName: string, prevItems: AnyItem[], nextItems: AnyItem[]): Promise<void> {
  const prevById = new Map(prevItems.map((it) => [it.id, it]))
  const nextById = new Map(nextItems.map((it) => [it.id, it]))

  const toWrite: AnyItem[] = []
  nextById.forEach((item, id) => {
    const previo = prevById.get(id)
    if (!previo || JSON.stringify(previo) !== JSON.stringify(item)) toWrite.push(item)
  })
  const toDelete: string[] = []
  prevById.forEach((_item, id) => {
    if (!nextById.has(id)) toDelete.push(id)
  })

  if (toWrite.length > 0) await writeItemsInBatches(collectionName, toWrite)
  if (toDelete.length > 0) await deleteItemsInBatches(collectionName, toDelete)
}

/** Aplica a Firestore solo la diferencia entre el estado anterior y el nuevo, colección a colección. */
export async function diffAndWrite(prev: Database, next: Database): Promise<void> {
  await Promise.all(
    COLLECTION_KEYS.map((key) => reconcileCollection(key, prev[key] as unknown as AnyItem[], next[key] as unknown as AnyItem[])),
  )
}

/** "Restaurar datos de ejemplo": borra todo lo que haya en cada colección y vuelve a cargar la semilla. */
export async function wipeAndReplace(): Promise<Database> {
  const fresh = generateDatabase()
  for (const key of COLLECTION_KEYS) {
    const existing = await getDocs(collection(firestore, key))
    const ids = existing.docs.map((d) => d.id)
    if (ids.length > 0) await deleteItemsInBatches(key, ids)
    await writeItemsInBatches(key, fresh[key] as unknown as AnyItem[])
  }
  const metaRef = doc(firestore, 'meta', 'seed')
  const batch = writeBatch(firestore)
  batch.set(metaRef, { status: 'done', finishedAt: Date.now() })
  await batch.commit()
  return fresh
}
