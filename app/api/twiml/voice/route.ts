import { NextResponse } from 'next/server'

export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="30"/>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  })
}

export async function POST() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="30"/>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  })
}