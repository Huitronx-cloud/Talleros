/**
 * ¿Hay que avisar al mecánico de que le asignaron esta orden?
 *
 * Vive aparte de `editarOrden` para poder probarla: la regla es corta pero se
 * equivoca fácil, y equivocarse tiene dos formas malas.
 *
 *   · No avisar cuando toca → el mecánico no se entera de que tiene trabajo.
 *     Es lo que pasaba hasta el 28/08/2026: el aviso solo salía al CREAR la
 *     orden, y en un taller lo normal es al revés — entra el coche, se abre la
 *     orden, y después se decide quién la agarra.
 *
 *   · Avisar de más → cada vez que alguien guarda la orden tocando el
 *     kilometraje o una nota, al mecánico le suena el teléfono por un trabajo
 *     que ya sabía que tenía. Dos o tres de esos y apaga las notificaciones
 *     para siempre; a partir de ahí ya no se entera de nada.
 *
 * Los espacios se recortan antes de comparar: " Juan" y "Juan" son la misma
 * persona, y el desplegable no siempre es de donde sale el valor (las órdenes
 * viejas se escribieron a mano).
 *
 * A quien le RETIRAN la orden no se le avisa. Decisión del dueño (28/08/2026):
 * ya tiene bastante con perder el trabajo, y añadir ruido no ayuda a nadie.
 */
export function debeAvisarAlMecanico(
  mecanicoAntes: string | null | undefined,
  mecanicoAhora: string | null | undefined,
): boolean {
  const antes = mecanicoAntes?.trim() || ''
  const ahora = mecanicoAhora?.trim() || ''

  // Sin mecánico nuevo no hay a quién avisar — ni cuando se lo quitan a alguien.
  if (!ahora) return false

  return ahora !== antes
}
