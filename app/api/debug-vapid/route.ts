import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    vapid_public:  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'OK (' + process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.slice(0, 10) + '...)' : 'FALTA',
    vapid_private: process.env.VAPID_PRIVATE_KEY ? 'OK' : 'FALTA',
    vapid_email:   process.env.VAPID_EMAIL ?? 'FALTA',
  })
}