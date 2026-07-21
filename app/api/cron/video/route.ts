import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createPublicReadClient } from '@/lib/supabase-public'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!
const AVATAR_ID      = 'ba5663aec89b48d490599ce785fb6dcf'
const VOICE_ID       = '2d6055a78a56492ebb6596bac583532a'
const BASE_URL = 'https://kbtszjpqtoqhrfnqjaxv.supabase.co/storage/v1/object/public/video-fondos'

const FONDOS = [
  'hf_20260617_233855_8932e797-aa26-46a1-9c39-c0c127253523.png',
  'hf_20260617_233915_161980db-a346-45d6-956e-dd3ff6203abe.png',
  'hf_20260617_233904_d53bbbc9-367c-42dd-89a3-8be02d3e6e93.png',
  'hf_20260617_154750_209bebe9-e539-449e-a73a-310d67c6e5ce.png',
  'hf_20260617_233908_f22373cf-29bd-42ee-bb1f-f00b2c84cd1a.png',
  'hf_20260617_233858_3582fe28-df7e-4057-9896-cfdc5716418a.png',
  'hf_20260617_233912_e79ea8dc-21cb-4bc2-ac8a-da2845843da7.png',
  'hf_20260617_153335_36aebaee-45eb-4d14-99cd-cd462f416db8.png',
  'hf_20260617_154755_ec0e05a3-f15c-4ac4-9f34-45c74f8d7850.png',
  'hf_20260617_233901_7e513654-4d22-43ae-8429-f28d2b0cd88e.png',
  'hf_20260617_233924_ff19e22e-0c21-481e-ba95-ccf1b9859b2f.png',
  'hf_20260617_233948_defe2396-6bdb-49fe-b048-8d767a741bd4.png',
  'hf_20260617_233918_e9d80f68-caca-4f62-aff9-59b409775e01.png',
  'hf_20260617_233935_e1f75866-86b0-4da2-a894-e9e0fe072431.png',
  'hf_20260617_233953_698a4b4c-77ff-43a6-88cf-4bc13930bf96.png',
  'hf_20260617_233928_c3e5ede2-c552-4485-85bb-e3a30b96b327.png',
  'hf_20260617_233958_58779396-854a-424d-a94c-60f2dcd4ea9e.png',
  'hf_20260617_233943_8f317186-fa83-46ae-9261-a1363cd924b9.png',
  'hf_20260617_233931_f97fbd2f-8cb0-4221-8e6b-04de3cb4a71a.png',
  'hf_20260617_233921_2c8de8a5-bac3-44e7-94de-57ccf89ca5e5.png',
  'hf_20260617_234027_1a91e7a2-ac85-48b5-914f-e26a6105d1e0.png',
  'hf_20260617_234003_70b28826-c09f-44df-bc17-8f5f2836b84a.png',
  'hf_20260617_234008_7edaba6e-ec30-4072-a76f-805108f0d12b.png',
]
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
  scale:     1.8,
  matting:   true,
  offset:    { x: 0, y: 0.15 },
},
        voice: {
          type:     'text',
          input_text: script,
          voice_id: VOICE_ID,
          speed:    1.05,
        },
        background: {
  type:       'image',
  url:        `${BASE_URL}/${FONDOS[Math.floor(Math.random() * FONDOS.length)]}`,
},
      }],
      dimension:  { width: 1080, height: 1920 },
title:      titulo,
caption:    true,
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

  const supabase = createPublicReadClient()

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

  const supabase = createPublicReadClient()

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