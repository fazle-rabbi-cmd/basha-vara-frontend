import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    return NextResponse.json({ ready: false }, { status: 503 });
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('application/json')) {
      return NextResponse.json({ ready: false }, { status: 503 });
    }

    const health = await response.json();
    return NextResponse.json(
      { ready: health.status === 'ok' },
      { status: health.status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ ready: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
