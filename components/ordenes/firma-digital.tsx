'use client'

import { useRef, useState, useEffect } from 'react'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  ordenId: string
  tallerId: string
  onFirmado: () => void
  onOmitir: () => void
}

export default function FirmaDigital({ ordenId, tallerId, onFirmado, onOmitir }: Props) {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const [dibujando, setDibujando]   = useState(false)
  const [tieneFirma, setTieneFirma] = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [listo, setListo]           = useState(false)
  const supabase = createClient()

  // Configurar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const iniciarTrazo = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDibujando(true)
    setTieneFirma(true)
  }

  const dibujar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!dibujando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const terminarTrazo = () => setDibujando(false)

  const limpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTieneFirma(false)
  }

  const guardarFirma = async () => {
    const canvas = canvasRef.current
    if (!canvas || !tieneFirma) return
    setGuardando(true)

    try {
      // Convertir canvas a blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Error al convertir firma')), 'image/png')
      })

      const path = `${tallerId}/${ordenId}/firma_${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('diagnosticos')
        .upload(path, blob, { contentType: 'image/png', upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('diagnosticos').getPublicUrl(path)

      // Guardar referencia en fotos_diagnostico con tipo 'firma'
      await supabase.from('fotos_diagnostico').insert({
        orden_id:    ordenId,
        taller_id:   tallerId,
        url:         data.publicUrl,
        descripcion: 'Firma digital del cliente al entregar el vehículo',
        tipo:        'firma',
      })

      // Marcar la orden con fecha de firma
      await supabase.from('ordenes')
        .update({ firma_cliente_url: data.publicUrl })
        .eq('id', ordenId)

      setListo(true)
      setTimeout(onFirmado, 1500)
    } catch (err) {
      console.error('Error guardando firma:', err)
    } finally {
      setGuardando(false)
    }
  }

  if (listo) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Firma guardada</h3>
        <p className="text-sm text-gray-400">Continuando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Firma del cliente</h3>
        <p className="text-sm text-gray-500 mt-1">
          El cliente firma confirmando que entregó el vehículo y está de acuerdo con las condiciones registradas.
        </p>
      </div>

      {/* Canvas de firma */}
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Firme aquí</p>
          <button
            onClick={limpiar}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-40 touch-none cursor-crosshair"
          onMouseDown={iniciarTrazo}
          onMouseMove={dibujar}
          onMouseUp={terminarTrazo}
          onMouseLeave={terminarTrazo}
          onTouchStart={iniciarTrazo}
          onTouchMove={dibujar}
          onTouchEnd={terminarTrazo}
        />
        {!tieneFirma && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Al firmar, el cliente confirma el estado del vehículo al momento de la recepción.
      </p>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={onOmitir}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          Omitir
        </button>
        <button
          onClick={guardarFirma}
          disabled={!tieneFirma || guardando}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {guardando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando firma...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Confirmar firma</>
          )}
        </button>
      </div>
    </div>
  )
}