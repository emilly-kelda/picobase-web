import { NextResponse } from 'next/server'

/** Proxies Nominatim (OpenStreetMap) search server-side rather than calling
 *  it directly from the browser — their usage policy requires a
 *  descriptive User-Agent identifying the application (requests without
 *  one can get blocked), which isn't something a client-side fetch can set
 *  reliably. Backs the spot-location search in Settings/
 *  GeneralSettingsModal.tsx; the debounce on the input already keeps this
 *  well under Nominatim's ~1 req/sec fair-use guidance. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 3) return NextResponse.json({ results: [] })

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PicoBase-SchoolApp/1.0 (spot-location search, contact via app owner)',
      },
    })
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const results = (Array.isArray(data) ? data : [])
      .map((r: any) => ({
        displayName: r.display_name as string,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
      }))
      .filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
