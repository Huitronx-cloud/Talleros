'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle2, Loader2, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const TAMAÑO_MAXIMO_MB = 5

export default function FotosDiagnostico({ ordenId, tallerId }: { ordenId: string; tallerId: string }) {
  const [fotos, setFotos] = useState<{ url: string; descripcion: string }[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setExito(false)

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setError('Formato no soportado. Sube una foto en JPG, PNG, WEBP o HEIC.')
      return
    }
    if (file.size > TAMAÑO_MAXIMO_MB * 1024 * 1024) {
      setError(`La foto pesa demasiado. El máximo es ${TAMAÑO_MAXIMO_MB} MB.`)
      return
    }

    setSubiendo(true)

    const ext = file.name.split('.').pop()
    const path = `${tallerId}/${ordenId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('diagnosticos')
      .upload(path, file)

    if (uploadError) {
      console.error('Error subiendo foto:', uploadError)
      setError('No se pudo subir la foto. Intenta de nuevo.')
      setSubiendo(false)
      return
    }

    const { data } = supabase.storage.from('diagnosticos').getPublicUrl(path)

    const { error: insertError } = await supabase.from('fotos_diagnostico').insert({
      orden_id: ordenId,
      taller_id: tallerId,
      url: data.publicUrl,
      descripcion,
    })

    if (insertError) {
      console.error('Error guardando foto:', insertError)
      await supabase.storage.from('diagnosticos').remove([path])
      setError('No se pudo guardar la foto. Intenta de nuevo.')
      setSubiendo(false)
      return
    }

    setFotos(prev => [...prev, { url: data.publicUrl, descripcion }])
    setDescripcion('')
    setSubiendo(false)
  }

  const handleEnviarFotos = async () => {
    if (fotos.length === 0) return
    setEnviando(true)
    setError('')
    setExito(false)
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'fotos_diagnostico',
          ordenId,
          fotos,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudieron enviar las fotos por WhatsApp.')
      } else {
        setExito(true)
        setTimeout(() => setExito(false), 5000)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('No se pudieron enviar las fotos por WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-900">Fotos del diagnóstico</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Sube fotos del problema y envíaselas al cliente por WhatsApp.</p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
      )}

      {exito && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Fotos enviadas con éxito por WhatsApp
        </p>
      )}

      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Describe la foto (ej. Fuga de aceite en junta)"
className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {subiendo
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Camera className="w-3.5 h-3.5" />
          }
          {subiendo ? 'Subiendo...' : 'Tomar o subir foto'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleSubirFoto}
        />
      </div>

      {fotos.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((foto, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={foto.url} alt={foto.descripcion} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <button
            onClick={handleEnviarFotos}
            disabled={enviando}
            className="flex items-center gap-2 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors w-full justify-center"
          >
            {enviando
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
            Enviar {fotos.length} foto{fotos.length > 1 ? 's' : ''} al cliente por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}