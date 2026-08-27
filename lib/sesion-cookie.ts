/**
 * La cookie de contexto de sesión: quién eres, con qué rol y de qué taller.
 *
 * Existe para no repetir la misma consulta en cada navegación. Cada pantalla
 * del panel empezaba preguntándole a la base cuál es el `taller_id` del usuario
 * — un viaje completo desde la función en Virginia hasta Supabase en Oregón,
 * para obtener un valor que no cambia en toda la sesión y que el middleware
 * acababa de resolver medio segundo antes.
 *
 * La escribe el middleware, que es el único que puede: un Server Component
 * puede leer cookies pero no ponerlas.
 *
 * ── Por qué es seguro guardar aquí el taller ────────────────────────────────
 * Porque no es la frontera de seguridad. Toda la RLS filtra por
 * `get_my_taller_id()`, que el servidor deriva de la sesión y no de nada que
 * mande el cliente; el `.eq('taller_id', …)` de las páginas es redundante con
 * la base. Falsificar este valor no enseña datos de otro taller — y además la
 * cookie es httpOnly, así que el JavaScript de la página ni la ve.
 *
 * ── Lo que NO hay que hacer con ella ────────────────────────────────────────
 * El `rol` viaja aquí para el middleware, que ya lo cacheaba así antes. Pero
 * una comprobación de permisos dentro de una página NO debe leerlo de aquí:
 * la cookie vive una hora, así que a alguien a quien le quitaron el rol de
 * administrador le seguiría valiendo hasta 60 minutos. Para decidir accesos,
 * consultar `usuarios.rol` — es lo que hacen `configuracion/page.tsx` y
 * `/api/promociones`, y es a propósito.
 *
 * Por lo mismo el `taller_id` tampoco es eterno: si algún día un usuario
 * cambia de taller, tarda como mucho una hora en reflejarse. No se rompe nada
 * mientras tanto (la RLS sigue devolviendo lo del taller de verdad), pero
 * conviene saberlo.
 */

export const COOKIE_CONTEXTO = '_u_ctx'

/** Una hora, igual que la cookie de rol a la que sustituye. */
export const COOKIE_CONTEXTO_MAX_AGE = 3600

export interface ContextoSesion {
  userId:   string
  rol:      string
  tallerId: string
}

export function formatearContexto(ctx: ContextoSesion): string {
  return `${ctx.userId}|${ctx.rol}|${ctx.tallerId}`
}

/**
 * Devuelve el contexto solo si la cookie está completa y es de este usuario.
 * Cualquier otra cosa —cookie vieja de dos campos, de otro usuario, a medias—
 * devuelve null para que quien llame vaya a la base.
 */
export function leerContexto(valor: string | undefined, userId: string): ContextoSesion | null {
  if (!valor) return null
  const [cookieUserId, rol, tallerId] = valor.split('|')
  if (cookieUserId !== userId || !rol || !tallerId) return null
  return { userId, rol, tallerId }
}
