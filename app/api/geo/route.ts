import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const country =
    req.geo?.country ??
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    'US'

  return NextResponse.json({ country }, {
    headers: {
      'Cache-Control': 'no-store',
      'Vary': 'x-vercel-ip-country',
    },
  })
}
