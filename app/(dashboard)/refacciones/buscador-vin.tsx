'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, Car, ExternalLink, AlertTriangle, CheckCircle2, User } from 'lucide-react'
import {
  normalizarVin, problemaVin, digitoControlCuadra, anioProbable,
  textoParaCatalogo, CATALOGO_REFACCIONES, DatosVin,
} from '@/lib/vin'
import { buscarVinEnTaller, CocheDelTaller } from './actions'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 font-mono tracking-wider'

/**
 * Buscar una refacción a partir del VIN.
 *
 * El orden de lo que se enseña no es casual: primero lo que tiene el taller,
 * que lo escribió una persona y es lo fiable, y después lo que dice NHTSA,
 * etiquetado. Probando con coches reales, NHTSA devolvió un Virtus de 2022
 * como si fuera de 1992 y sin marca de duda. Si esto rellenara campos solo,
 * ese mecánico acabaría pidiendo refacciones de un coche que no existía.
 */
export default function BuscadorVin() {
  const [vin, setVin]           = useState('')
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado]   = useState(false)
  const [coche, setCoche]       = useState<CocheDelTaller | null>(null)
  const [nhtsa, setNhtsa]       = useState<DatosVin | null>(null)
  const [avisoNhtsa, setAvisoNhtsa] = useState('')
  const [error, setError]       = useState('')
  const [copiado, setCopiado]   = useState(false)

  const limpio   = normalizarVin(vin)
  const problema = limpio.length > 0 ? problemaVin(limpio) : null
  const dedazo   = problema === null && limpio.length === 17 && !digitoControlCuadra(limpio)

  const buscar = async () => {
    if (problemaVin(limpio)) return
    setBuscando(true)
    setError('')
    setAvisoNhtsa('')
    setCoche(null)
    setNhtsa(null)

    // Las dos búsquedas van a la vez: la del taller no depende de NHTSA, y si
    // NHTSA tarda sus tres segundos, el coche registrado ya está en pantalla.
    const [propio, externo] = await Promise.allSettled([
      buscarVinEnTaller(limpio),
      fetch(`/api/vin/${limpio}`).then(r => r.json()),
    ])

    if (propio.status === 'fulfilled') {
      if (propio.value.error) setError(propio.value.error)
      setCoche(propio.value.coche)
    } else {
      setError('No se pudo buscar en tus vehículos.')
    }

    if (externo.status === 'fulfilled' && externo.value?.encontrado) {
      setNhtsa(externo.value.datos)
    } else if (externo.status === 'fulfilled') {
      setAvisoNhtsa(externo.value?.motivo ?? 'No se encontró información externa de este VIN.')
    } else {
      setAvisoNhtsa('No se pudo consultar el catálogo externo.')
    }

    setBuscando(false)
    setBuscado(true)
  }

  // Para el catálogo mandan los datos del taller, y NHTSA solo rellena huecos.
  const paraCatalogo = {
    marca:  coche?.marca  ?? nhtsa?.marca  ?? null,
    modelo: coche?.modelo ?? nhtsa?.modelo ?? null,
    anio:   coche?.anio   ?? nhtsa?.anio   ?? anioProbable(limpio),
    motor:  nhtsa?.motor  ?? null,
  }
  const textoCatalogo = buscado ? textoParaCatalogo(paraCatalogo) : null

  /**
   * Abre el catálogo con el coche ya copiado, para que el mecánico solo pegue.
   *
   * La pestaña se abre ANTES de tocar el portapapeles, igual que en el modal de
   * WhatsApp: si se abre después de un await, Safari la bloquea por no
   * considerarla parte del gesto del usuario.
   */
  const abrirCatalogo = () => {
    window.open(CATALOGO_REFACCIONES, '_blank', 'noopener,noreferrer')
    if (!textoCatalogo) return
    navigator.clipboard.writeText(textoCatalogo)
      .then(() => {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 4000)
      })
      // Safari sin https, o permiso denegado. El dato está a la vista en la
      // pantalla y se puede copiar a mano, así que no es un callejón sin
      // salida — pero callarlo haría creer que el botón no hizo nada.
      .catch(() => setError('Se abrió el catálogo, pero no pudimos copiar los datos. Cópialos de la ficha de arriba.'))
  }

  const anioLocal = limpio.length === 17 ? anioProbable(limpio) : null
  const anioEnConflicto =
    nhtsa?.anio != null && anioLocal != null && Math.abs(nhtsa.anio - anioLocal) >= 29

  return (
    <div className="space-y-4">

      {/* ── El buscador ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Número de serie (VIN)
        </label>
        <p className="text-xs text-gray-400 mb-3">
          17 caracteres. Está en el tablero del lado del conductor, en el marco de la puerta o en la tarjeta de circulación.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={vin}
            onChange={e => setVin(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') buscar() }}
            placeholder="3VW1W1AJ6HM345958"
            maxLength={17}
            className={INPUT}
          />
          <button
            onClick={buscar}
            disabled={buscando || problemaVin(limpio) !== null}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shrink-0"
          >
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>

        {problema && limpio.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">{problema}</p>
        )}

        {/* El dígito de control avisa pero no bloquea: en Europa y parte de
            Asia no todos los fabricantes lo respetan, y dejar al mecánico sin
            poder buscar por eso sería peor que el aviso. */}
        {dedazo && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Este VIN no pasa su propia comprobación interna. Casi siempre es un carácter
              mal tecleado — revísalo. Puedes buscar igual.
            </span>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mt-3">{error}</p>
        )}
      </div>

      {/* ── El coche del taller ── */}
      {buscado && coche && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">En tu taller</h2>
          </div>

          <p className="text-lg font-bold text-gray-900">
            {[coche.anio, coche.marca, coche.modelo].filter(v => v && String(v) !== '0').join(' ') || 'Vehículo sin datos'}
          </p>
          {coche.placas && <p className="text-sm text-gray-500 mt-0.5">{coche.placas}</p>}

          {coche.cliente_nombre && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {coche.cliente_id ? (
                <Link href={`/clientes/${coche.cliente_id}`} className="text-sm text-blue-600 hover:underline font-medium">
                  {coche.cliente_nombre}
                </Link>
              ) : (
                <span className="text-sm text-gray-700">{coche.cliente_nombre}</span>
              )}
              {coche.visitas > 0 && (
                <span className="text-xs text-gray-400">
                  · {coche.visitas} {coche.visitas === 1 ? 'orden' : 'órdenes'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {buscado && !coche && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Este vehículo no está registrado en tu taller. No hace falta: puedes
            consultar sus datos y buscar la refacción igual.
          </p>
        </div>
      )}

      {/* ── Lo que dice NHTSA ── */}
      {buscado && nhtsa && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-sm font-bold text-gray-900">Ficha técnica del VIN</h2>
            {nhtsa.limpio ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Verificado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                <AlertTriangle className="w-3 h-3" /> Parcial
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Del registro público de NHTSA (Estados Unidos).{' '}
            {nhtsa.limpio
              ? 'Decodificó este VIN completo.'
              : 'Solo pudo decodificar parte del VIN: verifica antes de pedir la pieza.'}
          </p>

          <dl className="space-y-2 text-sm">
            <Fila etiqueta="Marca"        valor={nhtsa.marca} />
            <Fila etiqueta="Modelo"       valor={nhtsa.modelo} />
            <Fila etiqueta="Año"          valor={nhtsa.anio ? String(nhtsa.anio) : null} />
            <Fila etiqueta="Motor"        valor={nhtsa.motor} destacado />
            <Fila etiqueta="Versión"      valor={nhtsa.version} />
            <Fila etiqueta="Transmisión"  valor={nhtsa.transmision} />
            <Fila etiqueta="Tracción"     valor={nhtsa.traccion} />
            <Fila etiqueta="Carrocería"   valor={nhtsa.carroceria} />
            <Fila etiqueta="Rin"          valor={nhtsa.rin} />
            <Fila etiqueta="Planta"       valor={nhtsa.planta} />
          </dl>

          {/* El código del año se repite cada 30 años, así que una misma letra
              es 1992 o 2022. NHTSA eligió mal en un Virtus real. */}
          {anioEnConflicto && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-4 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                NHTSA dice {nhtsa.anio}, pero por el VIN el año más probable es{' '}
                <strong>{anioLocal}</strong>. El código del año se repite cada 30 años
                y aquí se equivocó de vuelta. Fíate del que conozcas del coche.
              </span>
            </p>
          )}

          {coche && nhtsa.modelo && coche.modelo &&
           nhtsa.modelo.trim().toLowerCase() !== coche.modelo.trim().toLowerCase() && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-3">
              NHTSA llama a este coche <strong>{nhtsa.modelo}</strong> y tú lo tienes como{' '}
              <strong>{coche.modelo}</strong>. Suele ser el mismo coche con el nombre de otro mercado.
            </p>
          )}
        </div>
      )}

      {buscado && !nhtsa && avisoNhtsa && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Ficha técnica del VIN</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{avisoNhtsa}</p>
          {anioLocal && (
            <p className="text-sm text-gray-500 mt-2">
              Por el VIN, el año del vehículo es probablemente <strong className="text-gray-700">{anioLocal}</strong>.
            </p>
          )}
        </div>
      )}

      {/* ── El catálogo ── */}
      {textoCatalogo && (
        <div className="space-y-2">
          <button
            onClick={abrirCatalogo}
            className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Buscar refacción
          </button>
          <p className="text-xs text-gray-400 text-center">
            {copiado
              ? <span className="text-green-600 font-medium">Copiado: {textoCatalogo} — pégalo en el buscador.</span>
              : <>Abre el catálogo y copia <span className="font-medium text-gray-600">{textoCatalogo}</span> para que solo lo pegues.</>}
          </p>
        </div>
      )}
    </div>
  )
}

function Fila({ etiqueta, valor, destacado = false }: {
  etiqueta: string
  valor: string | null
  destacado?: boolean
}) {
  if (!valor) return null
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-2 last:border-0">
      <dt className="text-gray-500 shrink-0">{etiqueta}</dt>
      <dd className={`text-right ${destacado ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{valor}</dd>
    </div>
  )
}
