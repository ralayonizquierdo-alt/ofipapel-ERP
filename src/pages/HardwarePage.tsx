import { useMemo, useState } from 'react'
import { ScanLine, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useDatabase, useCollection } from '../lib/DatabaseContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import FormField, { inputClass } from '../components/FormField'
import type { DispositivoHardware, TipoDispositivoHardware } from '../types'

const TIPOS: TipoDispositivoHardware[] = ['Lector de código de barras', 'Impresora de etiquetas', 'Báscula', 'Impresora de tickets']

function buildForm(locations: { id: string }[]) {
  return { tipo: 'Lector de código de barras' as TipoDispositivoHardware, modelo: '', locationId: locations[0]?.id ?? '' }
}

export default function HardwarePage() {
  const { db } = useDatabase()
  const { items: dispositivos, add, update, remove } = useCollection('dispositivosHardware')
  const [selected, setSelected] = useState<DispositivoHardware | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(buildForm(db.locations))
  const [probando, setProbando] = useState<string | null>(null)

  const locationById = useMemo(() => new Map(db.locations.map((l) => [l.id, l])), [db.locations])

  const stats = useMemo(() => {
    const conectados = dispositivos.filter((d) => d.estado === 'Conectado').length
    const errores = dispositivos.filter((d) => d.estado === 'Error').length
    const desconectados = dispositivos.filter((d) => d.estado === 'Desconectado').length
    return { conectados, errores, desconectados }
  }, [dispositivos])

  function openEdit(d: DispositivoHardware) {
    setSelected(d)
    setForm({ tipo: d.tipo, modelo: d.modelo, locationId: d.locationId })
  }

  function openCreate() {
    setForm(buildForm(db.locations))
    setCreating(true)
  }

  function closeModal() {
    setSelected(null)
    setCreating(false)
  }

  function save() {
    const payload = { tipo: form.tipo, modelo: form.modelo, locationId: form.locationId }
    if (selected) {
      update(selected.id, payload)
    } else {
      add({ id: `hw-${Date.now()}`, ...payload, estado: 'Desconectado', ultimaConexion: new Date().toISOString().slice(0, 10) })
    }
    closeModal()
  }

  function handleDelete() {
    if (!selected) return
    remove(selected.id)
    closeModal()
  }

  function probarConexion(d: DispositivoHardware) {
    setProbando(d.id)
    setTimeout(() => {
      update(d.id, { estado: 'Conectado', ultimaConexion: new Date().toISOString().slice(0, 10) })
      setProbando(null)
    }, 900)
  }

  const modalOpen = selected !== null || creating

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <ScanLine size={20} className="text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Hardware POS</h1>
        </div>
        <Badge label="Activo (Fase 3)" />
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">{dispositivos.length} dispositivos · Lectores de código de barras, impresoras de etiquetas y básculas por ubicación</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={ScanLine} label="Conectados" value={String(stats.conectados)} tone="good" />
        <StatCard icon={ScanLine} label="Desconectados" value={String(stats.desconectados)} />
        <StatCard icon={ScanLine} label="Con error" value={String(stats.errores)} tone="warn" />
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
          <Plus size={15} /> Nuevo dispositivo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="text-left px-4 py-2.5">Tipo</th>
                <th className="text-left px-4 py-2.5">Modelo</th>
                <th className="text-left px-4 py-2.5">Ubicación</th>
                <th className="text-left px-4 py-2.5">Última conexión</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="text-right px-4 py-2.5">Acción</th>
              </tr>
            </thead>
            <tbody>
              {dispositivos.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800 cursor-pointer" onClick={() => openEdit(d)}>
                    {d.tipo}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 cursor-pointer" onClick={() => openEdit(d)}>
                    {d.modelo}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 cursor-pointer" onClick={() => openEdit(d)}>
                    {locationById.get(d.locationId)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{d.ultimaConexion}</td>
                  <td className="px-4 py-2.5">
                    <Badge label={d.estado} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => probarConexion(d)}
                      disabled={probando === d.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={probando === d.id ? 'animate-spin' : ''} /> Probar conexión
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={selected ? `${selected.tipo} · ${selected.modelo}` : 'Nuevo dispositivo'}
          onClose={closeModal}
          footer={
            <>
              {selected && (
                <button onClick={handleDelete} className="mr-auto flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              <button onClick={closeModal} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                Guardar
              </button>
            </>
          }
        >
          <FormField label="Tipo de dispositivo">
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDispositivoHardware })}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Modelo">
            <input className={inputClass} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
          </FormField>
          <FormField label="Ubicación">
            <select className={inputClass} value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              {db.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </FormField>
        </Modal>
      )}
    </div>
  )
}
