'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Trash2 } from 'lucide-react'
import { eliminarDatosEjemplo } from '@/app/(dashboard)/clientes/actions'

/**
 * Explica de dónde salieron los clientes que el taller no recuerda haber
 * escrito, y ofrece quitarlos sin tener que borrarlos uno por uno.
 *
 * Solo se pinta si queda algo de la muestra: en cuanto se retira, desaparece y
 * no vuelve a estorbar.
 */
export default function AvisoDatosEjemplo({ cuantos }: { cuantos: number }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [pendiente, iniciar]          = useTransition()

  if (cuantos === 0) return null

  const borrar = () => {
    setError(null)
    iniciar(async () => {
      const res = await eliminarDatosEjemplo()
      if (res?.error) { setError(res.error); setConfirmando(false); return }
      router.refresh()
    })
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Te dejamos {cuantos === 1 ? 'un cliente' : `${cuantos} clientes`} de ejemplo para que veas cómo funciona
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              Puedes editarlos como cualquier otro cliente. No ocupan lugar en tu plan.
            </p>
          </div>
        </div>

        {confirmando ? (
          <div className="flex items-center gap-2">
            <button
              onClick={borrar}
              disabled={pendiente}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {pendiente ? 'Borrando…' : 'Sí, borrar'}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={pendiente}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <Trash2 className="h-4 w-4" />
            Borrar los datos de ejemplo
          </button>
        )}
      </div>

      {confirmando && !error && (
        <p className="mt-3 text-sm text-amber-700">
          Se borran los clientes y la orden de ejemplo. Tus datos reales no se tocan.
        </p>
      )}
      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>
  )
}
