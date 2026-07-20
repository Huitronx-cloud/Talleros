export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextRequest, NextResponse } from 'next/server'
import { createPublicReadClient } from '@/lib/supabase-public'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createPublicReadClient()
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