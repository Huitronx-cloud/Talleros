import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('articulos_blog')
      .select('titulo, slug, excerpt, pais, published_at')
      .eq('publicado', true)
      .order('published_at', { ascending: false })
      .limit(50)

    return NextResponse.json(data ?? [])
  } catch (e: any) {
    return NextResponse.json([], { status: 200 })
  }
}