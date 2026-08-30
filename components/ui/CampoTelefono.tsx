'use client'

import { useEffect, useState } from 'react'
import { listaPaises } from '@/lib/paises'
import { ladaDePais, separarTelefono } from '@/lib/whatsapp-link'

/**
 * Bandera a partir del código ISO, sin tener que guardar veinte emojis.
 * 'MX' → 🇲🇽. En Windows no hay tipografía de banderas y se ven las dos letras,
 * que al lado de la lada siguen diciendo lo mismo.
 */
function bandera(codigo: string): string {
  return codigo
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

const PAISES = listaPaises().map(p => ({
  codigo: p.codigo,
  nombre: p.nombre,
  lada:   ladaDePais(p.codigo),
}))

interface Props {
  /** Teléfono completo, con lada y "+". Ej. '+526601243604'. */
  valor: string
  onChange: (valor: string) => void
  /** País del taller: de ahí sale la lada que viene puesta. */
  paisPorDefecto?: string | null
  className: string
  placeholder?: string
}

/**
 * Teléfono con la lada aparte, escogida de una lista.
 *
 * Nace de una pregunta del dueño (30/08/2026): "¿le tiene que poner el +52 o
 * solo el número?". La respuesta era "depende del país", que es la peor
 * respuesta posible para un campo de texto. TallerOS sabe deducir la lada
 * cuando el número tiene el largo local esperado, pero eso obliga a acertar y
 * falla en silencio: el link se arma igual y abre un número que no existe.
 *
 * Con la lada aparte no hay nada que adivinar. Lo que se guarda lleva siempre
 * "+" y lada, así que `normalizarTelefonoWaMe` lo respeta tal cual y deja de
 * depender de contar dígitos.
 */
export default function CampoTelefono({
  valor,
  onChange,
  paisPorDefecto,
  className,
  placeholder = 'Número',
}: Props) {
  // Se guarda el código de país y no la lada porque República Dominicana,
  // Estados Unidos y Canadá comparten el +1: con la lada como valor, elegir
  // uno enseñaría la bandera de otro.
  //
  // El valor que llega puede ser un teléfono guardado hace años en cualquier
  // formato, así que se parte con separarTelefono, que está probado para no
  // perder dígitos por el camino.
  const [codigo, setCodigo] = useState(() => separarTelefono(valor, paisPorDefecto).codigo)
  const [numero, setNumero] = useState(() => separarTelefono(valor, paisPorDefecto).numero)

  const componer = (c: string, n: string) => (n ? `${ladaDePais(c)}${n}` : '')

  // Se vuelve a leer el valor cada vez que el padre lo cambia por su cuenta.
  // Hacen falta los dos casos:
  //
  //   · La ficha de un cliente monta el formulario vacío y carga el teléfono
  //     un instante después. Sin esto el campo se quedaría en blanco enseñando
  //     un teléfono que sí existe, y el primer dígito que se tecleara lo
  //     sustituiría entero.
  //   · Invitar a un miembro vacía los campos al terminar.
  //
  // Cuando el cambio viene de teclear aquí, `valor` ya coincide con lo que
  // este campo compuso y no se hace nada: sin esa comprobación sería un bucle.
  useEffect(() => {
    if (valor === componer(codigo, numero)) return
    const leido = separarTelefono(valor, paisPorDefecto)
    setCodigo(leido.codigo)
    setNumero(leido.numero)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  const emitir = (nuevoCodigo: string, nuevoNumero: string) => {
    onChange(componer(nuevoCodigo, nuevoNumero))
  }

  const cambiarPais = (nuevoCodigo: string) => {
    setCodigo(nuevoCodigo)
    emitir(nuevoCodigo, numero)
  }

  const cambiarNumero = (texto: string) => {
    const digitos = texto.replace(/\D/g, '')
    setNumero(digitos)
    emitir(codigo, digitos)
  }

  // El ancho se controla con los contenedores y no con clases sobre el select.
  // `className` es el estilo común de los campos del formulario y lleva
  // `w-full`; añadirle `w-auto` aquí no gana, porque en Tailwind decide el
  // orden de la hoja de estilos, no el del atributo. El selector se estiraba a
  // lo ancho y el número quedaba en un hueco diminuto, fuera de la pantalla.
  //
  // `min-w-0` en el número es lo que le permite encogerse: sin él, un hijo
  // flexible no baja de su ancho natural y desborda la fila.
  return (
    <div className="flex gap-2">
      {/* 8rem entra "🇬🇹 +502" —la lada más larga— con su flecha. */}
      <div className="shrink-0 w-32">
        <select
          value={codigo}
          onChange={e => cambiarPais(e.target.value)}
          aria-label="Código de país"
          title="Código de país"
          className={className}
        >
          {PAISES.map(p => (
            <option key={p.codigo} value={p.codigo}>
              {bandera(p.codigo)} {p.lada}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="tel"
          inputMode="numeric"
          value={numero}
          onChange={e => cambiarNumero(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      </div>
    </div>
  )
}
