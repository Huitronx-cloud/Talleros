import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLIENT_ID    = process.env.GOOGLE_CLIENT_ID!
const REDIRECT_URI = 'https://www.tallerosapp.com/api/google/callback'

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

export async function GET(req: NextRequest) {
  try {
    if (!CLIENT_ID) {
      return NextResponse.redirect(new URL('/configuracion?error=google_not_configured', req.url))
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.taller_id) {
      return NextResponse.redirect(new URL('/configuracion?error=no_taller', req.url))
    }

    const state = Buffer.from(JSON.stringify({
      taller_id: usuario.taller_id,
      user_id:   user.id,
    })).toString('base64')

    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         SCOPES,
      access_type:   'offline',
      prompt:        'consent',
      state,
    })

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    )
  } catch (error: any) {
    console.error('Google connect error:', error)
    return NextResponse.redirect(new URL('/configuracion?error=google_connect', req.url))
  }
}
