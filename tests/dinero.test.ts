import { describe, it, expect } from 'vitest'
import { formatMoney, simboloMoneda, formatMoneyCompacto } from '@/lib/utils'

// El símbolo salía DETRÁS del importe —"2,141.36 $"— y lo pilló un taller
// mirando el total en el mensaje que le llega al cliente. En un mensaje que
// dice cuánto hay que pagar, que la cifra no se lea de un golpe es un problema
// de verdad, no un detalle de diseño.
describe('formatMoney', () => {
  it('pone el símbolo delante, que es como se escribe en Latinoamérica', () => {
    expect(formatMoney(2141.36, 'USD')).toBe('$2,141.36')
  })

  it('el peso mexicano lleva su prefijo pegado', () => {
    expect(formatMoney(1500, 'MXN')).toBe('MX$1,500.00')
  })

  it('el peso colombiano no lleva decimales', () => {
    expect(formatMoney(1500, 'COP')).toBe('COP$1.500')
  })

  it('el sol peruano va pegado: el símbolo acaba en barra, no en letra', () => {
    expect(formatMoney(350, 'PEN')).toBe('S/350.00')
  })

  it('un símbolo que acaba en letra lleva espacio, o se lee como palabra', () => {
    expect(formatMoney(350, 'BOB')).toBe('Bs 350,00')
    expect(formatMoney(350, 'HNL')).toBe('L 350.00')
  })

  it('el euro es la excepción y se queda detrás, como en España', () => {
    // Cinco cifras: el español no agrupa los millares de cuatro dígitos, así
    // que 1500 sale "1500,00" y no probaría el separador.
    expect(formatMoney(15000, 'EUR')).toBe('15.000,00 €')
  })

  it('sin moneda cae en dólares, no en una cadena rota', () => {
    expect(formatMoney(99.5)).toBe('$99.50')
    expect(formatMoney(99.5, null)).toBe('$99.50')
  })

  it('una moneda desconocida no revienta: cae en dólares', () => {
    expect(formatMoney(10, 'XYZ')).toBe('$10.00')
  })

  it('el cero se enseña, no se esconde', () => {
    expect(formatMoney(0, 'MXN')).toBe('MX$0.00')
  })
})

// simboloMoneda lo usan los PDF y los mensajes que arman el importe a mano.
// Tiene que salir de la misma tabla que formatMoney: cuando cada sitio tenía
// su propio `moneda === 'COP' ? ... : '$'`, las cotizaciones de un taller
// argentino salían etiquetadas en pesos colombianos.
describe('simboloMoneda', () => {
  it('devuelve el símbolo de cada moneda', () => {
    expect(simboloMoneda('MXN')).toBe('MX$')
    expect(simboloMoneda('PEN')).toBe('S/')
  })

  it('sin moneda o con una desconocida, el dólar', () => {
    expect(simboloMoneda()).toBe('$')
    expect(simboloMoneda('XYZ')).toBe('$')
  })
})

// En la gráfica de ingresos cada columna mide unos cincuenta píxeles en un
// móvil, y el importe entero se salía del recuadro y se montaba sobre la
// columna de al lado. Un taller lo vio en Reportes.
describe('formatMoneyCompacto', () => {
  it('acorta los millares', () => {
    expect(formatMoneyCompacto(12345, 'USD')).toBe('$12.3k')
  })

  it('acorta los millones', () => {
    expect(formatMoneyCompacto(1234567, 'USD')).toBe('$1.2M')
  })

  it('quita el decimal cuando es cero: "12k", no "12.0k"', () => {
    expect(formatMoneyCompacto(12000, 'USD')).toBe('$12k')
    expect(formatMoneyCompacto(2000000, 'USD')).toBe('$2M')
  })

  it('por debajo de mil va el número redondo, sin sufijo', () => {
    expect(formatMoneyCompacto(850, 'USD')).toBe('$850')
    expect(formatMoneyCompacto(0, 'USD')).toBe('$0')
  })

  it('respeta el símbolo de cada moneda y su espacio', () => {
    expect(formatMoneyCompacto(12345, 'MXN')).toBe('MX$12.3k')
    expect(formatMoneyCompacto(12345, 'BOB')).toBe('Bs 12.3k')
  })

  it('los negativos no pierden el signo', () => {
    expect(formatMoneyCompacto(-12345, 'USD')).toBe('$-12.3k')
  })
})
