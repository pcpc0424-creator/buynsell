import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'BuyNSell-Philippines/1.0 (https://wwlbns.com)';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // 'search' or 'reverse'

  if (!type || !['search', 'reverse'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid type parameter. Use "search" or "reverse"' },
      { status: 400 }
    );
  }

  try {
    let url: string;
    const params = new URLSearchParams();

    if (type === 'reverse') {
      const lat = searchParams.get('lat');
      const lon = searchParams.get('lon');

      if (!lat || !lon) {
        return NextResponse.json(
          { error: 'Missing lat or lon parameter' },
          { status: 400 }
        );
      }

      params.set('lat', lat);
      params.set('lon', lon);
      params.set('format', 'json');
      params.set('addressdetails', '1');
      url = `${NOMINATIM_BASE_URL}/reverse?${params}`;
    } else {
      const q = searchParams.get('q');

      if (!q) {
        return NextResponse.json(
          { error: 'Missing q (query) parameter' },
          { status: 400 }
        );
      }

      params.set('q', q);
      params.set('format', 'json');
      params.set('addressdetails', '1');
      params.set('limit', searchParams.get('limit') || '5');
      params.set('countrycodes', searchParams.get('countrycodes') || 'ph');
      url = `${NOMINATIM_BASE_URL}/search?${params}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Nominatim API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geocoding data' },
      { status: 500 }
    );
  }
}
