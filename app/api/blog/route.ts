import { NextResponse } from 'next/server'
import { createPublicReadClient } from '@/lib/supabase-public'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createPublicReadClient()
    const { data } = await supabase
      .from('articulos_blog')
      .select('titulo, slug, excerpt, pais, published_at')
      .eq('publicado', true)
      .order('published_at', { ascending: false })
      .limit(50)

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    })
  } catch (e: any) {
    return NextResponse.json([], { status: 200 })
  }
}