import { describe, it, expect } from 'vitest'
import { diasDeVida, estaCaducado, DIAS_DE_VIDA } from '@/lib/mensajes-pendientes'

// Un taller acumuló 48 avisos de "su vehículo está listo", el más viejo de
// hace 55 días. Mandar hoy uno de esos le llega a un cliente que recogió su
// coche hace casi dos meses.
function hace(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
}

describe('diasDeVida', () => {
  it('los avisos y las citas mueren en una semana: hablan de algo que pasa ahora', () => {
    expect(diasDeVida('aviso')).toBe(7)
    expect(diasDeVida('cita')).toBe(7)
  })

  it('el seguimiento y los recordatorios aguantan el mes', () => {
    expect(diasDeVida('seguimiento')).toBe(30)
    expect(diasDeVida('recordatorio')).toBe(30)
    expect(diasDeVida('resena')).toBe(30)
  })

  it('un tipo que no conocemos no caduca antes de tiempo: 30 por defecto', () => {
    expect(diasDeVida('algo_que_no_existe')).toBe(30)
  })

  it('todos los tipos de la tabla tienen un plazo positivo', () => {
    for (const [tipo, dias] of Object.entries(DIAS_DE_VIDA)) {
      expect(dias, tipo).toBeGreaterThan(0)
    }
  })
})

describe('estaCaducado', () => {
  it('un aviso de hace 55 días está caducado — el caso que lo motivó', () => {
    expect(estaCaducado('aviso', hace(55))).toBe(true)
  })

  it('un aviso de hoy no', () => {
    expect(estaCaducado('aviso', hace(0))).toBe(false)
  })

  it('justo en el plazo todavía vive: se caduca al pasarlo, no al llegar', () => {
    expect(estaCaducado('aviso', hace(6))).toBe(false)
    expect(estaCaducado('aviso', hace(8))).toBe(true)
  })

  it('un seguimiento de dos semanas sigue sirviendo, un aviso de dos semanas no', () => {
    expect(estaCaducado('seguimiento', hace(14))).toBe(false)
    expect(estaCaducado('aviso',       hace(14))).toBe(true)
  })

  it('las promociones duran lo que una campaña', () => {
    expect(estaCaducado('promocion', hace(10))).toBe(false)
    expect(estaCaducado('promocion', hace(20))).toBe(true)
  })
})
