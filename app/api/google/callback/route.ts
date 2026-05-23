import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI  = 'https://www.tallerosapp.com/api/google/callback'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/configuracion?error=google_denied', req.url))
  }

  try {
    // Decodificar state para obtener taller_id
    const { taller_id } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Intercambiar code por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }).toString(),
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      console.error('Token error:', tokens)
      return NextResponse.redirect(new URL('/configuracion?error=google_token', req.url))
    }

    // Obtener info del perfil de Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()

    // Obtener ubicaciones de Google My Business
    let gmb_location_id = null
    let gmb_account_id  = null

    try {
      const accountsRes = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      )
      const accountsData = await accountsRes.json()
      const account = accountsData.accounts?.[0]

      if (account) {
        gmb_account_id = account.name

        const locationsRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri,phoneNumbers`,
          { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        )
        const locationsData = await locationsRes.json()
        const location = locationsData.locations?.[0]
        if (location) gmb_location_id = location.name
      }
    } catch (e) {
      console.error('GMB accounts error:', e)
    }

    // Guardar tokens en Supabase
    const supabase = createClient()
    await supabase
      .from('talleres')
      .update({
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
        google_token_expiry:  new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
        google_email:         profile.email ?? null,
        gmb_account_id,
        gmb_location_id,
        google_connected_at:  new Date().toISOString(),
      })
      .eq('id', taller_id)

    return NextResponse.redirect(
      new URL('/configuracion?success=google_connected', req.url)
    )
  } catch (error: any) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(new URL('/configuracion?error=google_callback', req.url))
  }
}
