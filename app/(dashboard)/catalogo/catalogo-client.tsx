'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Loader2, X, Clock, Search } from 'lucide-react'

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string | null
  tiempo_estimado: number | null
  activo: boolean
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

const CATEGORIAS = ['Mantenimiento', 'Motor', 'Frenos', 'Suspensión', 'Eléctrico', 'Transmisión', 'Carrocería', 'Diagnóstico', 'Otro']

const VACIO = { nombre: '', descripcion: '', precio: '', categoria: '', tiempo_estimado: '' }

interface Props {
  serviciosIniciales: Servicio[]
  tallerId: string
}

export default function CatalogoClient({ serviciosIniciales, tallerId }: Props) {
  const supabase = createClient()
  const [servicios, setServicios]   = useState(serviciosIniciales)
  const [busqueda, setBusqueda]     = useState('')
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState<Servicio | null>(null)
  const [form, setForm]             = useState(VACIO)
  const [guardando, setGuardando]   = useState(false)

  const filtrados = servicios.filter(s =>
    !busqueda ||
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const porCategoria = CATEGORIAS.reduce((acc, cat) => {
    const items = filtrados.filter(s => s.categoria === cat && s.activo)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Servicio[]>)

  const sinCategoria = filtrados.filter(s => !s.categoria && s.activo)

  const abrirNuevo = () => {
    setEditando(null)
    setForm(VACIO)
    setModal(true)
  }

  const abrirEditar = (s: Servicio) => {
    setEditando(s)
    setForm({
      nombre:          s.nombre,
      descripcion:     s.descripcion ?? '',
      precio:          String(s.precio),
      categoria:       s.categoria ?? '',
      tiempo_estimado: s.tiempo_estimado ? String(s.tiempo_estimado) : '',
    })
    setModal(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)

    const datos = {
      taller_id:       tallerId,
      nombre:          form.nombre.trim(),
      descripcion:     form.descripcion.trim() || null,
      precio:          parseFloat(form.precio) || 0,
      categoria:       form.categoria || null,
      tiempo_estimado: parseInt(form.tiempo_estimado) || null,
    }

    if (editando) {
      const { data } = await supabase
        .from('catalogo_servicios').update(datos).eq('id', editando.id).select().single()
      if (data) setServicios(prev => prev.map(s => s.id === editando.id ? data as Servicio : s))
    } else {
      const { data } = await supabase
        .from('catalogo_servicios').insert({ ...datos, activo: true }).select().single()
      if (data) setServicios(prev => [...prev, data as Servicio])
    }
    setModal(false)
    setGuardando(false)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este servicio del catálogo?')) return
    await supabase.from('catalogo_servicios').delete().eq('id', id)
    setServicios(prev => prev.filter(s => s.id !== id))
  }

  const renderServicios = (items: Servicio[]) => items.map(s => (
    <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{s.nombre}</p>
        {s.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.descripcion}</p>}
        {s.tiempo_estimado && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {s.tiempo_estimado >= 60
                ? `${Math.floor(s.tiempo_estimado / 60)}h ${s.tiempo_estimado % 60 > 0 ? `${s.tiempo_estimado % 60}m` : ''}`
                : `${s.tiempo_estimado}m`}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <p className="text-base font-bold text-gray-900">
          ${s.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
        <button onClick={() => abrirEditar(s)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleEliminar(s.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  ))

  return (
    <div>
      {/* Controles */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar servicio..." className={`${INPUT} pl-10`} />
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Agregar servicio
        </button>
      </div>

      {/* Lista agrupada por categoría */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">
            {busqueda ? 'Sin resultados' : 'Agrega tu primer servicio al catálogo'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{cat}</p>
              </div>
              {renderServicios(items)}
            </div>
          ))}
          {sinCategoria.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sin categoría</p>
              </div>
              {renderServicios(sinCategoria)}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editando ? 'Editar servicio' : 'Nuevo servicio'}
              </h2>
              <button onClick={() => setModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Nombre del servicio <span className="text-red-500">*</span></label>
                <input type="text" value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Cambio de aceite y filtro" className={INPUT} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Precio</label>
                  <input type="number" value={form.precio}
                    onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                    placeholder="0.00" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Tiempo estimado (min)</label>
                  <input type="number" value={form.tiempo_estimado}
                    onChange={e => setForm(p => ({ ...p, tiempo_estimado: e.target.value }))}
                    placeholder="Ej. 60" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Categoría</label>
                <select value={form.categoria}
                  onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                  className={INPUT}>
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Descripción (opcional)</label>
                <textarea rows={2} value={form.descripcion}
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Detalles del servicio..." className={`${INPUT} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleGuardar} disabled={guardando || !form.nombre.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                  {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}