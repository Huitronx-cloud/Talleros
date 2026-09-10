import { getPais } from './paises'

/**
 * La fecha de hoy, en la zona horaria del taller.
 *
 * ── El fallo que corrige ────────────────────────────────────────────────────
 *
 * Por toda la aplicación se venía usando esto para guardar una fecha:
 *
 *   new Date().toISOString().split('T')[0]
 *
 * `toISOString()` devuelve SIEMPRE UTC, también en el navegador. Así que a las
 * 18:30 en México ya son las 00:30 del día siguiente en UTC, y la orden que
 * acabas de abrir queda registrada con la fecha de mañana.
 *
 * El horario por defecto de los talleres cierra a las 18:00, o sea que el
 * papeleo del cierre —cobrar, marcar entregado, imprimir— cae de lleno en la
 * franja rota. Se comprobó en producción: de 110 órdenes de talleres mexicanos,
 * 6 tenían la fecha de entrada un día adelantada, y las 6 se habían creado
 * entre las 18:57 y las 23:44 hora local. Ninguna antes de las 18:00.
 *
 * Y esa fecha la ve el cliente: sale en el PDF de la orden y en el portal del
 * vehículo. Alguien que dejó su coche un martes por la noche leía que lo dejó
 * el miércoles.
 *
 * ── Por qué la zona del taller y no la del navegador ───────────────────────
 *
 * Porque "el día que entró el coche" es el día DEL TALLER. En el servidor no
 * hay más remedio —Vercel corre en UTC y no tiene ninguna zona que adivinar—,
 * y en el navegador usar la misma fuente evita que la fecha dependa de dónde
 * esté quien la teclea: un dueño revisando el móvil desde otro país no debería
 * abrirle una orden a su taller con la fecha de allí.
 *
 * Los husos salen de lib/paises, que ya los tenía para Google Calendar. Ahí
 * este mismo error costó que una cita de las 10:00 acabara a las 4 de la
 * madrugada.
 */

/** La fecha (YYYY-MM-DD) que es "hoy" en una zona horaria IANA. */
export function fechaHoyEnZona(zona: string, ahora: Date = new Date()): string {
  // formatToParts en vez de format(): no depende de cómo cada motor ordene los
  // trozos de una configuración regional.
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
  }).formatToParts(ahora)

  const trozo = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''
  const y = trozo('year')
  const m = trozo('month')
  const d = trozo('day')

  // Si la zona no existiera, Intl lanza antes de llegar aquí; esto cubre el
  // caso raro de que devuelva partes incompletas. Mejor la fecha UTC que una
  // cadena a medias que se guarde en la base.
  if (!y || !m || !d) return ahora.toISOString().split('T')[0]

  return `${y}-${m}-${d}`
}

/** La fecha que es "hoy" para un taller, según su país. */
export function fechaHoyDelTaller(pais?: string | null, ahora: Date = new Date()): string {
  return fechaHoyEnZona(getPais(pais).zona, ahora)
}

/**
 * El principio de un mes y el principio del siguiente, para acotar consultas.
 *
 * Existe porque el tope de órdenes del plan se contaba así:
 *
 *   .gte('created_at', `${mes}-01`).lt('created_at', `${mes}-31`)
 *
 * Y "2026-09-31" no es una fecha. Postgres no la interpreta de más: rechaza la
 * consulta entera con "date/time field value out of range". Como el error no
 * se miraba, el contador se quedaba en null, caía a 0, y el resultado era que
 * en abril, junio, septiembre y noviembre —y en febrero— el tope de órdenes
 * del plan NO SE APLICABA, y el aviso decía "has creado 0 órdenes este mes".
 *
 * La cota de arriba es el día 1 del mes siguiente y es exclusiva, así que vale
 * para meses de 28, 29, 30 y 31 sin saber cuál es cuál.
 */
export function rangoDelMes(fecha: string): { inicio: string; fin: string } {
  const [año, mes] = fecha.split('-').map(Number)
  const inicio = `${String(año).padStart(4, '0')}-${String(mes).padStart(2, '0')}-01`
  const fin = mes === 12
    ? `${año + 1}-01-01`
    : `${String(año).padStart(4, '0')}-${String(mes + 1).padStart(2, '0')}-01`
  return { inicio, fin }
}
