import { NextResponse } from 'next/server'

export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record maxLength="30" transcribe="true" transcribeCallback="https://tallerosapp.com/api/twiml/transcribe"/>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  })
}

export async function POST() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record maxLength="30" transcribe="true" transcribeCallback="https://tallerosapp.com/api/twiml/transcribe"/>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  })
}