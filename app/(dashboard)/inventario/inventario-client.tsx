'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Package, AlertTriangle, TrendingDown,
  TrendingUp, Edit2, Trash2, Loader2, X, ChevronDown
} from 'lucide-react'

interface Producto {
  id: string
  nombre: string
  codigo: string | null
  descripcion: string | null
  precio_costo: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  unidad: string
  categoria: string | null
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

const CATEGORIAS = ['Motor', 'Frenos', 'Suspensión', 'Eléctrico', 'Transmisión', 'Carrocería', 'Lubricantes', 'Filtros', 'Neumáticos', 'Otro']
const UNIDADES   = ['pieza', 'litro', 'metro', 'par', 'juego', 'kit']

interface Props {
  productosIniciales: Producto[]
  tallerId: string
}

const PRODUCTO_VACIO = {
  nombre: '', codigo: '', descripcion: '', precio_costo: '',
  precio_venta: '', stock_actual: '', stock_minimo: '5',
  unidad: 'pieza', categoria: '',
}

export default function InventarioClient({ productosIniciales, tallerId }: Props) {
  const supabase = createClient()

  const [productos, setProductos]   = useState(productosIniciales)
  const [busqueda, setBusqueda]     = useState('')
  const [filtro, setFiltro]         = useState<'todos' | 'bajo' | 'ok'>('todos')
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState<Producto | null>(null)
  const [form, setForm]             = useState(PRODUCTO_VACIO)
  const [guardando, setGuardando]   = useState(false)
  const [ajusteId, setAjusteId]     = useState<string | null>(null)
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [ajusteTipo, setAjusteTipo] = useState<'entrada' | 'salida'>('entrada')

  const filtrados = productos.filter(p => {
    const coincide = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
    const stockOk = filtro === 'todos' ? true :
      filtro === 'bajo' ? p.stock_actual <= p.stock_minimo :
      p.stock_actual > p.stock_minimo
    return coincide && stockOk
  })

  const bajosStock = productos.filter(p => p.stock_actual <= p.stock_minimo).length

  const abrirNuevo = () => {
    setEditando(null)
    setForm(PRODUCTO_VACIO)
    setModal(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({
      nombre:        p.nombre,
      codigo:        p.codigo ?? '',
      descripcion:   p.descripcion ?? '',
      precio_costo:  String(p.precio_costo),
      precio_venta:  String(p.precio_venta),
      stock_actual:  String(p.stock_actual),
      stock_minimo:  String(p.stock_minimo),
      unidad:        p.unidad,
      categoria:     p.categoria ?? '',
    })
    setModal(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)

    const datos = {
      taller_id:    tallerId,
      nombre:       form.nombre.trim(),
      codigo:       form.codigo.trim() || null,
      descripcion:  form.descripcion.trim() || null,
      precio_costo: parseFloat(form.precio_costo) || 0,
      precio_venta: parseFloat(form.precio_venta) || 0,
      stock_actual: parseInt(form.stock_actual) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 5,
      unidad:       form.unidad,
      categoria:    form.categoria || null,
    }

    if (editando) {
      const { data } = await supabase
        .from('inventario').update(datos).eq('id', editando.id).select().single()
      if (data) setProductos(prev => prev.map(p => p.id === editando.id ? data as Producto : p))
    } else {
      const { data } = await supabase
        .from('inventario').insert(datos).select().single()
      if (data) setProductos(prev => [...prev, data as Producto])
    }

    setModal(false)
    setGuardando(false)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('inventario').delete().eq('id', id)
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  const handleAjuste = async (productoId: string) => {
    const cantidad = parseInt(ajusteCantidad)
    if (!cantidad || cantidad <= 0) return

    const delta = ajusteTipo === 'entrada' ? cantidad : -cantidad
    const producto = productos.find(p => p.id === productoId)!
    const nuevoStock = Math.max(0, producto.stock_actual + delta)

    await supabase.from('inventario')
      .update({ stock_actual: nuevoStock })
      .eq('id', productoId)

    await supabase.from('inventario_movimientos').insert({
      taller_id:   tallerId,
      producto_id: productoId,
      tipo:        ajusteTipo === 'entrada' ? 'entrada' : 'salida',
      cantidad,
      nota:        'Ajuste manual',
    })

    setProductos(prev => prev.map(p =>
      p.id === productoId ? { ...p, stock_actual: nuevoStock } : p
    ))
    setAjusteId(null)
    setAjusteCantidad('')
  }

  return (
    <div>
      {/* Alertas de stock bajo */}
      {bajosStock > 0 && (
        <div
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setFiltro('bajo')}
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            {bajosStock} {bajosStock === 1 ? 'producto tiene' : 'productos tienen'} stock bajo o agotado — toca para verlos
          </p>
        </div>
      )}

      {/* Encabezado y controles */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o categoría..."
            className={`${INPUT} pl-10`}
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'bajo', 'ok'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                filtro === f
                  ? f === 'bajo' ? 'bg-amber-500 text-white border-transparent'
                  : f === 'ok'   ? 'bg-green-600 text-white border-transparent'
                  :                'bg-gray-800 text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'bajo' ? '⚠ Stock bajo' : '✓ OK'}
            </button>
          ))}
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {busqueda || filtro !== 'todos' ? 'Sin resultados' : 'Agrega tu primera refacción'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Costo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Venta</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Mínimo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(p => {
                  const bajo = p.stock_actual <= p.stock_minimo
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.nombre}</p>
                        {p.codigo && <p className="text-xs text-gray-400 font-mono">{p.codigo}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.categoria ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ${p.precio_costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${p.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ajusteId === p.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => setAjusteTipo('salida')}
                              className={`px-2 py-1 text-xs rounded font-bold ${ajusteTipo === 'salida' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >-</button>
                            <input
                              type="number"
                              value={ajusteCantidad}
                              onChange={e => setAjusteCantidad(e.target.value)}
                              className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-xs"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && handleAjuste(p.id)}
                            />
                            <button
                              onClick={() => setAjusteTipo('entrada')}
                              className={`px-2 py-1 text-xs rounded font-bold ${ajusteTipo === 'entrada' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >+</button>
                            <button onClick={() => handleAjuste(p.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-bold">✓</button>
                            <button onClick={() => setAjusteId(null)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAjusteId(p.id); setAjusteCantidad(''); setAjusteTipo('entrada') }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              bajo
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {bajo && <span className="mr-1">⚠</span>}
                            {p.stock_actual} {p.unidad}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">{p.stock_minimo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => abrirEditar(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEliminar(p.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal agregar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nombre}
                    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej. Filtro de aceite" className={INPUT} autoFocus />
                </div>
                <div>
                  <label className={LABEL}>Código / SKU</label>
                  <input type="text" value={form.codigo}
                    onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                    placeholder="FIL-001" className={INPUT} />
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
                  <label className={LABEL}>Precio de costo</label>
                  <input type="number" value={form.precio_costo}
                    onChange={e => setForm(p => ({ ...p, precio_costo: e.target.value }))}
                    placeholder="0.00" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Precio de venta</label>
                  <input type="number" value={form.precio_venta}
                    onChange={e => setForm(p => ({ ...p, precio_venta: e.target.value }))}
                    placeholder="0.00" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Stock actual</label>
                  <input type="number" value={form.stock_actual}
                    onChange={e => setForm(p => ({ ...p, stock_actual: e.target.value }))}
                    placeholder="0" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Stock mínimo</label>
                  <input type="number" value={form.stock_minimo}
                    onChange={e => setForm(p => ({ ...p, stock_minimo: e.target.value }))}
                    placeholder="5" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Unidad</label>
                  <select value={form.unidad}
                    onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))}
                    className={INPUT}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Descripción (opcional)</label>
                  <textarea rows={2} value={form.descripcion}
                    onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Notas sobre este producto..." className={`${INPUT} resize-none`} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleGuardar} disabled={guardando || !form.nombre.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                  {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}