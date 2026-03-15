import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasKey: !!process.env.LIVEKIT_API_KEY,
    keyStart: process.env.LIVEKIT_API_KEY ? process.env.LIVEKIT_API_KEY.slice(0, 4) : 'none',
    hasSecret: !!process.env.LIVEKIT_API_SECRET,
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    env: process.env.NODE_ENV,
  });
}
