// ── Links wa.me — comunicación taller→cliente sin depender de Twilio/Meta ──
// El empleado del taller envía el mensaje con un tap desde SU PROPIO WhatsApp.
// No hay ninguna API de por medio: wa.me solo abre WhatsApp con el número y el
// texto pre-llenados, el envío real lo hace la persona.

import { codigoDePais } from './paises'

// Código de discado y largo del número LOCAL (sin lada) de cada país.
//
// El largo importa tanto como la lada. Antes se daba por hecho que un número
// local eran 10 dígitos —cierto en México y Colombia, que es de donde viene la
// mayoría— y cualquier otra cantidad se mandaba tal cual, sin lada. En Perú y
// Chile los celulares son de 9 dígitos, y en Centroamérica de 8: a esos nunca
// se les ponía la lada y el link abría WhatsApp con un número que no existe.
// No fallaba de forma visible; simplemente no llegaba a nadie.
const PAISES: Record<string, { dial: string; largo: number }> = {
  MX: { dial: '52',  largo: 10 },
  CO: { dial: '57',  largo: 10 },
  AR: { dial: '54',  largo: 10 },
  PE: { dial: '51',  largo: 9  },
  CL: { dial: '56',  largo: 9  },
  EC: { dial: '593', largo: 9  },
  PY: { dial: '595', largo: 9  },
  VE: { dial: '58',  largo: 10 },
  DO: { dial: '1',   largo: 10 },
  US: { dial: '1',   largo: 10 },
  CA: { dial: '1',   largo: 10 },
  GT: { dial: '502', largo: 8  },
  CR: { dial: '506', largo: 8  },
  BO: { dial: '591', largo: 8  },
  UY: { dial: '598', largo: 8  },
  HN: { dial: '504', largo: 8  },
  SV: { dial: '503', largo: 8  },
  PA: { dial: '507', largo: 8  },
  NI: { dial: '505', largo: 8  },
}

const POR_DEFECTO = PAISES.MX

/** Dial y largo local, aceptando código ('PE') o nombre ('Perú', 'peru'). */
function datosDelPais(pais?: string | null) {
  return PAISES[codigoDePais(pais)] ?? POR_DEFECTO
}

/** Lada con "+", para enseñarla en los selectores. Ej. 'PE' → '+51'. */
export function ladaDePais(pais?: string | null): string {
  return `+${datosDelPais(pais).dial}`
}

/**
 * Parte un teléfono guardado en país + número local, para poder enseñarlo en
 * un campo con la lada aparte.
 *
 * Es la mitad delicada: los teléfonos de los clientes llevan años guardándose
 * de cualquier forma —"744-121-9223", "+52 744 1219223", "527441219223"— y si
 * al abrir la ficha el campo no sabe leerlos, al guardar los borra.
 *
 * Solo se separa la lada cuando lo que queda tiene EXACTAMENTE el largo local
 * de ese país. Un "5551234567" mexicano no se lee como lada 55 + resto, porque
 * 55 no es lada de nadie, pero la regla evita también los casos en que sí lo
 * sería. Ante la duda, el número entero se trata como local: es lo que era
 * antes de este campo, y así nunca se pierde nada.
 */
export function separarTelefono(
  telefono: string,
  paisPorDefecto?: string | null,
): { codigo: string; numero: string } {
  const porDefecto = codigoDePais(paisPorDefecto)
  const digitos = (telefono ?? '').replace(/\D/g, '')
  if (!digitos) return { codigo: porDefecto, numero: '' }

  const traeLadaExplicita = telefono.trim().startsWith('+')
  const largoLocalPorDefecto = PAISES[porDefecto]?.largo ?? POR_DEFECTO.largo

  // Solo se busca lada si el número no puede ser ya un local del país del
  // taller. Si no, un local de 10 dígitos podría "coincidir" con alguna lada.
  if (traeLadaExplicita || digitos.length > largoLocalPorDefecto) {
    // Argentina va antes que el resto: sus móviles llevan un 9 tras el 54 que
    // no es parte del número local, y sin esta línea "+5491123456789" no
    // casaría con ninguna lada y se guardaría entero como si fuera local.
    if (digitos.startsWith('549') && digitos.length === 13) {
      return { codigo: 'AR', numero: digitos.slice(3) }
    }

    // De la lada más larga a la más corta: '593' antes que '59'.
    const candidatos = Object.entries(PAISES)
      .sort(([, a], [, b]) => b.dial.length - a.dial.length)

    for (const [codigo, { dial, largo }] of candidatos) {
      if (digitos.startsWith(dial) && digitos.length - dial.length === largo) {
        return { codigo, numero: digitos.slice(dial.length) }
      }
    }
  }

  return { codigo: porDefecto, numero: digitos }
}

/**
 * Argentina necesita un 9 entre la lada y el número para móviles: +54 9 11
 * 1234-5678. Sin ese 9, wa.me abre un número fijo que no tiene WhatsApp.
 * Se corrige aquí y no en la tabla porque también hay que arreglar los
 * teléfonos ya guardados como "+54 11 ..." sin el 9.
 */
function corregirArgentina(digitos: string): string {
  const esArgentinaSinNueve = digitos.startsWith('54') && digitos[2] !== '9' && digitos.length === 12
  return esArgentinaSinNueve ? `549${digitos.slice(2)}` : digitos
}

/**
 * Normaliza un teléfono a puros dígitos con código de país, listo para wa.me
 * (wa.me no lleva "+" en la URL). Si el teléfono ya trae código de país
 * (11+ dígitos, o menos si el país del taller usa código corto tipo +1),
 * se respeta tal cual. Si son 10 dígitos (número local sin código de país,
 * el caso más común en México/Colombia/Perú), se le antepone el código del
 * país del taller.
 */
export function normalizarTelefonoWaMe(telefono: string, paisTaller?: string | null): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  if (!soloDigitos) return ''

  const { dial, largo } = datosDelPais(paisTaller)

  // Ya trae "+" explícito en el original → confiar en que ya está completo
  if (telefono.trim().startsWith('+')) return corregirArgentina(soloDigitos)

  // Número local sin lada. El largo depende del país: 10 dígitos en México y
  // Colombia, 9 en Perú y Chile, 8 en Centroamérica.
  if (soloDigitos.length === largo) return corregirArgentina(`${dial}${soloDigitos}`)

  // Cualquier otra longitud: asumimos que ya incluye código de país
  return corregirArgentina(soloDigitos)
}

/**
 * Arma el link wa.me con el teléfono y el mensaje pre-llenado.
 * `telefono` puede venir crudo (con o sin espacios/guiones/código de país);
 * se normaliza aquí mismo. `paisTaller` es opcional y solo se usa como
 * fallback cuando el teléfono no trae código de país (10 dígitos).
 */
export function buildWhatsAppLink(telefono: string, mensaje: string, paisTaller?: string | null): string {
  const numero = normalizarTelefonoWaMe(telefono, paisTaller)
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
