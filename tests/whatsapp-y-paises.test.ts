import { describe, it, expect } from 'vitest'
import { normalizarTelefonoWaMe, buildWhatsAppLink, separarTelefono } from '@/lib/whatsapp-link'
import { getPais, monedaDePais, listaPaises } from '@/lib/paises'

describe('los links de WhatsApp apuntan al número correcto', () => {
  // Un link mal armado manda el mensaje del taller a un desconocido, o
  // sencillamente no abre. Los casos de abajo son teléfonos reales de la base,
  // con las tres formas en que están guardados.
  it('respeta el teléfono que ya trae código de país', () => {
    expect(normalizarTelefonoWaMe('+52 660 124 3604', 'MX')).toBe('526601243604')
    expect(normalizarTelefonoWaMe('+52 7226209604', 'MX')).toBe('527226209604')
    expect(normalizarTelefonoWaMe('+52 744-121-9223', 'MX')).toBe('527441219223')
  })

  it('a un número local le antepone el código del país del taller', () => {
    expect(normalizarTelefonoWaMe('7441219223', 'MX')).toBe('527441219223')
    expect(normalizarTelefonoWaMe('3001234567', 'CO')).toBe('573001234567')
  })

  it('respeta el largo local de cada país, no solo los 10 dígitos de México', () => {
    // Hasta el 30/08/2026 se daba por hecho que un número local eran 10
    // dígitos. En Perú y Chile son 9, y en Centroamérica 8: a esos nunca se
    // les ponía la lada y el link abría un número que no existe. No fallaba
    // de forma visible, simplemente no llegaba a nadie.
    expect(normalizarTelefonoWaMe('987654321', 'PE')).toBe('51987654321')
    expect(normalizarTelefonoWaMe('912345678', 'CL')).toBe('56912345678')
    expect(normalizarTelefonoWaMe('55123456',  'GT')).toBe('50255123456')
    expect(normalizarTelefonoWaMe('88123456',  'CR')).toBe('50688123456')
    expect(normalizarTelefonoWaMe('61234567',  'PA')).toBe('50761234567')
  })

  it('Argentina lleva el 9 de móvil entre la lada y el número', () => {
    // wa.me sin ese 9 abre un fijo que no tiene WhatsApp.
    expect(normalizarTelefonoWaMe('1123456789', 'AR')).toBe('5491123456789')
    // También se corrigen los que ya están guardados sin el 9.
    expect(normalizarTelefonoWaMe('+54 11 2345-6789', 'AR')).toBe('5491123456789')
    // El que ya lo trae no se toca.
    expect(normalizarTelefonoWaMe('+54 9 11 2345-6789', 'AR')).toBe('5491123456789')
  })

  it('no confunde con Argentina a un número de otro país', () => {
    expect(normalizarTelefonoWaMe('+52 660 124 3604', 'MX')).toBe('526601243604')
    expect(normalizarTelefonoWaMe('5551234567', 'MX')).toBe('525551234567')
  })

  it('acepta el país como código o como nombre', () => {
    expect(normalizarTelefonoWaMe('3001234567', 'Colombia')).toBe('573001234567')
    expect(normalizarTelefonoWaMe('3001234567', 'colombia')).toBe('573001234567')
  })

  it('sin país conocido cae en México, que es donde están 7 de cada 10 talleres', () => {
    expect(normalizarTelefonoWaMe('7441219223', null)).toBe('527441219223')
    expect(normalizarTelefonoWaMe('7441219223', 'ZZ')).toBe('527441219223')
  })

  it('un teléfono vacío no produce un link a ninguna parte', () => {
    expect(normalizarTelefonoWaMe('', 'MX')).toBe('')
    expect(normalizarTelefonoWaMe('sin dígitos', 'MX')).toBe('')
  })

  it('el mensaje viaja codificado, con saltos de línea y acentos intactos', () => {
    const link = buildWhatsAppLink('+52 7441219223', 'Hola Iván,\n¿cómo va tu día?', 'MX')
    expect(link.startsWith('https://wa.me/527441219223?text=')).toBe(true)
    const texto = decodeURIComponent(link.split('?text=')[1])
    expect(texto).toBe('Hola Iván,\n¿cómo va tu día?')
  })
})

describe('separar un teléfono ya guardado en lada + número', () => {
  // Lo delicado de todo esto. Los teléfonos de los clientes llevan años
  // guardándose de cualquier forma; si al abrir la ficha el campo no sabe
  // leerlos, al guardar los borra o los deja irreconocibles.
  it('lee las tres formas en que están guardados los teléfonos mexicanos', () => {
    expect(separarTelefono('744-121-9223', 'MX')).toEqual({ codigo: 'MX', numero: '7441219223' })
    expect(separarTelefono('+52 744 1219223', 'MX')).toEqual({ codigo: 'MX', numero: '7441219223' })
    expect(separarTelefono('527441219223', 'MX')).toEqual({ codigo: 'MX', numero: '7441219223' })
  })

  it('reconoce el país cuando el número trae otra lada', () => {
    expect(separarTelefono('+51 987654321', 'MX')).toEqual({ codigo: 'PE', numero: '987654321' })
    expect(separarTelefono('+502 55123456', 'MX')).toEqual({ codigo: 'GT', numero: '55123456' })
    expect(separarTelefono('+593 987654321', 'MX')).toEqual({ codigo: 'EC', numero: '987654321' })
  })

  it('un número local se lee con el país del taller, no con México', () => {
    expect(separarTelefono('987654321', 'PE')).toEqual({ codigo: 'PE', numero: '987654321' })
    expect(separarTelefono('55123456', 'GT')).toEqual({ codigo: 'GT', numero: '55123456' })
  })

  it('Argentina: el 9 de móvil no forma parte del número local', () => {
    // Sin esta regla "+5491123456789" no casaba con ninguna lada y se
    // guardaba entero como si fuera un número local mexicano.
    expect(separarTelefono('+5491123456789', 'AR')).toEqual({ codigo: 'AR', numero: '1123456789' })
    expect(separarTelefono('+541123456789', 'AR')).toEqual({ codigo: 'AR', numero: '1123456789' })
  })

  it('ante la duda deja el número entero como local: nunca pierde dígitos', () => {
    // Un fijo corto, o algo que no cuadra con ninguna lada, se conserva tal
    // cual. Es lo que había antes de este campo.
    expect(separarTelefono('1234567', 'MX')).toEqual({ codigo: 'MX', numero: '1234567' })
    expect(separarTelefono('', 'MX')).toEqual({ codigo: 'MX', numero: '' })
  })

  it('lo que sale de separar y volver a juntar sigue llegando al mismo teléfono', () => {
    // La garantía que de verdad importa: editar una ficha sin tocar el
    // teléfono no puede cambiar a quién le llega el WhatsApp.
    for (const [guardado, pais] of [
      ['744-121-9223', 'MX'],
      ['+52 744 1219223', 'MX'],
      ['987654321', 'PE'],
      ['+502 55123456', 'GT'],
      ['+5491123456789', 'AR'],
    ] as const) {
      const { codigo, numero } = separarTelefono(guardado, pais)
      const rearmado = `+${normalizarTelefonoWaMe(numero, codigo)}`
      expect(`+${normalizarTelefonoWaMe(guardado, pais)}`, `${guardado} (${pais})`).toBe(rearmado)
    }
  })
})

describe('cada país tiene su moneda y su impuesto', () => {
  // Hasta el 26/08/2026 el alta nunca escribía la moneda, así que 21 talleres
  // de ocho países veían su dinero en pesos mexicanos: en las órdenes, en las
  // cotizaciones y en los WhatsApp que le mandan a su cliente.
  it('los países con talleres reales resuelven bien', () => {
    expect(monedaDePais('MX')).toBe('MXN')
    expect(monedaDePais('AR')).toBe('ARS')
    expect(monedaDePais('CO')).toBe('COP')
    expect(monedaDePais('PE')).toBe('PEN')
    expect(monedaDePais('GT')).toBe('GTQ')
    expect(monedaDePais('CR')).toBe('CRC')
  })

  it('los países dolarizados devuelven USD', () => {
    for (const p of ['EC', 'VE', 'PA', 'SV']) {
      expect(monedaDePais(p), `${p} debería usar dólares`).toBe('USD')
    }
  })

  it('acepta el nombre en español, con acento y sin él', () => {
    // Las altas viejas guardaron el nombre; las nuevas, el código.
    expect(monedaDePais('México')).toBe('MXN')
    expect(monedaDePais('mexico')).toBe('MXN')
    expect(monedaDePais('Perú')).toBe('PEN')
    expect(monedaDePais('peru')).toBe('PEN')
    expect(monedaDePais('Argentina')).toBe('ARS')
  })

  it('un país desconocido no revienta: cae en México', () => {
    expect(monedaDePais('ZZ')).toBe('MXN')
    expect(monedaDePais('')).toBe('MXN')
    expect(monedaDePais(null)).toBe('MXN')
  })

  it('ningún país de la lista se queda sin moneda ni sin impuesto', () => {
    for (const p of listaPaises()) {
      const datos = getPais(p.codigo)
      expect(datos.moneda, `${p.codigo} sin moneda`).toBeTruthy()
      expect(datos.etiqueta, `${p.codigo} sin etiqueta de impuesto`).toBeTruthy()
      expect(datos.tasa, `${p.codigo} con una tasa de impuesto imposible`).toBeGreaterThanOrEqual(0)
      expect(datos.tasa).toBeLessThan(0.4)
    }
  })
})
