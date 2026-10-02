import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import type { Database } from '../types'
import { firestore, ensureSignedIn } from './firebase'
import { COLLECTION_KEYS, type CollectionKey } from './collections'
import { seedIfEmpty, seedMissingCollections, diffAndWrite, wipeAndReplace } from './firestoreSync'

type CollectionsState = { [K in CollectionKey]?: Database[K] }

interface DatabaseContextValue {
  db: Database
  ready: boolean
  setDb: (updater: (prev: Database) => Database) => void
  reset: () => void
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null)

const EMPTY_DB = Object.fromEntries(COLLECTION_KEYS.map((k) => [k, []])) as unknown as Database

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionsState>({})
  const [seeding, setSeeding] = useState(true)
  // Última versión conocida de la base de datos compuesta, para poder diferenciar en setDb/reset.
  const dbRef = useRef<Database>(EMPTY_DB)

  const db = useMemo<Database>(() => {
    const merged = { ...EMPTY_DB, ...collections } as Database
    dbRef.current = merged
    return merged
  }, [collections])

  const ready = COLLECTION_KEYS.every((k) => collections[k] !== undefined)

  useEffect(() => {
    let cancelled = false
    const unsubscribers: Array<() => void> = []

    ensureSignedIn()
      .then(() => seedIfEmpty())
      .then(() => seedMissingCollections())
      .catch((err) => console.error('Error preparando Firestore:', err))
      .finally(() => {
        if (cancelled) return
        setSeeding(false)
        COLLECTION_KEYS.forEach((key) => {
          const unsub = onSnapshot(
            collection(firestore, key),
            (snap) => {
              const items = snap.docs.map((d) => d.data()) as Database[typeof key]
              setCollections((prev) => ({ ...prev, [key]: items }))
            },
            (err) => console.error(`Error escuchando ${key}:`, err),
          )
          unsubscribers.push(unsub)
        })
      })

    return () => {
      cancelled = true
      unsubscribers.forEach((u) => u())
    }
  }, [])

  const value = useMemo<DatabaseContextValue>(
    () => ({
      db,
      ready: ready && !seeding,
      setDb: (updater) => {
        const prev = dbRef.current
        const next = updater(prev)
        diffAndWrite(prev, next).catch((err) => console.error('Error guardando cambios en Firestore:', err))
      },
      reset: () => {
        wipeAndReplace().catch((err) => console.error('Error restaurando datos de ejemplo:', err))
      },
    }),
    [db, ready, seeding],
  )

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext)
  if (!ctx) throw new Error('useDatabase debe usarse dentro de <DatabaseProvider>')
  return ctx
}

/** Acceso genérico de lectura/escritura a una colección de la base de datos. */
export function useCollection<K extends keyof Database>(key: K) {
  const { db, setDb } = useDatabase()
  const items = db[key]

  function add(item: Database[K][number]) {
    setDb((prev) => ({ ...prev, [key]: [item, ...prev[key]] }) as Database)
  }
  function update(id: string, patch: Partial<Database[K][number]>) {
    setDb((prev) => ({
      ...prev,
      [key]: (prev[key] as Array<{ id: string }>).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }) as Database)
  }
  function remove(id: string) {
    setDb((prev) => ({
      ...prev,
      [key]: (prev[key] as Array<{ id: string }>).filter((it) => it.id !== id),
    }) as Database)
  }

  return { items, add, update, remove }
}
