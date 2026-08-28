import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

/**
 * Notificaciones push a un usuario del taller.
 *
 * ── Por qué es una función y no un endpoint ─────────────────────────────────
 * Esto vivía en `/api/push/enviar`, y los dos sitios que lo usaban —asignar una
 * orden a un mecánico y avisar de una cita nueva— le hacían `fetch` a nuestro
 * propio dominio. Dos problemas:
 *
 *   · Ese endpoint **no tenía ninguna autenticación**. Tomaba el `usuarioId`
 *     del cuerpo de la petición y le mandaba lo que fuera. El middleware
 *     excluye todo `/api/` del guard de sesión y el filtro de CORS solo mira la
 *     cabecera `Origin`, que una petición desde un servidor sencillamente no
 *     manda. Cualquiera con un id de usuario podía mandarle notificaciones.
 *   · Era un viaje de red del servidor a sí mismo para hacer algo que puede
 *     hacer en el sitio.
 *
 * Llamando la función directamente desaparecen los dos: no hay puerta que
 * cerrar si no hay puerta.
 */

interface Notificacion {
  usuarioId: string
  titulo:    string
  cuerpo:    string
  url?:      string
}

/**
 * Manda la notificación a todos los dispositivos del usuario.
 *
 * No lanza nunca: una push que no sale no puede tumbar la acción que la
 * disparó — asignar la orden importa más que el aviso.
 */
export async function enviarPushAUsuario(n: Notificacion): Promise<void> {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: suscripciones, error } = await admin
      .from('push_suscripciones')
      .select('endpoint, p256dh, auth')
      .eq('usuario_id', n.usuarioId)

    if (error) {
      console.error('[push] no se pudieron leer las suscripciones:', error.message)
      return
    }
    if (!suscripciones?.length) return

    const payload = JSON.stringify({ title: n.titulo, body: n.cuerpo, url: n.url })

    const resultados = await Promise.allSettled(
      suscripciones.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    )

    for (let i = 0; i < resultados.length; i++) {
      const r = resultados[i]
      if (r.status !== 'rejected') continue

      // Solo se borra la suscripción cuando el servicio de push dice que ya no
      // existe: 404 o 410 Gone. Nada más.
      //
      // Antes se borraba ante CUALQUIER rechazo, y `sendNotification` rechaza
      // por muchos motivos que no tienen nada que ver con el dispositivo: un
      // timeout de red, un 429 por exceso de envíos, un 500 del servicio de
      // Google o Apple, o una VAPID mal configurada. Con eso, un corte de red
      // de un segundo mientras se avisa de una orden le quitaba las
      // notificaciones al mecánico **para siempre** — y sin decírselo a nadie.
      // Tenía que volver a activarlas a mano sin saber por qué dejaron de
      // llegarle.
      const codigo = (r.reason as any)?.statusCode
      if (codigo !== 404 && codigo !== 410) {
        console.error(
          `[push] fallo temporal al notificar a ${n.usuarioId} (código ${codigo ?? 'desconocido'}), la suscripción se conserva:`,
          (r.reason as any)?.message ?? r.reason
        )
        continue
      }

      const { error: errorBorrado } = await admin
        .from('push_suscripciones')
        .delete()
        .eq('endpoint', suscripciones[i].endpoint)

      if (errorBorrado) {
        console.error('[push] no se pudo limpiar una suscripción caducada:', errorBorrado.message)
      }
    }
  } catch (e) {
    console.error('[push] error inesperado enviando notificación:', e)
  }
}
