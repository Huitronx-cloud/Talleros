import { describe, it, expect } from 'vitest'
import { fechaHoyEnZona, fechaHoyDelTaller, rangoDelMes } from '@/lib/fechas'

describe('fechaHoyEnZona', () => {
  it('devuelve el día de AYER cuando en UTC ya es de madrugada', () => {
    // El caso real que destapó el fallo: un pago a las 18:29 del 9 de
    // septiembre en México aparecía como del día 10 porque en UTC ya lo era.
    const instante = new Date('2026-09-10T00:29:56Z')
    expect(fechaHoyEnZona('America/Mexico_City', instante)).toBe('2026-09-09')
    // Y lo que hacía el código viejo, para que se vea la diferencia:
    expect(instante.toISOString().split('T')[0]).toBe('2026-09-10')
  })

  it('a las 18:00 en punto todavía es el mismo día', () => {
    // El horario por defecto de los talleres cierra a las 18:00: justo el
    // borde donde empezaba a fallar.
    expect(fechaHoyEnZona('America/Mexico_City', new Date('2026-08-26T00:00:00Z'))).toBe('2026-08-25')
  })

  it('antes de las 18:00 no cambia nada', () => {
    expect(fechaHoyEnZona('America/Mexico_City', new Date('2026-08-25T20:00:00Z'))).toBe('2026-08-25')
  })

  it('respeta el huso de cada país', () => {
    const instante = new Date('2026-09-10T02:00:00Z')
    expect(fechaHoyEnZona('America/Mexico_City', instante)).toBe('2026-09-09') // UTC-6
    expect(fechaHoyEnZona('America/Bogota', instante)).toBe('2026-09-09')      // UTC-5
    expect(fechaHoyEnZona('America/Argentina/Buenos_Aires', instante)).toBe('2026-09-09') // UTC-3
  })

  it('en Argentina el corte llega más tarde que en México', () => {
    // 2026-09-10T01:00Z: en México son las 19:00 del 9 (día anterior) y en
    // Argentina las 22:00 del 9. Los dos siguen en el 9.
    const instante = new Date('2026-09-10T01:00:00Z')
    expect(fechaHoyEnZona('America/Mexico_City', instante)).toBe('2026-09-09')
    expect(fechaHoyEnZona('America/Argentina/Buenos_Aires', instante)).toBe('2026-09-09')

    // A las 04:00Z Argentina ya pasó de día (01:00 del 10) y México no (22:00
    // del 9).
    const masTarde = new Date('2026-09-10T04:00:00Z')
    expect(fechaHoyEnZona('America/Mexico_City', masTarde)).toBe('2026-09-09')
    expect(fechaHoyEnZona('America/Argentina/Buenos_Aires', masTarde)).toBe('2026-09-10')
  })

  it('siempre devuelve YYYY-MM-DD con ceros delante', () => {
    const f = fechaHoyEnZona('America/Mexico_City', new Date('2026-01-05T18:00:00Z'))
    expect(f).toBe('2026-01-05')
    expect(f).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('fechaHoyDelTaller', () => {
  it('usa el huso del país del taller', () => {
    const instante = new Date('2026-09-10T02:00:00Z')
    expect(fechaHoyDelTaller('MX', instante)).toBe('2026-09-09')
    expect(fechaHoyDelTaller('AR', instante)).toBe('2026-09-09')
  })

  it('un país desconocido o vacío no revienta', () => {
    const instante = new Date('2026-09-10T02:00:00Z')
    expect(fechaHoyDelTaller(null, instante)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(fechaHoyDelTaller('ZZ', instante)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('rangoDelMes', () => {
  it('nunca produce un día 31 inventado', () => {
    // El bug: se usaba `${mes}-31` como cota, y "2026-09-31" no existe.
    // Postgres rechazaba la consulta entera y el tope del plan no se aplicaba.
    for (const mes of ['2026-02', '2026-04', '2026-06', '2026-09', '2026-11']) {
      const { fin } = rangoDelMes(`${mes}-15`)
      expect(fin.endsWith('-01')).toBe(true)
      expect(() => new Date(fin).toISOString()).not.toThrow()
    }
  })

  it('la cota de arriba es el día 1 del mes siguiente', () => {
    expect(rangoDelMes('2026-09-10')).toEqual({ inicio: '2026-09-01', fin: '2026-10-01' })
    expect(rangoDelMes('2026-02-28')).toEqual({ inicio: '2026-02-01', fin: '2026-03-01' })
  })

  it('diciembre pasa al año siguiente', () => {
    expect(rangoDelMes('2026-12-31')).toEqual({ inicio: '2026-12-01', fin: '2027-01-01' })
  })

  it('cubre el último día de un mes de 31', () => {
    const { inicio, fin } = rangoDelMes('2026-01-15')
    expect(inicio).toBe('2026-01-01')
    expect(fin).toBe('2026-02-01')
    // El 31 de enero cae dentro: era lo que la cota vieja dejaba fuera.
    expect('2026-01-31' >= inicio && '2026-01-31' < fin).toBe(true)
  })
})
