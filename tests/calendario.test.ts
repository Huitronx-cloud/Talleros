import { describe, it, expect } from 'vitest'
import { horasDeCita } from '@/lib/calendario'

describe('las horas que se le mandan a Google Calendar', () => {
  // Si esto se desplaza, la cita le aparece al taller a otra hora y alguien se
  // presenta cuando no toca. La versión anterior hacía
  // `new Date(fecha + 'T' + hora).toISOString()`, que interpreta la hora en el
  // reloj del servidor —UTC en Vercel— y mandaba un instante absoluto: las
  // 10:00 de la mañana caían a las 4:00 de la madrugada.
  it('devuelve la hora local tal cual, sin zona pegada', () => {
    expect(horasDeCita('2026-09-10', '10:00')).toEqual({
      inicio: '2026-09-10T10:00:00',
      fin:    '2026-09-10T11:00:00',
    })
  })

  it('no lleva Z ni desplazamiento: eso haría que Google ignore la zona', () => {
    const h = horasDeCita('2026-09-10', '10:00')!
    expect(h.inicio).not.toMatch(/Z|[+-]\d{2}:\d{2}$/)
    expect(h.fin).not.toMatch(/Z|[+-]\d{2}:\d{2}$/)
  })

  it('acepta la hora con y sin segundos', () => {
    expect(horasDeCita('2026-09-10', '09:30:00')!.inicio).toBe('2026-09-10T09:30:00')
    expect(horasDeCita('2026-09-10', '9:05')!.inicio).toBe('2026-09-10T09:05:00')
  })

  it('respeta la duración que se le pase', () => {
    expect(horasDeCita('2026-09-10', '10:00', 90)!.fin).toBe('2026-09-10T11:30:00')
    expect(horasDeCita('2026-09-10', '10:00', 30)!.fin).toBe('2026-09-10T10:30:00')
  })

  it('una cita de última hora termina al día siguiente', () => {
    expect(horasDeCita('2026-09-10', '23:30', 60)!.fin).toBe('2026-09-11T00:30:00')
  })

  it('cruza bien el fin de mes y el fin de año', () => {
    expect(horasDeCita('2026-09-30', '23:30', 60)!.fin).toBe('2026-10-01T00:30:00')
    expect(horasDeCita('2026-12-31', '23:30', 60)!.fin).toBe('2027-01-01T00:30:00')
  })

  it('sin fecha u hora válidas devuelve null en vez de una hora inventada', () => {
    expect(horasDeCita('', '10:00')).toBeNull()
    expect(horasDeCita('2026-09-10', '')).toBeNull()
    expect(horasDeCita('10/09/2026', '10:00')).toBeNull()
    expect(horasDeCita('2026-09-10', '25:00')).toBeNull()
    expect(horasDeCita('2026-09-10', '10:75')).toBeNull()
  })
})
