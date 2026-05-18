'use client'

import { useRef, useState } from 'react'
import { Camera, X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tallerId: string
  clienteId?: string
  fotoActual?: string | null
  onFotoChange: (url: string | null) => void
}

export default function FotoVehiculo({ tallerId, clienteId, fotoActual, onFotoChange }: Props) {
  const supabase    = createClient()
  const inputRef    = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(fotoActual ?? null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError]       = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
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
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
              onClick={() => inputRef.current?.click()}
              style={{
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8,
                padding: '6px 10px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
              }}
            >
              <Camera size={13} /> Cambiar
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          style={{
            width: '100%', height: 120, border: '2px dashed #d1d5db',
            borderRadius: 12, background: '#f9fafb', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'border-color .2s, background .2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.background  = '#eff6ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.background  = '#f9fafb'
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={20} color="#6b7280" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
              Foto del vehículo
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
              Toca para tomar foto o subir imagen
            </p>
          </div>
        </button>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}