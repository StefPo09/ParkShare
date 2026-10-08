import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { apiKey: process.env.GOOGLE_MAPS_API_KEY?.trim() || '' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
