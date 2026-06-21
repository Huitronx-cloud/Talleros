import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const transcriptionText = formData.get('TranscriptionText')
  const recordingUrl = formData.get('RecordingUrl')
  
  console.log('CODIGO META:', transcriptionText)
  console.log('Recording URL:', recordingUrl)
  
  return new NextResponse('OK', { status: 200 })
}