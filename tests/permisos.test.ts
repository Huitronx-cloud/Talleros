import { describe, it, expect } from 'vitest'
import { puedeGestionarTaller, ROLES } from '@/lib/permisos'
import { leerContexto, formatearContexto } from '@/lib/sesion-cookie'

describe('quién manda en el taller', () => {
  it('el propietario y el administrador sí', () => {
    expect(puedeGestionarTaller('propietario')).toBe(true)
    expect(puedeGestionarTaller('admin')).toBe(true)
  })

  it('recepción y los técnicos no', () => {
    // Cuatro endpoints estaban abiertos a técnicos hasta el 27-28/08/2026:
    // /api/promociones (escribirle a todos los clientes), /api/stripe/portal
    // (cancelar la suscripción y ver la tarjeta), /api/stripe/checkout
    // (comprometer al taller con un cobro) y /api/exportar (bajarse la base
    // de clientes entera).
    expect(puedeGestionarTaller('recepcion')).toBe(false)
    expect(puedeGestionarTaller('tecnico')).toBe(false)
  })

  it('los cuatro roles reales están cubiertos por esta prueba', () => {
    // Si mañana se añade un rol a ROLES, esta prueba obliga a decidir
    // explícitamente de qué lado cae en vez de que se cuele sin mirarlo.
    expect([...ROLES].sort()).toEqual(['admin', 'propietario', 'recepcion', 'tecnico'])
  })

  it('nada raro se cuela', () => {
    const raros = [null, undefined, '', ' ', 'Propietario', 'PROPIETARIO',
                   'propietario ', 'superadmin', 'owner', 0, 1, true, {}, []]
    for (const v of raros) {
      expect(puedeGestionarTaller(v), `"${String(v)}" no debería pasar`).toBe(false)
    }
  })
})

describe('la cookie de contexto de sesión', () => {
  const U = 'usuario-aaa'
  const T = 'taller-111'

  it('devuelve el contexto cuando la cookie es de este usuario y está completa', () => {
    const ctx = leerContexto(`${U}|propietario|${T}`, U)
    expect(ctx).toEqual({ userId: U, rol: 'propietario', tallerId: T })
  })

  it('ida y vuelta: lo que se escribe es lo que se lee', () => {
    const original = { userId: U, rol: 'admin', tallerId: T }
    expect(leerContexto(formatearContexto(original), U)).toEqual(original)
  })

  it('una cookie de OTRO usuario se ignora', () => {
    // Pasa al cerrar sesión y entrar con otra cuenta en el mismo navegador.
    expect(leerContexto(`otro-usuario|admin|taller-999`, U)).toBeNull()
  })

  it('la cookie vieja de dos campos se ignora', () => {
    // El formato anterior era `userId|rol`, sin taller. Por eso la cookie
    // cambió de nombre — pero si alguna llegara con la forma vieja, a la base.
    expect(leerContexto(`${U}|propietario`, U)).toBeNull()
  })

  it('a la base ante cualquier cosa incompleta o corrupta', () => {
    for (const v of [undefined, '', `${U}|propietario|`, `${U}||${T}`, 'basura', '|||']) {
      expect(leerContexto(v, U), `"${String(v)}" debería mandar a la base`).toBeNull()
    }
  })
})
