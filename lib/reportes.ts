/**
 * Las cuentas de los reportes que se pueden equivocar en silencio.
 *
 * Viven aquí y no dentro del componente porque una métrica mal calculada no
 * rompe nada: sale un número, se pinta bonito, y nadie se entera hasta que un
 * día enseña "300%" y ya lleva meses mintiendo.
 */

/** Lo único que hace falta saber de una cotización para estas cuentas. */
export interface CotizacionParaMetricas {
  estado?: string | null
}

/**
 * De las cotizaciones que el taller mandó a un cliente, cuántas dijeron que sí.
 *
 * El error que corrige: antes esto era órdenes ÷ cotizaciones. En TallerOS se
 * puede abrir una orden sin cotizar —que es lo normal: llega un coche y se
 * atiende—, así que el numerador contaba trabajos que nunca salieron de una
 * cotización. Un taller con tres órdenes y una cotización veía "300%".
 *
 * Los borradores no cuentan. Una cotización que nadie mandó no podía
 * convertir, y meterla en el denominador castiga al taller por tener trabajo a
 * medio hacer sobre la mesa.
 *
 * Devuelve null —no cero— cuando no se ha mandado ninguna: "0%" se lee como
 * "no cierras ni una", y lo cierto es que no hay nada que medir todavía.
 *
 * Como aprobadas ⊆ enviadas, el resultado no puede pasar de 100.
 */
export function tasaDeConversion(cotizaciones: CotizacionParaMetricas[]): number | null {
  const enviadas  = cotizaciones.filter(c => c.estado !== 'borrador')
  if (enviadas.length === 0) return null

  const aprobadas = enviadas.filter(c => c.estado === 'aprobada')
  return Math.round((aprobadas.length / enviadas.length) * 100)
}
