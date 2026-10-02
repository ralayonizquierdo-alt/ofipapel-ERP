import { useDatabase } from '../lib/DatabaseContext'
import type { ReactNode } from 'react'

export default function LoadingGate({ children }: { children: ReactNode }) {
  const { ready } = useDatabase()
  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Conectando con la base de datos…</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
