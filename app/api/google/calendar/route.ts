import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

async function refrescarToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }).toString(),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { cita_id } = await req.json()

    // Obtener datos del taller
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    const { data: taller } = await supabase
      .from('talleres')
      .select('nombre, google_access_token, google_refresh_token, google_token_expiry')
      .eq('id', usuario?.taller_id)
      .single()

    if (!taller?.google_access_token) {
      return NextResponse.json({
        error: 'Google Calendar no conectado',
        conectar: '/api/google/connect'
      }, { status: 400 })
    }

    // Refrescar token si expiró
    let accessToken = taller.google_access_token
    const expiry    = new Date(taller.google_token_expiry ?? 0)
    if (expiry < new Date() && taller.google_refresh_token) {
      const nuevoToken = await refrescarToken(taller.google_refresh_token)
      if (nuevoToken) {
        accessToken = nuevoToken
        await supabase
          .from('talleres')
          .update({
            google_access_token: nuevoToken,
            google_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', usuario?.taller_id)
      }
    }

    // Obtener datos de la cita
    const { data: cita } = await supabase
      .from('citas')
      .select(`
        id, fecha, hora, duracion_minutos, notas, servicio,
        clientes(nombre, telefono, email),
        vehiculos(marca, modelo, año, placa)
      `)
      .eq('id', cita_id)
      .single()

    if (!cita) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    const cliente  = (cita.clientes as any)
    const vehiculo = (cita.vehiculos as any)

    // Construir evento para Google Calendar
    const fechaInicio = new Date(`${cita.fecha}T${cita.hora}`)
    const fechaFin    = new Date(fechaInicio.getTime() + (cita.duracion_minutos ?? 60) * 60 * 1000)

    const evento = {
      summary:     `🔧 ${cliente?.nombre ?? 'Cliente'} — ${cita.servicio ?? 'Servicio'}`,
      description: [
        `Taller: ${taller.nombre}`,
        `Cliente: ${cliente?.nombre ?? '—'}`,
        `Teléfono: ${cliente?.telefono ?? '—'}`,
        `Vehículo: ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año} (${vehiculo.placa})` : '—'}`,
        `Servicio: ${cita.servicio ?? '—'}`,
        cita.notas ? `Notas: ${cita.notas}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: fechaInicio.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: fechaFin.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9', // Azul — color de TallerOS
    }

    // Crear evento en Google Calendar
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evento),
      }
    )

    const calData = await calRes.json()

    if (!calRes.ok) {
      console.error('Calendar error:', calData)
      return NextResponse.json({ error: 'Error creando evento en Calendar' }, { status: 500 })
    }

    // Guardar google_event_id en la cita
    await supabase
      .from('citas')
      .update({ google_calendar_event_id: calData.id })
      .eq('id', cita_id)

    return NextResponse.json({
      ok:       true,
      event_id: calData.id,
      html_link: calData.htmlLink,
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
