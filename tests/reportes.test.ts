import { describe, it, expect } from 'vitest'
import { tasaDeConversion } from '@/lib/reportes'

describe('tasaDeConversion', () => {
  it('nunca pasa de 100, que es el bug que se arregló', () => {
    // El caso real: un taller con tres órdenes y una cotización veía "300%",
    // porque la cuenta cruzaba dos poblaciones distintas. Ahora todo sale de
    // las cotizaciones, y aprobadas ⊆ enviadas.
    const cotizaciones = [{ estado: 'aprobada' }]
    expect(tasaDeConversion(cotizaciones)).toBe(100)
  })

  it('no cuenta los borradores en el denominador', () => {
    // Nueve borradores encima de la mesa no significan que el taller cierre
    // mal: significan que aún no los ha mandado.
    const cotizaciones = [
      { estado: 'aprobada' },
      { estado: 'enviada'  },
      ...Array.from({ length: 9 }, () => ({ estado: 'borrador' })),
    ]
    expect(tasaDeConversion(cotizaciones)).toBe(50)
  })

  it('cuenta las rechazadas, que sí se mandaron', () => {
    const cotizaciones = [
      { estado: 'aprobada'  },
      { estado: 'rechazada' },
      { estado: 'rechazada' },
      { estado: 'enviada'   },
    ]
    expect(tasaDeConversion(cotizaciones)).toBe(25)
  })

  it('devuelve null si no se ha mandado ninguna, no cero', () => {
    expect(tasaDeConversion([])).toBeNull()
    expect(tasaDeConversion([{ estado: 'borrador' }, { estado: 'borrador' }])).toBeNull()
  })

  it('da 0 cuando sí se mandaron y ninguna se aprobó', () => {
    // Aquí el cero es verdad y tiene que salir: se mandaron dos y no cerró
    // ninguna. Es distinto de no haber mandado nada.
    expect(tasaDeConversion([{ estado: 'enviada' }, { estado: 'rechazada' }])).toBe(0)
  })

  it('aguanta un estado nulo o desconocido sin contarlo como aprobada', () => {
    const cotizaciones = [
      { estado: 'aprobada' },
      { estado: null },
      { estado: 'vencida' },
    ]
    expect(tasaDeConversion(cotizaciones)).toBe(33)
  })

  it('redondea a entero', () => {
    const cotizaciones = [
      { estado: 'aprobada' },
      { estado: 'enviada'  },
      { estado: 'enviada'  },
    ]
    expect(tasaDeConversion(cotizaciones)).toBe(33)
  })
})
