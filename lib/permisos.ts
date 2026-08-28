/**
 * Quién puede hacer qué dentro de un taller.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 * La comprobación `['propietario', 'admin'].includes(rol)` estaba copiada a
 * mano en **once sitios**: cuatro APIs, cuatro pantallas y dos componentes. Con
 * once copias, cada una es una oportunidad de escribirla mal o de olvidarse de
 * ponerla — que es exactamente lo que pasó con `/api/promociones`,
 * `/api/stripe/portal`, `/api/stripe/checkout` y `/api/exportar`: las cuatro
 * estaban detrás de pantallas cerradas a técnicos, y ninguna comprobaba nada.
 * Un técnico podía cancelar la suscripción del taller o descargarse la base de
 * clientes entera.
 *
 * Aquí es una función, con pruebas. Si mañana entra un rol nuevo, se cambia en
 * un sitio y no en once.
 *
 * ── Importante: esto NO es la frontera de seguridad ─────────────────────────
 * El aislamiento entre talleres lo hace la RLS de Postgres, que deriva el
 * taller de la sesión con `get_my_taller_id()`. Esto decide qué puede hacer
 * alguien **dentro de su propio taller**, y por eso hay que comprobarlo donde
 * se ejecuta la acción: el middleware excluye todo `/api/` de su verificación
 * de rol, así que tener la página en `RUTAS_SOLO_ADMIN` protege la pantalla,
 * nunca el endpoint.
 *
 * Y el rol tiene que venir de la BASE, no de la cookie de sesión: esa cookie
 * vive una hora, así que a alguien a quien acaban de quitar el rol de
 * administrador le seguiría valiendo hasta 60 minutos. Ver `lib/sesion-cookie.ts`.
 */

/** Los cuatro roles que existen. Cualquier otra cosa es un dato corrupto. */
export const ROLES = ['propietario', 'admin', 'recepcion', 'tecnico'] as const
export type Rol = (typeof ROLES)[number]

/**
 * Manda en el taller: facturación, datos del taller, equipo, promociones,
 * reportes, inventario y exportar los datos.
 *
 * Acepta `unknown` a propósito. El rol llega de una consulta a Supabase y
 * puede ser null, undefined o una cadena inesperada; con un tipo estricto la
 * llamada necesitaría un `as string` en cada sitio y ese casteo es justo donde
 * se cuela un valor que nadie comprobó. Lo que no esté en la lista, no pasa.
 */
export function puedeGestionarTaller(rol: unknown): boolean {
  return rol === 'propietario' || rol === 'admin'
}

/**
 * Mensaje para el 403, para que las cuatro APIs digan lo mismo.
 * `accion` completa la frase: "…pueden gestionar la facturación".
 */
export function mensajeSinPermiso(accion: string): string {
  return `Solo el propietario y administradores pueden ${accion}`
}
