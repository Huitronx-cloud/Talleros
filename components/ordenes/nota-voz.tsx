'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, Square, Play, Pause, Trash2, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  ordenId: string
  tallerId: string
}

interface NotaVoz {
  id: string
  url: string
  duracion_segundos: number
  created_at: string
}

export default function NotaVoz({ ordenId, tallerId }: Props) {
  const supabase     = createClient()
  const mediaRef     = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const timerRef     = useRef<NodeJS.Timeout | null>(null)

  const [grabando, setGrabando]       = useState(false)
  const [segundos, setSegundos]       = useState(0)
  const [subiendo, setSubiendo]       = useState(false)
  const [notas, setNotas]             = useState<NotaVoz[]>([])
  const [reproduciendo, setReproduciendo] = useState<string | null>(null)
  const [cargando, setCargando]       = useState(true)
  const [soportado, setSoportado]     = useState(true)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSoportado(false)
    }
    cargarNotas()
  }, [])

  const cargarNotas = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('notas_voz')
      .select('*')
      .eq('orden_id', ordenId)
      .order('created_at', { ascending: false })
    setNotas((data ?? []) as NotaVoz[])
    setCargando(false)
  }

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const media  = new MediaRecorder(stream)
      mediaRef.current  = media
      chunksRef.current = []

      media.ondataavailable = e => chunksRef.current.push(e.data)
      media.start()

      setGrabando(true)
      setSegundos(0)
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000)
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  const detenerGrabacion = () => {
    if (!mediaRef.current) return
    mediaRef.current.onstop = async () => {
      const blob     = new Blob(chunksRef.current, { type: 'audio/webm' })
      const duracion = segundos
      await subirNota(blob, duracion)

      // Detener tracks del micrófono
      mediaRef.current?.stream.getTracks().forEach(t => t.stop())
    }
    mediaRef.current.stop()
    setGrabando(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const subirNota = async (blob: Blob, duracion: number) => {
    setSubiendo(true)
    const filename = `${tallerId}/${ordenId}/${Date.now()}.webm`

    const { error: uploadError } = await supabase.storage
      .from('notas-voz')
      .upload(filename, blob, { contentType: 'audio/webm', upsert: false })

    if (uploadError) {
      console.error('Error subiendo nota de voz:', uploadError)
      setSubiendo(false)
      return
    }

    const { data: urlData } = supabase.storage.from('notas-voz').getPublicUrl(filename)

    await supabase.from('notas_voz').insert({
      orden_id:          ordenId,
      taller_id:         tallerId,
      url:               urlData.publicUrl,
      duracion_segundos: duracion,
    })

    await cargarNotas()
    setSegundos(0)
    setSubiendo(false)
  }

  const reproducirNota = (nota: NotaVoz) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (reproduciendo === nota.id) {
      setReproduciendo(null)
      return
    }
    const audio = new Audio(nota.url)
    audioRef.current = audio
    audio.play()
    setReproduciendo(nota.id)
    audio.onended = () => setReproduciendo(null)
  }

  const eliminarNota = async (nota: NotaVoz) => {
    if (!confirm('¿Eliminar esta nota de voz?')) return
    await supabase.from('notas_voz').delete().eq('id', nota.id)
    setNotas(prev => prev.filter(n => n.id !== nota.id))
  }

  const formatSeg = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (!soportado) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-xs text-gray-400">Notas de voz no disponibles en este dispositivo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Grabador */}
      <div className={`rounded-xl border-2 p-4 transition-all ${
        grabando ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
      }`}>
        {grabando ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-semibold text-red-700">Grabando...</p>
              <span className="text-sm font-mono text-red-600 ml-auto">{formatSeg(segundos)}</span>
            </div>
            <button
              onClick={detenerGrabacion}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-3 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" /> Detener grabación
            </button>
          </div>
        ) : subiendo ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Guardando nota de voz...</p>
          </div>
        ) : (
          <button
            onClick={iniciarGrabacion}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-lg transition-colors"
          >
            <Mic className="w-4 h-4" /> Grabar nota de voz
          </button>
        )}
      </div>

      {/* Lista de notas */}
      {cargando ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : notas.length > 0 ? (
        <div className="space-y-2">
          {notas.map((nota, i) => (
            <div key={nota.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <button
                onClick={() => reproducirNota(nota)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  reproduciendo === nota.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {reproduciendo === nota.id
                  ? <Pause className="w-3.5 h-3.5" />
                  : <Play  className="w-3.5 h-3.5 ml-0.5" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">Nota {notas.length - i}</p>
                <p className="text-xs text-gray-400">
                  {formatSeg(nota.duracion_segundos)} · {new Date(nota.created_at).toLocaleString('es-MX', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => eliminarNota(nota)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}