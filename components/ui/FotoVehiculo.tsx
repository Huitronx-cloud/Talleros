'use client'

import { useRef, useState } from 'react'
import { Camera, X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 44px de alto: es el mínimo que se acierta con el pulgar, y aquí se usa con
// las manos sucias y el coche delante.
const botonOpcion: React.CSSProperties = {
  flex: 1, minHeight: 44, border: '1px solid #d1d5db', borderRadius: 9,
  background: '#fff', color: '#374151', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  fontSize: 13, fontWeight: 600,
}

interface Props {
  tallerId: string
  clienteId?: string
  fotoActual?: string | null
  onFotoChange: (url: string | null) => void
}

export default function FotoVehiculo({ tallerId, clienteId, fotoActual, onFotoChange }: Props) {
  const supabase    = createClient()
  // Dos inputs, no uno. El de la cámara lleva `capture`, que en el teléfono
  // salta directo a la cámara trasera — un toque, que es lo que hace falta con
  // el coche delante. El de la galería NO lo lleva: con `capture` el teléfono
  // ni siquiera ofrece el carrete, y muchas fotos llegan por WhatsApp antes de
  // que el coche entre al taller.
  const inputCamara  = useRef<HTMLInputElement>(null)
  const inputGaleria = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(fotoActual ?? null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError]       = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Se vacía en cuanto se lee: si no, elegir la MISMA foto otra vez no dispara
    // `change`, y quien acaba de leer "intenta de nuevo" se queda sin poder.
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La foto no puede pesar más de 5 MB'); return }
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }

    setError('')
    setSubiendo(true)

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const ext      = file.name.split('.').pop() ?? 'jpg'
      const carpeta  = clienteId ?? `temp-${Date.now()}`
      const path     = `${tallerId}/${carpeta}/vehiculo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('diagnosticos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('diagnosticos').getPublicUrl(path)
      onFotoChange(data.publicUrl)
    } catch {
      setError('Error subiendo la foto. Intenta de nuevo.')
      setPreview(fotoActual ?? null)
      onFotoChange(fotoActual ?? null)
    } finally {
      setSubiendo(false)
    }
  }

  function quitarFoto() {
    setPreview(null)
    onFotoChange(null)
    // Los dos, o volver a elegir el mismo archivo no dispara `change`.
    if (inputCamara.current) inputCamara.current.value = ''
    if (inputGaleria.current) inputGaleria.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputCamara}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={inputGaleria}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {preview ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
          <img
            src={preview}
            alt="Foto del vehículo"
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
          {subiendo && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 32, height: 32, border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid #fff', borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          )}
          <div style={{
            position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6,
          }}>
            <button
              type="button"
              onClick={() => inputCamara.current?.click()}
              title="Tomar otra foto"
              aria-label="Tomar otra foto"
              style={{
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8,
                padding: '6px 8px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Camera size={13} />
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              title="Elegir otra de la galería"
              aria-label="Elegir otra de la galería"
              style={{
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8,
                padding: '6px 8px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Upload size={13} />
            </button>
            <button
              type="button"
              onClick={quitarFoto}
              style={{
                background: 'rgba(220,38,38,0.8)', border: 'none', borderRadius: 8,
                padding: '6px 8px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%', border: '2px dashed #d1d5db', borderRadius: 12,
            background: '#f9fafb', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Camera size={17} color="#6b7280" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
              Foto del vehículo
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              type="button"
              onClick={() => inputCamara.current?.click()}
              disabled={subiendo}
              style={botonOpcion}
            >
              <Camera size={15} /> Tomar foto
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              disabled={subiendo}
              style={botonOpcion}
            >
              <Upload size={15} /> Galería
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}