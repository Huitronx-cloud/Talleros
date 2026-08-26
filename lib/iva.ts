// ── IVA / impuesto de venta por país ──────────────────────────────────────────
// Los precios que se capturan son SIN IVA; el sistema lo agrega encima para el
// total.
//
// La tabla vive ahora en lib/paises.ts junto con la moneda, porque son el mismo
// dato: de qué país es el taller. Este archivo se conserva para no tocar los
// cuatro sitios que ya importan `getIva`, pero ya no guarda su propia copia.
import { getPais } from './paises'
import { simboloMoneda } from './utils'

export function getIva(pais?: string | null) {
  const { tasa, etiqueta } = getPais(pais)
  return { tasa, etiqueta }
}

/**
 * Símbolo de la moneda.
 *
 * Antes devolvía 'COP $' para Colombia y '$' para todo lo demás, así que un
 * taller argentino veía un '$' a secas y uno peruano también. Ahora sale de la
 * tabla de monedas de utils.ts, que ya tenía las diez de la región.
 */
export function getMoneda(moneda?: string | null): string {
  return simboloMoneda(moneda ?? 'MXN')
}
