import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.tallerosapp.com'

async function getArticulos() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('articulos_blog')
    .select('slug, published_at')
    .eq('publicado', true)
  return data ?? []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articulos = await getArticulos()

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,          changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/mexico`,    changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/colombia`,  changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/peru`,      changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/demo`,      changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guia`,      changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`,      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE_URL}/registro`,  changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/login`,     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terminos`,  changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const blog: MetadataRoute.Sitemap = articulos.map((art) => ({
    url: `${BASE_URL}/blog/${art.slug}`,
    lastModified: art.published_at ? new Date(art.published_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...estaticas, ...blog]
}
