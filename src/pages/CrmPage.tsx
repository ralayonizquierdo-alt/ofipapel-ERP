import { useMemo, useState } from 'react'
import { Contact, Plus, Trash2 } from 'lucide-react'
import { useDatabase, useCollection } from '../lib/DatabaseContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import FormField, { inputClass } from '../components/FormField'
import { formatEUR, formatDate } from '../lib/format'
import type { Oportunidad, FaseOportunidad, TipoContactoCRM } from '../types'

const FASES: FaseOportunidad[] = ['Prospección', 'Cualificación', 'Propuesta', 'Negociación', 'Ganada', 'Perdida']
const TIPOS_CONTACTO: TipoContactoCRM[] = ['Llamada', 'Visita', 'Email', 'Reunión']

const emptyForm = { nombre: '', clienteId: '', comercialId: '', fase: 'Prospección' as FaseOportunidad, importeEstimado: '0', probabilidad: '30', fechaCierreEstimada: '' }

function periodoActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function CrmPage() {
  const { db } = useDatabase()
  const { items: oportunidades, add, update, remove } = useCollection('oportunidades')
  const { items: contactos, add: addContacto } = useCollection('contactosCRM')
  const { items: objetivos } = useCollection('objetivosComerciales')

  const [selected, setSelected] = useState<Oportunidad | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [clienteFichaId, setClienteFichaId] = useState(db.clients[0]?.id ?? '')
  const [notaContacto, setNotaContacto] = useState('')
  const [tipoContacto, setTipoContacto] = useState<TipoContactoCRM>('Llamada')

  const clienteById = useMemo(() => new Map(db.clients.map((c) => [c.id, c])), [db.clients])
  const repById = useMemo(() => new Map(db.salesReps.map((r) => [r.id, r])), [db.salesReps])
  const mayoristas = useMemo(() => db.clients.filter((c) => c.tipo === 'Mayorista'), [db.clients])

  const porFase = useMemo(() => {
    const map = new Map<FaseOportunidad, Oportunidad[]>()
    FASES.forEach((f) => map.set(f, []))
    oportunidades.forEach((o) => map.get(o.fase)?.push(o))
    return map
  }, [oportunidades])

  const periodo = periodoActual()
  const ranking = useMemo(() => {
    return db.salesReps
      .map((rep) => {
        const objetivo = objetivos.find((o) => o.comercialId === rep.id && o.periodo === periodo)?.objetivoImporte ?? 0
        const logrado = db.sales.filter((s) => s.comercialId === rep.id && s.fecha.slice(0, 7) === periodo).reduce((sum, s) => sum + s.total, 0)
        return { rep, objetivo, logrado, pct: objetivo > 0 ? Math.round((logrado / objetivo) * 100) : 0 }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [db.salesReps, db.sales, objetivos, periodo])

  const historialCliente = useMemo(
    () => contactos.filter((c) => c.clienteId === clienteFichaId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [contactos, clienteFichaId],
  )

  function openEdit(o: Oportunidad) {
    setSelected(o)
    setForm({ nombre: o.nombre, clienteId: o.clienteId, comercialId: o.comercialId, fase: o.fase, importeEstimado: String(o.importeEstimado), probabilidad: String(o.probabilidad), fechaCierreEstimada: o.fechaCierreEstimada })
  }

  function openCreate() {
    const cliente = mayoristas[0]
    setForm({ ...emptyForm, clienteId: cliente?.id ?? '', comercialId: cliente?.comercialId ?? '', fechaCierreEstimada: new Date().toISOString().slice(0, 10) })
    setCreating(true)
  }

  function closeModal() {
    setSelected(null)
    setCreating(false)
  }

  function save() {
    const payload = {
      nombre: form.nombre,
      clienteId: form.clienteId,
      comercialId: form.comercialId,
      fase: form.fase,
      importeEstimado: Number(form.importeEstimado) || 0,
      probabilidad: Number(form.probabilidad) || 0,
      fechaCierreEstimada: form.fechaCierreEstimada,
    }
    if (selected) {
      update(selected.id, payload)
    } else {
      add({ id: `op-${Date.now()}`, ...payload })
    }
    closeModal()
  }

  function handleDelete() {
    if (!selected) return
    remove(selected.id)
    closeModal()
  }

  function registrarContacto() {
    const cliente = clienteById.get(clienteFichaId)
    if (!cliente || !notaContacto.trim()) return
    addContacto({
      id: `ctc-${Date.now()}`,
      clienteId: clienteFichaId,
      comercialId: cliente.comercialId,
      fecha: new Date().toISOString().slice(0, 10),
      tipo: tipoContacto,
      notas: notaContacto.trim(),
    })
    setNotaContacto('')
  }

  const modalOpen = selected !== null || creating

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <Contact size={20} className="text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">CRM comercial</h1>
        </div>
        <Badge label="Activo (Fase 3)" />
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">{oportunidades.length} oportunidades · Pipeline, historial de contacto y objetivos por comercial</p>

      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
          <Plus size={15} /> Nueva oportunidad
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-6 overflow-x-auto">
        {FASES.map((fase) => (
          <div key={fase} className="bg-slate-50 border border-slate-200 rounded-xl min-w-[160px]">
            <div className="px-3 py-2 border-b border-slate-200 text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>{fase}</span>
              <span className="text-slate-400">{porFase.get(fase)?.length ?? 0}</span>
            </div>
            <div className="p-2 space-y-2">
              {(porFase.get(fase) ?? []).map((o) => (
                <div key={o.id} onClick={() => openEdit(o)} className="bg-white border border-slate-200 rounded-lg p-2.5 cursor-pointer hover:border-slate-400">
                  <div className="text-xs font-medium text-slate-800 line-clamp-2">{clienteById.get(o.clienteId)?.nombre ?? o.nombre}</div>
                  <div className="text-xs text-slate-500 mt-1">{formatEUR(o.importeEstimado)}</div>
                  <div className="text-[11px] text-slate-400">{o.probabilidad}% · {repById.get(o.comercialId)?.nombre}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-sm font-medium text-slate-700">Objetivo vs. logrado · {periodo}</div>
          <div>
            {ranking.map(({ rep, objetivo, logrado, pct }) => (
              <div key={rep.id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-800">{rep.nombre}</span>
                  <span className="text-slate-500">
                    {formatEUR(logrado)} / {formatEUR(objetivo)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-orange-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Historial de contacto</span>
            <select className={`${inputClass} max-w-[220px] py-1.5`} value={clienteFichaId} onChange={(e) => setClienteFichaId(e.target.value)}>
              {mayoristas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {historialCliente.length === 0 && <div className="px-4 py-6 text-sm text-slate-400">Sin contactos registrados.</div>}
            {historialCliente.map((c) => (
              <div key={c.id} className="px-4 py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between">
                  <Badge label={c.tipo} />
                  <span className="text-xs text-slate-400">{formatDate(c.fecha)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{c.notas}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 flex items-center gap-2">
            <select className={`${inputClass} max-w-[120px]`} value={tipoContacto} onChange={(e) => setTipoContacto(e.target.value as TipoContactoCRM)}>
              {TIPOS_CONTACTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Nota de contacto..." value={notaContacto} onChange={(e) => setNotaContacto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && registrarContacto()} />
            <button onClick={registrarContacto} disabled={!notaContacto.trim()} className="px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 shrink-0">
              Añadir
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={selected ? selected.nombre : 'Nueva oportunidad'}
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
          <FormField label="Nombre de la oportunidad">
            <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </FormField>
          <FormField label="Cliente">
            <select
              className={inputClass}
              value={form.clienteId}
              onChange={(e) => {
                const cliente = clienteById.get(e.target.value)
                setForm({ ...form, clienteId: e.target.value, comercialId: cliente?.comercialId ?? form.comercialId })
              }}
            >
              {mayoristas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Fase">
              <select className={inputClass} value={form.fase} onChange={(e) => setForm({ ...form, fase: e.target.value as FaseOportunidad })}>
                {FASES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Probabilidad (%)">
              <input type="number" className={inputClass} value={form.probabilidad} onChange={(e) => setForm({ ...form, probabilidad: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Importe estimado (€)">
              <input type="number" className={inputClass} value={form.importeEstimado} onChange={(e) => setForm({ ...form, importeEstimado: e.target.value })} />
            </FormField>
            <FormField label="Fecha de cierre estimada">
              <input type="date" className={inputClass} value={form.fechaCierreEstimada} onChange={(e) => setForm({ ...form, fechaCierreEstimada: e.target.value })} />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  )
}
