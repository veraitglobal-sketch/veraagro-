import { NextRequest, NextResponse } from 'next/server';

const OSM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Server-side Nominatim reverse geocode so we send a valid User-Agent (OSM policy)
 * and avoid slow/hanging client fetches. Called from the grower "Request transport" form.
 */
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!Number.isFinite(latN) || !Number.isFinite(lonN) || Math.abs(latN) > 90 || Math.abs(lonN) > 180) {
    return NextResponse.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  const u = new URL(OSM_REVERSE);
  u.searchParams.set('format', 'json');
  u.searchParams.set('lat', String(latN));
  u.searchParams.set('lon', String(lonN));
  u.searchParams.set('accept-language', 'en, sr, de, fr');

  try {
    const res = await fetch(u.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BioVeraWeb/1.0 (https://biovera.app; grower transport)',
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'geocoder_unavailable' }, { status: 502 });
    }
    const data = (await res.json()) as { display_name?: string };
    if (!data.display_name) {
      return NextResponse.json({ displayName: null });
    }
    return NextResponse.json({ displayName: data.display_name });
  } catch (err) {
    console.error('reverse-geocode error:', err);
    return NextResponse.json({ error: 'geocoder_unavailable' }, { status: 503 });
  }
}
