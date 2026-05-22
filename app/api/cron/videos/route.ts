import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY! // misma key sirve para YouTube
const BREVO_API_KEY  = process.env.BREVO_API_KEY!
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY!

// ── Keywords para buscar videos relevantes ────────────────────────────────────
const KEYWORDS_YOUTUBE = [
  'taller mecánico México',
  'cómo administrar taller automotriz',
  'negocio mecánica automotriz',
  'gestión taller mecánico',
  'cómo conseguir clientes taller',
  'emprendimiento automotriz México',
  'taller mecánico Colombia',
  'taller mecánico exitoso',
  'administrar negocio automotriz',
  'mecánica automotriz negocio',
]

const KEYWORDS_TIKTOK = [
  'taller mecánico',
  'mecánico México',
  'negocio automotriz',
  'taller automotriz',
  'mecánica general',
]

interface Video {
  plataforma: 'YouTube' | 'TikTok'
  titulo: string
  url: string
  canal: string
  descripcion: string
  vistas: string
  fecha: string
}

// ── Buscar videos en YouTube ──────────────────────────────────────────────────
async function buscarYouTube(keyword: string): Promise<Video[]> {
  try {
    const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const query      = encodeURIComponent(keyword)
    const url        = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&order=viewCount&publishedAfter=${hace30dias}&maxResults=3&relevanceLanguage=es&key=${GOOGLE_API_KEY}`

    const res  = await fetch(url)
    const data = await res.json()

    if (!data.items) return []

    return data.items.map((item: any) => ({
      plataforma:  'YouTube' as const,
      titulo:      item.snippet.title,
      url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
      canal:       item.snippet.channelTitle,
      descripcion: item.snippet.description?.slice(0, 200) ?? '',
      vistas:      'N/A',
      fecha:       item.snippet.publishedAt?.slice(0, 10) ?? '',
    }))
  } catch (e) {
    console.error('YouTube search error:', e)
    return []
  }
}

// ── Buscar videos en TikTok (via búsqueda web) ───────────────────────────────
// TikTok no tiene API pública para buscar — usamos una alternativa
async function buscarTikTok(keyword: string): Promise<Video[]> {
  try {
    // Buscamos en Google videos de TikTok sobre el tema
    const query = encodeURIComponent(`site:tiktok.com ${keyword}`)
    const url   = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${GOOGLE_API_KEY}&cx=partner-pub-tiktok&num=3`

    const res  = await fetch(url)
    const data = await res.json()

    if (!data.items) return []

    return data.items
      .filter((item: any) => item.link.includes('tiktok.com'))
      .map((item: any) => ({
        plataforma:  'TikTok' as const,
        titulo:      item.title,
        url:         item.link,
        canal:       item.displayLink,
        descripcion: item.snippet?.slice(0, 200) ?? '',
        vistas:      'N/A',
        fecha:       new Date().toISOString().slice(0, 10),
      }))
  } catch {
    return []
  }
}

// ── Generar comentario personalizado con Claude ───────────────────────────────
async function generarComentario(video: Video): Promise<string> {
  try {
    const prompt = `Eres el community manager de TallerOS — un software para talleres mecánicos en LATAM.

Genera un comentario en español para este video de ${video.plataforma}:
- Título: "${video.titulo}"
- Canal: ${video.canal}
- Descripción: "${video.descripcion}"

El comentario debe:
1. Ser 100% relevante al contenido del video — menciona algo específico del título o tema
2. Aportar valor real — comparte una experiencia o dato útil relacionado
3. Mencionar TallerOS de forma natural al final — NO como publicidad directa
4. Incluir la URL: tallerosapp.com
5. Tener máximo 4 líneas — corto y natural
6. Sonar como una persona real, no como marketing
7. En español de México/LATAM — casual pero profesional

NO empieces con "¡" ni con saludos genéricos. Ve directo al punto.
NO uses hashtags.
NO suenes a vendedor.

Solo devuelve el comentario, sin explicaciones ni comillas.`

    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    return data.content?.[0]?.text ?? 'No se pudo generar comentario'
  } catch {
    return 'No se pudo generar comentario'
  }
}

// ── Enviar reporte por email ──────────────────────────────────────────────────
async function enviarReporte(videos: Array<Video & { comentario: string }>): Promise<void> {
  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    <p style="margin:8px 0 0;color:#93c5fd;font-size:14px;">🎯 Videos para comentar hoy — ${fecha}</p>
  </div>

  <div style="padding:28px 32px;">
    <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
      Aquí tienes <strong>${videos.length} videos</strong> relevantes de hoy con comentarios listos para publicar. 
      Solo copia el comentario, abre el video y pégalo. <strong>Tarda menos de 10 minutos.</strong>
    </p>

    ${videos.map((v, i) => `
    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:${v.plataforma === 'YouTube' ? '#ff0000' : '#000'};color:#fff;font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;">
          ${v.plataforma === 'YouTube' ? '▶ YouTube' : '♪ TikTok'}
        </span>
        <span style="color:#94a3b8;font-size:12px;">${v.fecha}</span>
      </div>
      
      <p style="color:#0f172a;font-size:15px;font-weight:700;margin-bottom:4px;">${i + 1}. ${v.titulo}</p>
      <p style="color:#64748b;font-size:13px;margin-bottom:12px;">Canal: ${v.canal}</p>
      
      <a href="${v.url}" style="display:inline-block;background:#f1f5f9;color:#2563eb;padding:6px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin-bottom:16px;">
        🔗 Abrir video
      </a>

      <div style="background:#f0fdf4;border-radius:10px;padding:16px;border:1px solid #bbf7d0;">
        <p style="color:#166534;font-size:12px;font-weight:700;margin-bottom:8px;">✍️ COMENTARIO SUGERIDO — copia y pega:</p>
        <p style="color:#166534;font-size:14px;line-height:1.7;margin:0;font-style:italic;">${v.comentario}</p>
      </div>
    </div>
    `).join('')}

    <div style="background:#eff6ff;border-radius:12px;padding:16px;border:1px solid #bfdbfe;margin-top:8px;">
      <p style="color:#1d4ed8;font-size:13px;line-height:1.7;margin:0;">
        💡 <strong>Tips:</strong> Dale like al video antes de comentar. No copies el mismo comentario en varios videos. Si alguien te responde, continúa la conversación antes de mencionar TallerOS. Máximo 3-4 comentarios por día.
      </p>
    </div>
  </div>

  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      © 2026 TallerOS · Reporte generado automáticamente cada mañana
    </p>
  </div>
</div>`

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'TallerOS Agente', email: 'hola@tallerosapp.com' },
      to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
      subject:     `🎯 ${videos.length} videos para comentar hoy — TallerOS`,
      htmlContent: html,
    }),
  })
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🎯 Agente de videos iniciado...')

    // Elegir 2 keywords del día rotando
    const diaDelMes    = new Date().getDate()
    const keywordYT1   = KEYWORDS_YOUTUBE[diaDelMes % KEYWORDS_YOUTUBE.length]
    const keywordYT2   = KEYWORDS_YOUTUBE[(diaDelMes + 1) % KEYWORDS_YOUTUBE.length]
    const keywordTT    = KEYWORDS_TIKTOK[diaDelMes % KEYWORDS_TIKTOK.length]

    // Buscar videos
    const [yt1, yt2, tt] = await Promise.all([
      buscarYouTube(keywordYT1),
      buscarYouTube(keywordYT2),
      buscarTikTok(keywordTT),
    ])

    // Combinar y limitar a 5 videos
    const todosLosVideos = [...yt1, ...yt2, ...tt].slice(0, 5)

    if (todosLosVideos.length === 0) {
      console.log('No se encontraron videos hoy')
      return NextResponse.json({ ok: true, videos: 0, message: 'No se encontraron videos' })
    }

    // Generar comentarios con Claude para cada video
    const videosConComentarios = await Promise.all(
      todosLosVideos.map(async video => ({
        ...video,
        comentario: await generarComentario(video),
      }))
    )

    // Enviar reporte por email
    await enviarReporte(videosConComentarios)

    console.log(`✅ ${videosConComentarios.length} videos encontrados y enviados`)

    return NextResponse.json({
      ok:      true,
      videos:  videosConComentarios.length,
      message: `Reporte enviado a hola@tallerosapp.com`,
    })
  } catch (error: any) {
    console.error('Video agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
