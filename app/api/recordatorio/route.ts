export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { ordenId, meses } = await req.json()
    const supabase = createClient()

    const fechaRecordatorio = new Date()
    fechaRecordatorio.setMonth(fechaRecordatorio.getMonth() + meses)

    const { error } = await supabase
      .from('ordenes')
      .update({
        recordatorio_fecha: fechaRecordatorio.toISOString().split('T')[0],
        recordatorio_enviado: false,
      })
      .eq('id', ordenId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, fecha: fechaRecordatorio.toISOString().split('T')[0] })
  } catch (error: any) {
    console.error('Error recordatorio:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}