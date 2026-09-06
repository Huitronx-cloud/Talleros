export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Deja constancia de que se le escribió a un carrito abandonado.
 *
 * Lo llama el botón de WhatsApp del panel justo antes de abrir el chat, para
 * que la próxima vez el mensaje sea distinto en vez de repetir el mismo texto.
 *
 * No lleva comprobación de sesión aquí porque cuelga de `/api/admin`, y el
 * middleware exige la cookie `admin_session` para todo lo que empieza así. Si
 * algún día se mueve fuera de ese prefijo, hay que traerse la comprobación.
 */
export async function POST(req: NextRequest) {
  let tallerId: string | undefined

  try {
    const cuerpo = await req.json()
    tallerId = cuerpo?.taller_id
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!tallerId) {
    return NextResponse.json({ error: 'Falta taller_id' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { error } = await admin.from('contactos_carrito').insert({ taller_id: tallerId })

  // Que no se registre no debe frenar el mensaje: el botón ya abrió WhatsApp y
  // lo importante es que la persona escriba. Solo significa que el próximo
  // texto puede repetirse.
  if (error) {
    console.error('[admin] no se registró el contacto del carrito:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
