'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle2, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FirmaDigital from './firma-digital'

const ITEMS_CHECKLIST = [
  'Carrocería sin daños visibles',
  'Vidrios y espejos en buen estado',
  'Llantas sin daños',
  'Nivel de gasolina registrado',
  'Interior sin daños',
  'Luces funcionando',
  'Accesorios y objetos de valor retirados',
]

interface Foto {
  url: string
  descripcion: string
}

interface Props {
  ordenId: string
  tallerId: string
  onTerminar: () => void
}

type Etapa = 'checklist' | 'firma'

export default function ChecklistRecepcion({ ordenId, tallerId, onTerminar }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa]           = useState<Etapa>('checklist')
  const [checks, setChecks]         = useState<Record<string, boolean>>({})
  const [fotos, setFotos]           = useState<Foto[]>([])
  const [subiendo, setSubiendo]     = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [listo, setListo]           = useState(false)
  const [fotoActual, setFotoActual] = useState<{ url: string; file: File } | null>(null)
  const [descripcion, setDescripcion] = useState('')

  const toggleCheck = (item: string) =>
    setChecks(prev => ({ ...prev, [item]: !prev[item] }))

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoActual({ url: URL.createObjectURL(file), file })
    setDescripcion('')
  }

  const confirmarFoto = async () => {
    if (!fotoActual) return
    setSubiendo(true)
    try {
      const ext  = fotoActual.file.name.split('.').pop()
      const path = `${tallerId}/${ordenId}/recepcion_${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('fotos-diagnostico')
        .upload(path, fotoActual.file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('fotos-diagnostico').getPublicUrl(path)
      setFotos(prev => [...prev, { url: data.publicUrl, descripcion }])
      setFotoActual(null)
      setDescripcion('')
    } catch (err) {
      console.error('Error subiendo foto:', err)
    } finally {
      setSubiendo(false)
    }
  }

  const quitarFoto = (i: number) =>
    setFotos(prev => prev.filter((_, idx) => idx !== i))

  const handleGuardarChecklist = async () => {
    setGuardando(true)
    try {
      if (fotos.length > 0) {
        await supabase.from('fotos_diagnostico').insert(
          fotos.map(f => ({
            orden_id:    ordenId,
            taller_id:   tallerId,
            url:         f.url,
            descripcion: f.descripcion || 'Foto de recepción',
            tipo:        'recepcion',
          }))
        )
      }
      const itemsOk  = ITEMS_CHECKLIST.filter(i => checks[i])
      const itemsNok = ITEMS_CHECKLIST.filter(i => !checks[i])
      const nota = [
        '✅ CHECKLIST DE RECEPCIÓN',
        itemsOk.length  > 0 ? `\nConfirmado:\n${itemsOk.map(i  => `• ${i}`).join('\n')}` : '',
        itemsNok.length > 0 ? `\nNo confirmado:\n${itemsNok.map(i => `• ${i}`).join('\n')}` : '',
      ].join('')

      await supabase.from('ordenes')
        .update({ notas_internas: nota })
        .eq('id', ordenId)

      // Pasar a la etapa de firma
      setEtapa('firma')
    } catch (err) {
      console.error('Error guardando checklist:', err)
    } finally {
      setGuardando(false)
    }
  }

  if (listo) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Recepción completada</h2>
        <p className="text-gray-500 text-sm">Redirigiendo a la orden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── ETAPA: CHECKLIST ── */}
      {etapa === 'checklist' && (
        <>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Checklist de recepción</h2>
            <p className="text-gray-500 text-sm mt-1">
              Registra el estado del vehículo al recibirlo.
            </p>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Estado del vehículo</h3>
            <div className="space-y-3">
              {ITEMS_CHECKLIST.map(item => (
                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleCheck(item)}
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                      checks[item]
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 group-hover:border-green-400'
                    }`}
                  >
                    {checks[item] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${checks[item] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Fotos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Fotos de recepción</h3>

            {fotoActual && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <img src={fotoActual.url} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                <input
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Describe lo que muestra la foto (ej. Rayón en puerta delantera)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={confirmarFoto}
                    disabled={subiendo}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
                  >
                    {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {subiendo ? 'Subiendo...' : 'Agregar foto'}
                  </button>
                  <button
                    onClick={() => setFotoActual(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {fotos.map((f, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={f.url} alt={f.descripcion} className="w-full h-32 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                      <p className="text-white text-xs truncate">{f.descripcion || 'Sin descripción'}</p>
                    </div>
                    <button
                      onClick={() => quitarFoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={!!fotoActual || subiendo}
              className="flex items-center gap-2 border border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium px-4 py-2.5 rounded-xl w-full justify-center transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Tomar o subir foto
            </button>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onTerminar}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Omitir todo
            </button>
            <button
              onClick={handleGuardarChecklist}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar y solicitar firma
            </button>
          </div>
        </>
      )}

      {/* ── ETAPA: FIRMA ── */}
      {etapa === 'firma' && (
        <FirmaDigital
          ordenId={ordenId}
          tallerId={tallerId}
          onFirmado={() => { setListo(true); setTimeout(onTerminar, 1500) }}
          onOmitir={onTerminar}
        />
      )}

    </div>
  )
}