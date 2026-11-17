import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// Health check endpoint - returns static response for static export
// For Capacitor builds, actual backend health is checked client-side
export async function GET() {
  return NextResponse.json({ ready: true });
}
