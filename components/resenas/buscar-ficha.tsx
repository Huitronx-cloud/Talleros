'use client'

import { useState } from 'react'
import { Search, Loader2, MapPin, Check } from 'lucide-react'

interface Candidato {
  place_id:  string
  nombre:    string
  direccion: string
}

/**
 * El enlace de reseñas sin pedirle el enlace a nadie.
 *
 * Debajo hay un campo donde el taller puede pegar su URL de Google, con las
 * instrucciones de rigor: "búscate en Maps, haz clic en tu negocio, Obtener más
 * reseñas". Eso lleva desde siempre y lo han conseguido 2 talleres de 83.
 *
 * El problema no es dónde se pregunta, es qué se pregunta: encontrar ese enlace
 * es una tarea que un mecánico no sabe hacer, y a la que no le va a dedicar la
 * tarde. Aquí la pregunta difícil se convierte en un sí o un no.
 *
 * El campo de pegar a mano se queda debajo, intacto. Si Google no encuentra el
 * taller —o la búsqueda falla— nadie se queda sin salida.
 */
export default function BuscarFicha({ onElegir }: { onElegir: (url: string) => void }) {
  const [buscando, setBuscando]     = useState(false)
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
  const [aviso, setAviso]           = useState('')
  const [elegido, setElegido]       = useState<string | null>(null)

  async function buscar() {
    setBuscando(true)
    setAviso('')
    setCandidatos(null)
    try {
      const res  = await fetch('/api/google/buscar-ficha', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setAviso(data.error ?? 'No se pudo buscar.'); return }
      setCandidatos(data.candidatos ?? [])
    } catch {
      setAviso('No se pudo conectar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  /**
   * El enlace que abre directamente la ventana de escribir reseña.
   *
   * Es la forma canónica de Google y funciona con cualquier place_id, sin
   * pasar por la API de My Business ni por su verificación.
   */
  function elegir(c: Candidato) {
    setElegido(c.place_id)
    onElegir(`https://search.google.com/local/writereview?placeid=${c.place_id}`)
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-200">Busca tu taller en Google</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          Lo buscamos con el nombre y la dirección que ya tienes guardados. Si es
          el tuyo, lo confirmas y listo.
        </p>
      </div>

      <button
        type="button"
        onClick={buscar}
        disabled={buscando}
        className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-slate-900 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
      >
        {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {buscando ? 'Buscando…' : 'Buscar mi taller'}
      </button>

      {aviso && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          {aviso}
        </p>
      )}

      {candidatos?.length === 0 && (
        <p className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 leading-relaxed">
          No encontramos tu taller en Google. Puede que aún no tenga ficha — se
          crea gratis en business.google.com — o que el nombre y la dirección
          guardados no coincidan con los de tu ficha. También puedes pegar el
          enlace aquí abajo.
        </p>
      )}

      {candidatos && candidatos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-300">¿Es este tu taller?</p>
          {candidatos.map(c => {
            const esElegido = elegido === c.place_id
            return (
              <button
                key={c.place_id}
                type="button"
                onClick={() => elegir(c)}
                className={`w-full text-left flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  esElegido
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                {esElegido
                  ? <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  : <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-200 truncate">{c.nombre}</span>
                  <span className="block text-xs text-slate-400 leading-snug">{c.direccion}</span>
                </span>
              </button>
            )
          })}
          <p className="text-xs text-slate-500 leading-relaxed">
            {elegido
              ? 'Listo. Baja y dale a Guardar para dejarlo puesto.'
              : 'Si ninguno es el tuyo, pega el enlace aquí abajo.'}
          </p>
        </div>
      )}
    </div>
  )
}
