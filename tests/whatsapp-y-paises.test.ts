import { describe, it, expect } from 'vitest'
import { normalizarTelefonoWaMe, buildWhatsAppLink } from '@/lib/whatsapp-link'
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

  it('a un número local de 10 dígitos le antepone el código del país del taller', () => {
    expect(normalizarTelefonoWaMe('7441219223', 'MX')).toBe('527441219223')
    expect(normalizarTelefonoWaMe('3001234567', 'CO')).toBe('573001234567')
    expect(normalizarTelefonoWaMe('987654321', 'PE')).toBe('987654321') // 9 dígitos: ya se asume completo
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
