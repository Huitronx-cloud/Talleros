import { describe, it, expect } from 'vitest'
import { describirVehiculo } from '@/lib/recordatorios'

describe('el coche como se le nombra al cliente en el recordatorio', () => {
  // Este texto va dentro de un WhatsApp a un cliente real: "ya toca revisar
  // {{vehiculo}}". Cualquier cosa rara aquí la lee una persona en su teléfono.
  it('arma el nombre completo cuando están los tres datos', () => {
    expect(describirVehiculo('Toyota', 'Corolla', 2020)).toBe('2020 Toyota Corolla')
    expect(describirVehiculo('BYD', 'Atto 3', '2024')).toBe('2024 BYD Atto 3')
  })

  it('no deja huecos dobles cuando falta un dato de en medio', () => {
    // El fallo de la versión anterior: `${anio} ${marca} ${modelo}`.trim()
    // limpia los extremos pero no el hueco de en medio, así que una orden sin
    // marca salía como "2020  Corolla" con dos espacios.
    expect(describirVehiculo(null, 'Corolla', 2020)).toBe('2020 Corolla')
    expect(describirVehiculo('Toyota', null, 2020)).toBe('2020 Toyota')
    expect(describirVehiculo('Toyota', 'Corolla', null)).toBe('Toyota Corolla')
  })

  it('recorta los espacios que traen los datos escritos a mano', () => {
    expect(describirVehiculo('  Nissan ', ' Versa', ' 2018 ')).toBe('2018 Nissan Versa')
  })

  it('sin ningún dato dice "tu vehículo", que encaja en la frase del mensaje', () => {
    expect(describirVehiculo(null, null, null)).toBe('tu vehículo')
    expect(describirVehiculo('', '', '')).toBe('tu vehículo')
    expect(describirVehiculo(undefined, undefined, undefined)).toBe('tu vehículo')
  })

  it('un año en cero no se cuela en el mensaje', () => {
    // 0 es un dato malo, no un año. String(0) es "0", así que sin descartarlo
    // a propósito el cliente leería "0 Toyota Corolla".
    expect(describirVehiculo('Toyota', 'Corolla', 0)).toBe('Toyota Corolla')
    expect(describirVehiculo('Toyota', 'Corolla', '0')).toBe('Toyota Corolla')
  })
})
