import { describe, it, expect } from 'vitest'
import { debeAvisarAlMecanico } from '@/lib/asignacion'

describe('avisar al mecánico solo cuando le asignan la orden', () => {
  it('se la asignan a alguien que no la tenía', () => {
    // El caso que faltaba: la orden se abre sin mecánico y se asigna después.
    expect(debeAvisarAlMecanico(null, 'Juan Pérez')).toBe(true)
    expect(debeAvisarAlMecanico('', 'Juan Pérez')).toBe(true)
    expect(debeAvisarAlMecanico(undefined, 'Juan Pérez')).toBe(true)
  })

  it('se la pasan de un mecánico a otro: avisa al nuevo', () => {
    expect(debeAvisarAlMecanico('Juan Pérez', 'Pedro Ruiz')).toBe(true)
  })

  it('guardar la orden sin tocar el mecánico NO avisa', () => {
    // Editar el kilometraje tres veces no puede mandar tres avisos por el mismo
    // trabajo: el mecánico acabaría apagando las notificaciones.
    expect(debeAvisarAlMecanico('Juan Pérez', 'Juan Pérez')).toBe(false)
  })

  it('los espacios de más no cuentan como un cambio', () => {
    expect(debeAvisarAlMecanico('Juan Pérez', ' Juan Pérez ')).toBe(false)
    expect(debeAvisarAlMecanico(' Juan Pérez', 'Juan Pérez')).toBe(false)
  })

  it('quitarle la orden a alguien no avisa a nadie', () => {
    // Decisión del dueño: ya tiene bastante con perder el trabajo.
    expect(debeAvisarAlMecanico('Juan Pérez', '')).toBe(false)
    expect(debeAvisarAlMecanico('Juan Pérez', null)).toBe(false)
    expect(debeAvisarAlMecanico('Juan Pérez', '   ')).toBe(false)
  })

  it('una orden que nunca tuvo mecánico y sigue sin tenerlo no avisa', () => {
    expect(debeAvisarAlMecanico(null, null)).toBe(false)
    expect(debeAvisarAlMecanico('', '')).toBe(false)
  })

  it('distingue mayúsculas: son personas distintas dadas de alta', () => {
    // El desplegable manda el nombre tal cual está en `usuarios`, así que dos
    // grafías distintas son dos filas distintas y hay que avisar.
    expect(debeAvisarAlMecanico('juan pérez', 'Juan Pérez')).toBe(true)
  })
})
