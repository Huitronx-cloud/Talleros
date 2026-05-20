import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.tallerosapp.com'
  const date = '2026-05-20'

  return [
    { url: base,                    lastModified: date, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/mexico`,        lastModified: date, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/colombia`,      lastModified: date, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/peru`,          lastModified: date, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/registro`,      lastModified: date, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,         lastModified: date, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacidad`,    lastModified: date, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terminos`,      lastModified: date, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
