import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!
const AVATAR_ID      = 'bdabbdd8148f48feba33a77e7619e65e'
const VOICE_ID       = '82d534d580f04edb8e4701f6f00f92ea'

async function generarVideo(script: string, titulo: string): Promise<string | null> {
  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key':    HEYGEN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type:      'avatar',
          avatar_id: AVATAR_ID,
          scale:     1,
        },
        voice: {
          type:     'text',
          input_text: script,
          voice_id: VOICE_ID,
          speed:    1.05,
        },
        background: {
          type:  'color',
          value: '#0a0f1e',
        },
      }],
      dimension: { width: 1080, height: 1920 },
      title: titulo,
    }),
  })

  const data = await res.json()
  return data?.data?.video_id ?? null
}

async function obtenerVideoUrl(videoId: string): Promise<string | null> {
  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY },
  })
  const data = await res.json()
  const status = data?.data?.status
  if (status === 'completed') return data?.data?.video_url ?? null
  return null
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: scripts, error } = await supabase
    .from('scripts_video')
    .select('*')
    .eq('publicado', false)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error || !scripts || scripts.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'No hay scripts pendientes' })
  }

  const scriptRow = scripts[0]

  try {
    const videoId = await generarVideo(scriptRow.script, scriptRow.titulo)
    if (!videoId) {
      return NextResponse.json({ error: 'HeyGen no devolvió video_id' }, { status: 500 })
    }

    await supabase
      .from('scripts_video')
      .update({ heygen_video_id: videoId })
      .eq('id', scriptRow.id)

    return NextResponse.json({
      ok:       true,
      video_id: videoId,
      titulo:   scriptRow.titulo,
      mensaje:  'Video en generación, revisar estado en 5-10 minutos',
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { video_id, script_id } = await req.json()
  if (!video_id || !script_id) {
    return NextResponse.json({ error: 'Faltan video_id o script_id' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const videoUrl = await obtenerVideoUrl(video_id)
  if (!videoUrl) {
    return NextResponse.json({ ok: false, mensaje: 'Video aún procesando' })
  }

  await supabase
    .from('scripts_video')
    .update({ video_url: videoUrl, publicado: true })
    .eq('id', script_id)

  return NextResponse.json({ ok: true, video_url: videoUrl })
}