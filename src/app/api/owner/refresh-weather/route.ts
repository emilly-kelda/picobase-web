import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

/** WeatherWidget's manual refresh button. router.refresh() alone re-renders
 *  owner/page.tsx but getWeather()'s fetch (lib/weather.ts) still has up to
 *  600s left on its Data Cache entry, so it would just return the same
 *  cached reading — this marks /owner's cache entries (including that
 *  fetch) stale first, so the router.refresh() the client fires right
 *  after actually hits Open-Meteo again. (revalidateTag would be the more
 *  surgical tool, but this Next.js version's revalidateTag now requires a
 *  cache-life "profile" argument the rest of this app doesn't otherwise
 *  use — revalidatePath needs no such setup and this route has exactly one
 *  caller.) */
export async function POST() {
  revalidatePath('/owner')
  return NextResponse.json({ ok: true })
}
