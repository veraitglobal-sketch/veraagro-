import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.biovera.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = API_URL.startsWith('http') ? API_URL : `https://${API_URL}`;
    const res = await fetch(`${apiUrl}/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Contact form proxy error:', err);
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message?.includes('timeout'));
    return NextResponse.json(
      { success: false, message: isTimeout ? 'Request timed out. Please try again or email us at info@biovera.app.' : 'Service temporarily unavailable. Please try again or email us at info@biovera.app.' },
      { status: 503 }
    );
  }
}
