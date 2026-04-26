import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app';

async function proxy(request: NextRequest, method: 'GET' | 'POST') {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = auth;

  const url = `${API_URL.replace(/\/$/, '')}/logistics-partner/vehicles`;
  try {
    const init: RequestInit = { method, headers };
    if (method === 'POST') {
      const body = await request.text();
      if (body) init.body = body;
    }
    const res = await fetch(url, init);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch (err) {
    console.error('Logistics vehicles proxy error:', err);
    return NextResponse.json(
      { message: 'Service temporarily unavailable. Check NEXT_PUBLIC_API_URL and that the API is running.' },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxy(request, 'POST');
}
