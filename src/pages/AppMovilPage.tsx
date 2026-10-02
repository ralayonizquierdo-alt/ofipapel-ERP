import { useEffect, useMemo, useState } from 'react'
import { Smartphone, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { useDatabase, useCollection } from '../lib/DatabaseContext'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'

const DOWNLOAD_URL = 'https://ralayonizquierdo-alt.github.io/ofipapel-ERP/app-movil'

export default function AppMovilPage() {
  const { db } = useDatabase()
  const { items: dispositivos, update } = useCollection('dispositivosApp')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const userById = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users])

  useEffect(() => {
    QRCode.toDataURL(DOWNLOAD_URL, { margin: 1, width: 180 }).then(setQrDataUrl)
  }, [])

  const stats = useMemo(() => {
    const conectados = dispositivos.filter((d) => d.estado === 'Conectado').length
    const comerciales = dispositivos.filter((d) => d.consultaStock || d.pedidosInSitu).length
    const almacen = dispositivos.filter((d) => d.preparacionAlmacen).length
    return { conectados, comerciales, almacen }
  }, [dispositivos])

  function toggleFuncion(id: string, campo: 'consultaStock' | 'pedidosInSitu' | 'preparacionAlmacen', valor: boolean) {
    update(id, { [campo]: valor })
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <Smartphone size={20} className="text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">App móvil</h1>
        </div>
        <Badge label="Activo (Fase 3)" />
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">{dispositivos.length} dispositivos del equipo · Consulta de stock en ruta, pedidos in situ y preparación de almacén</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Smartphone} label="Dispositivos conectados" value={String(stats.conectados)} tone="good" />
        <StatCard icon={Smartphone} label="Comerciales con app activa" value={String(stats.comerciales)} />
        <StatCard icon={Smartphone} label="Dispositivos de almacén" value={String(stats.almacen)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-sm font-medium text-slate-700">Dispositivos del equipo</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="text-left px-4 py-2.5">Usuario</th>
                  <th className="text-left px-4 py-2.5">Plataforma</th>
                  <th className="text-left px-4 py-2.5">Versión</th>
                  <th className="text-left px-4 py-2.5">Últ. sincronización</th>
                  <th className="text-left px-4 py-2.5">Estado</th>
                  <th className="text-left px-4 py-2.5">Funciones activas</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-800">{userById.get(d.usuarioId)?.nombre ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{d.plataforma}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{d.version}</td>
                    <td className="px-4 py-2.5 text-slate-500">{d.ultimaSincronizacion}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={d.estado} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={d.consultaStock} onChange={(e) => toggleFuncion(d.id, 'consultaStock', e.target.checked)} /> Consulta stock
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={d.pedidosInSitu} onChange={(e) => toggleFuncion(d.id, 'pedidosInSitu', e.target.checked)} /> Pedidos in situ
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={d.preparacionAlmacen} onChange={(e) => toggleFuncion(d.id, 'preparacionAlmacen', e.target.checked)} /> Prep. almacén
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
          <QrCode size={16} className="text-slate-400 mb-2" />
          <div className="text-sm font-medium text-slate-700 mb-3">Descarga de la app</div>
          {qrDataUrl ? <img src={qrDataUrl} alt="Código QR de descarga" className="rounded-lg" /> : <div className="w-[180px] h-[180px] bg-slate-100 rounded-lg animate-pulse" />}
          <p className="text-xs text-slate-400 mt-3 break-all">{DOWNLOAD_URL}</p>
        </div>
      </div>
    </div>
  )
}
