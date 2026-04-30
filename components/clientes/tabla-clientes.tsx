'use client'

import { useState } from 'react'
import { Users, Pencil, Trash2, Search, Plus, Phone, Mail, Car } from 'lucide-react'
import { Cliente } from '@/types'
import { eliminarCliente } from '@/app/(dashboard)/clientes/actions'
import ModalCliente from './modal-cliente'

interface Props {
  clientes: Cliente[]
}

export default function TablaClientes({ clientes }: Props) {
  const [busqueda, setBusqueda]           = useState('')
  const [modalAbierto, setModalAbierto]   = useState(false)
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null)
  const [eliminando, setEliminando]       = useState<string | null>(null)
  const [confirmar, setConfirmar]         = useState<string | null>(null)

  // Búsqueda por nombre o placas
  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.placas   ?? '').toUpperCase().includes(busqueda.toUpperCase()) ||
    (c.telefono ?? '').includes(busqueda) ||
    (c.email    ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirNuevo  = () => { setClienteEditar(null); setModalAbierto(true) }
  const abrirEditar = (c: Cliente) => { setClienteEditar(c); setModalAbierto(true) }
  const cerrarModal = () => { setModalAbierto(false); setClienteEditar(null) }

  const handleEliminar = async (id: string) => {
    setEliminando(id)
    await eliminarCliente(id)
    setEliminando(null)
    setConfirmar(null)
  }

  return (
    <>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, placas, teléfono o email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">
              {busqueda ? 'Sin resultados para tu búsqueda' : 'Sin clientes aún'}
            </p>
            {!busqueda && (
              <p className="text-gray-300 text-xs mt-1">Agrega tu primer cliente para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehículo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">

                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-sm font-bold">
                            {c.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.telefono && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {c.telefono}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {c.email}
                          </div>
                        )}
                        {!c.telefono && !c.email && (
                          <span className="text-xs text-gray-400">Sin contacto</span>
                        )}
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td className="px-6 py-4">
                      {(c.vehiculo_marca || c.placas) ? (
                        <div className="space-y-1">
                          {c.vehiculo_marca && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Car className="w-3.5 h-3.5 text-gray-400" />
                              {[c.vehiculo_marca, c.vehiculo_modelo, c.vehiculo_año].filter(Boolean).join(' ')}
                            </div>
                          )}
                          {c.placas && (
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs font-mono font-semibold px-2 py-0.5 rounded">
                              {c.placas}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin vehículo</span>
                      )}
                    </td>

                    {/* Notas */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-700 truncate">
                        {c.notas || <span className="text-gray-400">—</span>}
                      </p>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>

                        {confirmar === c.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEliminar(c.id)}
                              disabled={eliminando === c.id}
                              className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded-lg"
                            >
                              {eliminando === c.id ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmar(null)}
                              className="text-xs font-medium text-gray-500 px-2 py-1 hover:bg-gray-100 rounded-lg"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmar(c.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalCliente cliente={clienteEditar} onCerrar={cerrarModal} />
      )}
    </>
  )
}
