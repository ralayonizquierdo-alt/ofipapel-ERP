import { useState, type FormEvent, type ReactNode } from 'react'
import { Lock } from 'lucide-react'

const STORAGE_KEY = 'ofipapel-erp-unlocked'
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? ''

/**
 * Pantalla de acceso con una única contraseña compartida (no hay usuarios individuales).
 * No es seguridad fuerte — es solo una barrera para que no entre cualquiera que tope con la URL,
 * igual que el resto de apps de este ecosistema. Los datos reales los protegen las reglas de
 * Firestore (exigen sesión, aunque sea anónima), no esta pantalla.
 */
export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (APP_PASSWORD && password === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
          <Lock size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Ofipapel ERP</h1>
        <p className="text-sm text-slate-500 mb-4">Acceso restringido. Introduce la contraseña del equipo.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(false)
          }}
          placeholder="Contraseña"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 mb-2"
        />
        {error && <p className="text-xs text-red-600 mb-2">Contraseña incorrecta.</p>}
        <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
          Entrar
        </button>
      </form>
    </div>
  )
}
