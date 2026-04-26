import { NextRequest, NextResponse } from 'next/server';

const OSM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

type NominatimAddr = {
  house_number?: string;
  house_name?: string;
  road?: string;
  pedestrian?: string;
  path?: string;
  footway?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
  state?: string;
  country?: string;
};

/**
 * Build a single-line address from structured fields when Nominatim has them
 * (house number only if OSM has it at this point — not guaranteed from GPS).
 */
function formatFromAddress(addr: NominatimAddr | undefined, displayName: string): string {
  if (!addr) return displayName;

  const street = (addr.road || addr.pedestrian || addr.path || addr.footway || addr.residential || '').trim();
  const hn = (addr.house_number || '').trim();
  const hnName = (addr.house_name || '').trim();

  let firstLine = '';
  if (street) {
    firstLine = hn ? `${street} ${hn}`.replace(/\s+/g, ' ').trim() : street;
  } else if (hnName) {
    firstLine = hnName;
  }

  const tail = [
    addr.suburb || addr.neighbourhood || addr.quarter,
    addr.postcode,
    addr.city || addr.town || addr.village || addr.municipality,
    addr.country,
  ].filter((x) => x && String(x).trim());

  if (firstLine && tail.length) {
    return `${firstLine}, ${tail.join(', ')}`;
  }
  if (firstLine) {
    return tail.length ? `${firstLine}, ${tail.join(', ')}` : firstLine;
  }
  return displayName;
}

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
  /** Building / street-level when OSM has data; improves road + house when mapped */
  u.searchParams.set('zoom', '18');
  u.searchParams.set('addressdetails', '1');

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
    const data = (await res.json()) as {
      display_name?: string;
      address?: NominatimAddr;
    };
    if (!data.display_name) {
      return NextResponse.json({ displayName: null, hasHouseNumber: false });
    }

    const structured = formatFromAddress(data.address, data.display_name);
    const hasHouseNumber = Boolean(
      data.address?.house_number?.trim() || data.address?.house_name?.trim(),
    );

    return NextResponse.json({
      displayName: structured,
      hasHouseNumber,
      /**
       * When false, Nominatim/OpenStreetMap often has no building number at this coordinate —
       * the grower should add the number for the driver.
       */
    });
  } catch (err) {
    console.error('reverse-geocode error:', err);
    return NextResponse.json({ error: 'geocoder_unavailable' }, { status: 503 });
  }
}
