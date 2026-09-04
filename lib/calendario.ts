/**
 * Las horas de una cita tal como las va a leer Google Calendar.
 *
 * Google acepta dos formas de `dateTime`. Si mandas un instante absoluto
 * ("...T10:00:00Z") la zona horaria que declares al lado se ignora. Si mandas
 * una hora sin zona ("...T10:00:00") la interpreta en la `timeZone` del evento.
 *
 * La segunda es la única correcta aquí. La anterior hacía
 * `new Date(fecha + 'T' + hora).toISOString()`, que interpreta la hora en el
 * reloj del SERVIDOR —UTC en Vercel— y la manda como instante absoluto: una
 * cita de las 10:00 de la mañana le aparecía al taller a las 4:00 de la
 * madrugada. Por eso aquí no se usa `Date` en ningún momento: sumar minutos a
 * mano no puede desplazarse de zona.
 */
export function horasDeCita(
  fecha: string,
  hora: string,
  minutosDuracion = 60,
): { inicio: string; fin: string } | null {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec((fecha ?? '').trim())
  // La hora puede venir como "10:00" o como "10:00:00" según de dónde salga.
  const reloj = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec((hora ?? '').trim())
  if (!dia || !reloj) return null

  const h = Number(reloj[1])
  const m = Number(reloj[2])
  if (h > 23 || m > 59) return null

  const total = h * 60 + m + Math.max(0, minutosDuracion)

  // Pasada la medianoche la cita termina al día siguiente. Se resuelve con
  // UTC, que no tiene horario de verano, y solo para mover el número del día:
  // la hora que se manda sigue siendo la local.
  const diasExtra = Math.floor(total / (24 * 60))
  const finMin    = total % (24 * 60)

  const dd = (n: number) => String(n).padStart(2, '0')
  let diaFin = `${dia[1]}-${dia[2]}-${dia[3]}`
  if (diasExtra > 0) {
    const d = new Date(Date.UTC(Number(dia[1]), Number(dia[2]) - 1, Number(dia[3]) + diasExtra))
    diaFin = `${d.getUTCFullYear()}-${dd(d.getUTCMonth() + 1)}-${dd(d.getUTCDate())}`
  }

  return {
    inicio: `${dia[1]}-${dia[2]}-${dia[3]}T${dd(h)}:${dd(m)}:00`,
    fin:    `${diaFin}T${dd(Math.floor(finMin / 60))}:${dd(finMin % 60)}:00`,
  }
}
