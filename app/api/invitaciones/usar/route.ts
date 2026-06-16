export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const admin = createServiceClient()

  await admin
    .from('invitaciones')
    .update({ usado: true })
    .eq('token', token)

  return NextResponse.json({ success: true })
}