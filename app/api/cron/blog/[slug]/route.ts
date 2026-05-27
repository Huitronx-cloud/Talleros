import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('articulos_blog')
      .select('*')
      .eq('slug', params.slug)
      .eq('publicado', true)
      .single()

    if (!data) return NextResponse.json(null, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null, { status: 404 })
  }
}