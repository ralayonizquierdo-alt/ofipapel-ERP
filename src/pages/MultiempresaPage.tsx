import { useMemo, useState } from 'react'
import { Building2, Plus, Trash2, TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { useCollection } from '../lib/DatabaseContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import FormField, { inputClass } from '../components/FormField'
import { formatEUR } from '../lib/format'
import type { Empresa, Moneda } from '../types'

const MONEDAS: Moneda[] = ['EUR', 'USD', 'GBP', 'MAD']

const emptyForm = { nombre: '', cif: '', pais: '', moneda: 'EUR' as Moneda, tipoCambioAEur: '1', activa: true, ingresos: '0', gastos: '0' }

export default function MultiempresaPage() {
  const { items: empresas, add, update, remove } = useCollection('empresas')
  const [selected, setSelected] = useState<Empresa | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const consolidado = useMemo(() => {
    const activas = empresas.filter((e) => e.activa)
    const ingresosEur = activas.reduce((sum, e) => sum + e.ingresos * e.tipoCambioAEur, 0)
    const gastosEur = activas.reduce((sum, e) => sum + e.gastos * e.tipoCambioAEur, 0)
    return { activas: activas.length, ingresosEur, gastosEur, resultadoEur: ingresosEur - gastosEur }
  }, [empresas])

  function openEdit(e: Empresa) {
    setSelected(e)
    setForm({ nombre: e.nombre, cif: e.cif, pais: e.pais, moneda: e.moneda, tipoCambioAEur: String(e.tipoCambioAEur), activa: e.activa, ingresos: String(e.ingresos), gastos: String(e.gastos) })
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
    const payload = {
      nombre: form.nombre,
      cif: form.cif,
      pais: form.pais,
      moneda: form.moneda,
      tipoCambioAEur: Number(form.tipoCambioAEur) || 1,
      esMatriz: selected?.esMatriz ?? false,
      activa: form.activa,
      ingresos: Number(form.ingresos) || 0,
      gastos: Number(form.gastos) || 0,
    }
    if (selected) {
      update(selected.id, payload)
    } else {
      add({ id: `emp-${Date.now()}`, ...payload })
    }
    closeModal()
  }

  function handleDelete() {
    if (!selected || selected.esMatriz) return
    remove(selected.id)
    closeModal()
  }

  const modalOpen = selected !== null || creating

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <Building2 size={20} className="text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Multi-empresa / divisa</h1>
        </div>
        <Badge label="Activo (Fase 3)" />
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">
        {empresas.length} sociedades · Resultados consolidados en euros según el tipo de cambio de cada una
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2} label="Sociedades activas" value={String(consolidado.activas)} />
        <StatCard icon={TrendingUp} label="Ingresos consolidados" value={formatEUR(consolidado.ingresosEur)} tone="good" />
        <StatCard icon={TrendingDown} label="Gastos consolidados" value={formatEUR(consolidado.gastosEur)} tone="warn" />
        <StatCard icon={Scale} label="Resultado consolidado" value={formatEUR(consolidado.resultadoEur)} tone={consolidado.resultadoEur >= 0 ? 'good' : 'warn'} />
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
          <Plus size={15} /> Nueva sociedad
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="text-left px-4 py-2.5">Sociedad</th>
                <th className="text-left px-4 py-2.5">País</th>
                <th className="text-left px-4 py-2.5">Moneda</th>
                <th className="text-right px-4 py-2.5">Tipo de cambio</th>
                <th className="text-right px-4 py-2.5">Ingresos</th>
                <th className="text-right px-4 py-2.5">Gastos</th>
                <th className="text-right px-4 py-2.5">Resultado (EUR)</th>
                <th className="text-left px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => {
                const resultadoEur = (e.ingresos - e.gastos) * e.tipoCambioAEur
                return (
                  <tr key={e.id} onClick={() => openEdit(e)} className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-800 font-medium">
                      {e.nombre} {e.esMatriz && <span className="text-xs text-slate-400 font-normal">(matriz)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{e.pais}</td>
                    <td className="px-4 py-2.5 text-slate-600">{e.moneda}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{e.tipoCambioAEur}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{e.ingresos.toLocaleString('es-ES')} {e.moneda}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{e.gastos.toLocaleString('es-ES')} {e.moneda}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${resultadoEur >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatEUR(resultadoEur)}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={e.activa ? 'Activa' : 'Inactiva'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={selected ? selected.nombre : 'Nueva sociedad'}
          subtitle={selected ? `${selected.cif} · ${selected.pais}` : undefined}
          onClose={closeModal}
          footer={
            <>
              {selected && !selected.esMatriz && (
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
          <FormField label="Nombre / Razón social">
            <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="CIF / nº fiscal">
              <input className={inputClass} value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value })} />
            </FormField>
            <FormField label="País">
              <input className={inputClass} value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Moneda">
              <select className={inputClass} value={form.moneda} disabled={selected?.esMatriz} onChange={(e) => setForm({ ...form, moneda: e.target.value as Moneda })}>
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Tipo de cambio a EUR">
              <input type="number" step="0.001" className={inputClass} disabled={selected?.esMatriz} value={form.tipoCambioAEur} onChange={(e) => setForm({ ...form, tipoCambioAEur: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label={`Ingresos (${form.moneda})`}>
              <input type="number" className={inputClass} value={form.ingresos} onChange={(e) => setForm({ ...form, ingresos: e.target.value })} />
            </FormField>
            <FormField label={`Gastos (${form.moneda})`}>
              <input type="number" className={inputClass} value={form.gastos} onChange={(e) => setForm({ ...form, gastos: e.target.value })} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 mt-1">
            <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
            Sociedad activa
          </label>
        </Modal>
      )}
    </div>
  )
}
