import { useMemo, useState } from 'react'
import { Zap, Plus, Trash2, PackagePlus } from 'lucide-react'
import { useDatabase, useCollection } from '../lib/DatabaseContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import FormField, { inputClass } from '../components/FormField'
import { formatDate } from '../lib/format'
import type { ReglaAutomatizacion, TipoReglaAutomatizacion } from '../types'

const TIPOS: TipoReglaAutomatizacion[] = ['Reposición automática', 'Alerta predictiva', 'Regla de negocio']

const emptyForm = { nombre: '', tipo: 'Reposición automática' as TipoReglaAutomatizacion, condicion: '', accion: '' }

export default function AutomatizacionPage() {
  const { db } = useDatabase()
  const { items: reglas, add, update, remove } = useCollection('reglasAutomatizacion')
  const { items: ejecuciones, add: addEjecucion } = useCollection('ejecucionesRegla')
  const { items: purchases, add: addPurchase } = useCollection('purchases')
  const [selected, setSelected] = useState<ReglaAutomatizacion | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [generado, setGenerado] = useState<string | null>(null)

  const productById = useMemo(() => new Map(db.products.map((p) => [p.id, p])), [db.products])
  const locationById = useMemo(() => new Map(db.locations.map((l) => [l.id, l])), [db.locations])
  const almacenCentral = db.locations.find((l) => l.tipo === 'Almacén')

  const alertas = useMemo(() => db.stock.filter((s) => s.unidades < s.minimo).sort((a, b) => a.unidades / a.minimo - (b.unidades / b.minimo)), [db.stock])

  const reglaById = useMemo(() => new Map(reglas.map((r) => [r.id, r])), [reglas])
  const ejecucionesOrdenadas = useMemo(() => [...ejecuciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 20), [ejecuciones])

  function openEdit(r: ReglaAutomatizacion) {
    setSelected(r)
    setForm({ nombre: r.nombre, tipo: r.tipo, condicion: r.condicion, accion: r.accion })
  }

  function openCreate() {
    setForm(emptyForm)
    setCreating(true)
  }

  function closeModal() {
    setSelected(null)
    setCreating(false)
  }

  function save() {
    if (selected) {
      update(selected.id, form)
    } else {
      add({ id: `reg-${Date.now()}`, ...form, activa: true })
    }
    closeModal()
  }

  function handleDelete() {
    if (!selected) return
    remove(selected.id)
    closeModal()
  }

  function generarPedido(productoId: string, unidades: number, minimo: number) {
    const producto = productById.get(productoId)
    if (!producto || !almacenCentral) return
    const cantidad = Math.max(minimo * 2 - unidades, minimo)
    const numero = purchases.length + 1
    const total = Number((cantidad * producto.coste * (1 + producto.igic / 100)).toFixed(2))
    addPurchase({
      id: `C-2026-${String(200 + numero)}`,
      proveedorId: producto.proveedorId,
      locationId: almacenCentral.id,
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0, 10),
      fechaPrevista: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      lineas: [{ productoId: producto.id, cantidad, precioUnit: producto.coste, igic: producto.igic }],
      total,
    })
    const reglaReposicion = reglas.find((r) => r.tipo === 'Reposición automática' && r.activa)
    if (reglaReposicion) {
      addEjecucion({
        id: `exr-${Date.now()}`,
        reglaId: reglaReposicion.id,
        fecha: new Date().toISOString().slice(0, 10),
        resultado: `Pedido generado por ${cantidad} unidades de ${producto.nombre}`,
      })
    }
    setGenerado(`Pedido de compra creado: ${cantidad} uds. de ${producto.nombre}`)
    setTimeout(() => setGenerado(null), 4000)
  }

  const modalOpen = selected !== null || creating

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <Zap size={20} className="text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Automatización</h1>
        </div>
        <Badge label="Activo (Fase 3)" />
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">{reglas.filter((r) => r.activa).length} reglas activas · Reposición automática, alertas predictivas y reglas de negocio</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Zap} label="Reglas activas" value={String(reglas.filter((r) => r.activa).length)} />
        <StatCard icon={PackagePlus} label="Productos bajo mínimo" value={String(alertas.length)} tone="warn" />
        <StatCard icon={Zap} label="Ejecuciones registradas" value={String(ejecuciones.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Reglas configuradas</span>
            <button onClick={openCreate} className="flex items-center gap-1 text-xs font-medium text-white bg-slate-900 rounded-lg px-2.5 py-1.5 hover:bg-slate-800">
              <Plus size={13} /> Nueva regla
            </button>
          </div>
          <div>
            {reglas.map((r) => (
              <div key={r.id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between">
                  <button onClick={() => openEdit(r)} className="text-sm text-slate-800 font-medium text-left hover:underline">
                    {r.nombre}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input type="checkbox" checked={r.activa} onChange={(e) => update(r.id, { activa: e.target.checked })} />
                    Activa
                  </label>
                </div>
                <div className="text-xs text-slate-400 mt-1">{r.tipo}</div>
                <p className="text-xs text-slate-500 mt-1">{r.condicion}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-sm font-medium text-slate-700">Log de ejecuciones</div>
          <div className="max-h-[320px] overflow-y-auto">
            {ejecucionesOrdenadas.length === 0 && <div className="px-4 py-6 text-sm text-slate-400">Sin ejecuciones todavía.</div>}
            {ejecucionesOrdenadas.map((e) => (
              <div key={e.id} className="px-4 py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{reglaById.get(e.reglaId)?.nombre ?? '—'}</span>
                  <span className="text-xs text-slate-400">{formatDate(e.fecha)}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5">{e.resultado}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 text-sm font-medium text-slate-700">Productos bajo mínimo — generar reposición real</div>
        {generado && <div className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border-b border-emerald-100">{generado}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="text-left px-4 py-2.5">Producto</th>
                <th className="text-left px-4 py-2.5">Ubicación</th>
                <th className="text-right px-4 py-2.5">Unidades</th>
                <th className="text-right px-4 py-2.5">Mínimo</th>
                <th className="text-right px-4 py-2.5">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alertas.slice(0, 15).map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 text-slate-800">{productById.get(s.productoId)?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{locationById.get(s.locationId)?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-red-600 font-medium">{s.unidades}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{s.minimo}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => generarPedido(s.productoId, s.unidades, s.minimo)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <PackagePlus size={12} /> Generar pedido
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
          title={selected ? selected.nombre : 'Nueva regla'}
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
          <FormField label="Nombre de la regla">
            <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </FormField>
          <FormField label="Tipo">
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoReglaAutomatizacion })}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Condición">
            <input className={inputClass} value={form.condicion} onChange={(e) => setForm({ ...form, condicion: e.target.value })} />
          </FormField>
          <FormField label="Acción">
            <input className={inputClass} value={form.accion} onChange={(e) => setForm({ ...form, accion: e.target.value })} />
          </FormField>
        </Modal>
      )}
    </div>
  )
}
