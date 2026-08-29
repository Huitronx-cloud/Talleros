'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FirmaDigital from './firma-digital'
import InspeccionDanos from './inspeccion-danos'

const NIVEL_GASOLINA = 'Nivel de gasolina registrado'

const ITEMS_CHECKLIST = [
  'Carrocería sin daños visibles',
  'Vidrios y espejos en buen estado',
  'Llantas sin daños',
  NIVEL_GASOLINA,
  'Interior sin daños',
  'Luces funcionando',
  'Accesorios y objetos de valor retirados',
]

/**
 * Los cinco niveles de la aguja. El botón lleva la marca corta —cabe en el
 * teléfono y es la que se ve en el tablero— y la nota se guarda con la frase
 * completa, que es la que hay que poder leer meses después si el cliente
 * reclama que dejó el tanque lleno.
 */
const NIVELES_GASOLINA = [
  { corto: 'Reserva', texto: 'En reserva (casi vacío)' },
  { corto: '¼',       texto: 'Un cuarto de tanque' },
  { corto: '½',       texto: 'Medio tanque' },
  { corto: '¾',       texto: 'Tres cuartos de tanque' },
  { corto: 'Lleno',   texto: 'Tanque lleno' },
]

interface Foto {
  url: string
  descripcion: string
}

interface Props {
  ordenId: string
  tallerId: string
  onTerminar: () => void
  /** Lo que se escribió en "Notas internas" al crear la orden: el checklist se
   *  añade debajo en vez de pisarlo. */
  notasPrevias?: string
}

type Etapa = 'checklist' | 'firma'

export default function ChecklistRecepcion({ ordenId, tallerId, onTerminar, notasPrevias }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputGaleria = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa]           = useState<Etapa>('checklist')
  const [checks, setChecks]         = useState<Record<string, boolean>>({})
  const [gasolina, setGasolina]     = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [fotos, setFotos]           = useState<Foto[]>([])
  const [subiendo, setSubiendo]     = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [listo, setListo]           = useState(false)
  const [fotoActual, setFotoActual] = useState<{ url: string; file: File } | null>(null)
  const [descripcion, setDescripcion] = useState('')

  const toggleCheck = (item: string) => {
    setChecks(prev => ({ ...prev, [item]: !prev[item] }))
    // Destildar "nivel de gasolina" borra el nivel: dejar la marca puesta sin
    // que la casilla lo respalde es justo lo que hace inservible una nota.
    if (item === NIVEL_GASOLINA && checks[item]) setGasolina(null)
  }

  const elegirGasolina = (texto: string) => {
    const mismo = gasolina === texto
    setGasolina(mismo ? null : texto)
    // Marcar el nivel ES registrarlo; pedir además el tic sería pedir dos veces
    // lo mismo, y el que se olvide deja la nota diciendo "no confirmado".
    setChecks(prev => ({ ...prev, [NIVEL_GASOLINA]: !mismo }))
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Sin esto, volver a elegir la misma foto no dispara `change`.
    e.target.value = ''
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
        .from('diagnosticos')
        .upload(path, fotoActual.file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('diagnosticos').getPublicUrl(path)
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
    setErrorGuardar('')
    try {
      if (fotos.length > 0) {
        const { error } = await supabase.from('fotos_diagnostico').insert(
          fotos.map(f => ({
            orden_id:    ordenId,
            taller_id:   tallerId,
            url:         f.url,
            descripcion: f.descripcion || 'Foto de recepción',
            tipo:        'recepcion',
          }))
        )
        if (error) throw error
      }

      // La gasolina no va en las listas de tildes: se guarda con su valor, que
      // es lo único que sirve si el cliente reclama.
      const otros    = ITEMS_CHECKLIST.filter(i => i !== NIVEL_GASOLINA)
      const itemsOk  = otros.filter(i => checks[i])
      const itemsNok = otros.filter(i => !checks[i])
      const checklist = [
        '✅ CHECKLIST DE RECEPCIÓN',
        `\nGasolina al recibir: ${gasolina ?? 'no registrada'}`,
        itemsOk.length  > 0 ? `\n\nConfirmado:\n${itemsOk.map(i  => `• ${i}`).join('\n')}` : '',
        itemsNok.length > 0 ? `\n\nNo confirmado:\n${itemsNok.map(i => `• ${i}`).join('\n')}` : '',
      ].join('')

      // Se añade debajo de lo que ya había. Antes se sobrescribía, así que las
      // notas internas escritas al crear la orden desaparecían al terminar el
      // checklist, sin avisar.
      const nota = [notasPrevias?.trim(), checklist].filter(Boolean).join('\n\n')

      const { error: errorNota } = await supabase.from('ordenes')
        .update({ notas_internas: nota })
        .eq('id', ordenId)
      if (errorNota) throw errorNota

      // Pasar a la etapa de firma
      setEtapa('firma')
    } catch (err) {
      console.error('Error guardando checklist:', err)
      // Antes se seguía a la firma igual y el checklist se perdía en silencio.
      setErrorGuardar('No se pudo guardar el checklist. Revisa tu conexión e intenta de nuevo.')
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
                <div key={item}>
                  <label className="flex items-center gap-3 cursor-pointer group">
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

                  {/* El punto pedía "registrado" y no había dónde registrarlo. */}
                  {item === NIVEL_GASOLINA && (
                    <div className="ml-8 mt-2 flex gap-1.5">
                      {NIVELES_GASOLINA.map(n => {
                        const activo = gasolina === n.texto
                        return (
                          <button
                            key={n.texto}
                            type="button"
                            onClick={() => elegirGasolina(n.texto)}
                            title={n.texto}
                            aria-pressed={activo}
                            className={`flex-1 min-h-[38px] px-1 rounded-lg border text-xs font-semibold transition-colors ${
                              activo
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
                            }`}
                          >
                            {n.corto}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inspección de daños */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Mapa de daños del vehículo</h3>
            <InspeccionDanos
              ordenId={ordenId}
              tallerId={tallerId}
            />
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

            {/* Dos inputs: con capture el teléfono no ofrece el carrete, y el
                botón prometía "o subir foto" sin poder cumplirlo. */}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            <input ref={inputGaleria} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            <div className="flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={!!fotoActual || subiendo}
                className="flex-1 flex items-center gap-2 border border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium px-4 py-2.5 rounded-xl justify-center transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Tomar foto
              </button>
              <button
                onClick={() => inputGaleria.current?.click()}
                disabled={!!fotoActual || subiendo}
                className="flex-1 flex items-center gap-2 border border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium px-4 py-2.5 rounded-xl justify-center transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Galería
              </button>
            </div>
          </div>

          {errorGuardar && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {errorGuardar}
            </p>
          )}

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