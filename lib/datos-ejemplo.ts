import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServicioItem, HistorialItem, EstadoOrden } from '@/types'

/**
 * Siembra de datos de muestra para un taller recién dado de alta.
 *
 * El agujero del embudo no está en la web sino justo después del registro: el
 * taller entra, ve un panel vacío y no vuelve. Con dos clientes y una orden en
 * curso ve de entrada cómo se ve su taller trabajando, y tiene algo que tocar
 * en vez de una pantalla en blanco con un botón.
 *
 * Todo lo que se crea aquí lleva es_ejemplo, así que no toca los topes del plan
 * y se puede borrar de golpe desde la lista de clientes.
 */

// Vehículos y averías corrientes en un taller de barrio en Latinoamérica: la
// muestra tiene que sonarle al dueño a un martes cualquiera, no a un catálogo.
const CLIENTES_EJEMPLO = [
  {
    nombre:          'Laura Medina',
    email:           null,
    vehiculo_marca:  'Nissan',
    vehiculo_modelo: 'Versa',
    vehiculo_año:    2019,
    placas:          'EJEMPLO-1',
    notas:           'Cliente de ejemplo. Puedes editarlo o borrarlo cuando quieras.',
  },
  {
    nombre:          'Jorge Peña',
    email:           null,
    vehiculo_marca:  'Chevrolet',
    vehiculo_modelo: 'Aveo',
    vehiculo_año:    2016,
    placas:          'EJEMPLO-2',
    notas:           'Cliente de ejemplo. Puedes editarlo o borrarlo cuando quieras.',
  },
]

// Tipado a propósito: sin esto, renombrar un campo de ServicioItem dejaría la
// muestra escribiendo una clave que ya nadie lee, y el fallo solo se vería al
// abrir la orden. Pasó con precio_unitario.
const ORDEN_EJEMPLO: {
  descripcion_problema: string
  diagnostico:          string
  servicios_realizados: ServicioItem[]
  kilometraje:          number
  estado:               EstadoOrden
  notas_internas:       string
} = {
  descripcion_problema: 'Rechina al frenar y el volante vibra a más de 80 km/h.',
  diagnostico:          'Balatas delanteras al límite y discos con alabeo. Se rectifican discos y se cambian balatas.',
  // Cada renglón guarda su total ya calculado, igual que los que escribe el
  // formulario de órdenes: el detalle lo imprime tal cual, no lo recalcula.
  servicios_realizados: [
    { descripcion: 'Juego de balatas delanteras', cantidad: 1, precio_unitario: 850, total:  850 },
    { descripcion: 'Rectificado de discos',       cantidad: 2, precio_unitario: 300, total:  600 },
    { descripcion: 'Mano de obra',                cantidad: 1, precio_unitario: 450, total:  450 },
  ],
  kilometraje:    98400,
  estado:         'en_proceso',
  notas_internas: 'Orden de ejemplo. Bórrala cuando registres tu primer trabajo real.',
}

/**
 * Crea la muestra. Necesita un cliente con clave de servicio: en el registro
 * todavía no hay sesión del usuario, así que las políticas de fila no aplican.
 *
 * `telefonoPropietario` es el del dueño del taller, y va a propósito en los
 * clientes de ejemplo: si prueba el botón de WhatsApp, el mensaje se lo manda a
 * sí mismo y ve exactamente lo que recibiría su cliente. Con un número
 * inventado, ese primer clic le escribiría a un desconocido.
 */
export async function sembrarDatosEjemplo(
  admin:               SupabaseClient,
  tallerId:            string,
  telefonoPropietario: string | null,
): Promise<void> {
  const telefono = telefonoPropietario?.trim() || null

  const { data: clientes, error: errClientes } = await admin
    .from('clientes')
    .insert(CLIENTES_EJEMPLO.map(c => ({ ...c, taller_id: tallerId, telefono, es_ejemplo: true })))
    .select('id, placas')

  if (errClientes || !clientes?.length) {
    throw errClientes ?? new Error('No se crearon los clientes de ejemplo')
  }

  // Se busca por placa en vez de tomar clientes[0]: el orden de las filas
  // devueltas por un insert múltiple no está garantizado, y colgar la orden del
  // cliente equivocado dejaría un Nissan a nombre del dueño del Chevrolet.
  const duenoDeLaOrden = clientes.find(c => c.placas === CLIENTES_EJEMPLO[0].placas)
  if (!duenoDeLaOrden) throw new Error('No se encontró el cliente de la orden de ejemplo')

  // El número de orden sale del contador atómico del taller, no de un valor
  // fijo: si no, chocaría con el índice único en cuanto el taller cree la suya.
  const { data: numero, error: errNumero } = await admin
    .rpc('siguiente_numero_orden', { p_taller_id: tallerId })
  if (errNumero) throw errNumero

  const total = ORDEN_EJEMPLO.servicios_realizados.reduce((suma, s) => suma + s.total, 0)

  const { error: errOrden } = await admin.from('ordenes').insert({
    ...ORDEN_EJEMPLO,
    taller_id:       tallerId,
    cliente_id:      duenoDeLaOrden.id,
    numero_orden:    numero,
    vehiculo_marca:  CLIENTES_EJEMPLO[0].vehiculo_marca,
    vehiculo_modelo: CLIENTES_EJEMPLO[0].vehiculo_modelo,
    vehiculo_año:    CLIENTES_EJEMPLO[0].vehiculo_año,
    placas:          CLIENTES_EJEMPLO[0].placas,
    subtotal:        total,
    total,
    es_ejemplo:      true,
    historial: [{
      estado: ORDEN_EJEMPLO.estado,
      fecha:  new Date().toISOString(),
      nota:   'Orden de ejemplo creada al registrar el taller',
    }] satisfies HistorialItem[],
  })

  if (errOrden) throw errOrden
}
