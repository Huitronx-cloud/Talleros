export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import BadgeEstadoCotizacion from '@/components/cotizaciones/badge-estado-cotizacion'
import AccionesPdf from '@/components/cotizaciones/acciones-pdf'
import { Cotizacion } from '@/types'
import { formatMoney } from '@/lib/utils'

export default async function DetalleCotizacionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre, telefono, email)')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const c = data as Cotizacion & { clientes?: { nombre: string; telefono?: string; email?: string } | null }

  const numero     = String(c.numero_cotizacion).padStart(4, '0')
  const sym        = c.moneda === 'MXN' ? '$' : 'COP '
  const subtotal   = c.subtotal  ?? 0
  const descuento  = c.descuento ?? 0
  const impuestos  = c.impuestos ?? 0
  const total      = c.total     ?? 0
  const fmt        = (n: number) => formatMoney(n ?? 0, c.moneda)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/cotizaciones" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Volver a cotizaciones
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Cotización #{numero}</h1>
            <BadgeEstadoCotizacion estado={c.estado} />
          </div>
          <AccionesPdf
            id={c.id}
            numeroCotizacion={c.numero_cotizacion}
            estado={c.estado}
            nombreCliente={c.clientes?.nombre}
            telefonoCliente={c.clientes?.telefono}
            total={c.total}
            moneda={c.moneda}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Cliente */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
          <p className="font-semibold text-gray-900">{c.clientes?.nombre ?? '—'}</p>
          {c.clientes?.telefono && <p className="text-sm text-gray-500 mt-0.5">{c.clientes.telefono}</p>}
          {c.clientes?.email && <p className="text-sm text-gray-500">{c.clientes.email}</p>}
        </div>

        {/* Vigencia */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vigencia</p>
          <p className="font-semibold text-gray-900">{c.vigencia_dias} días</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Creada el {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Total */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Total</p>
          <p className="text-2xl font-bold text-blue-700">{sym}{fmt(total)}</p>
          <p className="text-sm text-blue-500 mt-0.5">{c.moneda}</p>
        </div>
      </div>

      {/* Servicios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Servicios</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Descripción</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Cant.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Precio unit.</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(c.servicios ?? []).map((s, i) => (
              <tr key={i}>
                <td className="px-6 py-3 text-sm text-gray-900">{s.descripcion}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{s.cantidad}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">{sym}{fmt(s.precio_unitario ?? 0)}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{sym}{fmt(s.total ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{sym}{fmt(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Descuento</span>
              <span className="text-red-600">− {sym}{fmt(descuento)}</span>
            </div>
          )}
          {impuestos > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA (16%)</span>
              <span>{sym}{fmt(impuestos)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
            <span>TOTAL</span>
            <span>{sym}{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {c.notas && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.notas}</p>
        </div>
      )}
    </div>
  )
}
