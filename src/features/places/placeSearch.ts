// Purpose: Search nearby restaurants and identify the user's city/country.

import type { UserLocation } from './location'

export type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  namedetails?: Record<string, string>
}

export type SearchLocation = UserLocation & {
  city: string | null
  countryCode: string | null
  displayName: string | null
}

const NOMINATIM_SEARCH_URL =
  'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL =
  'https://nominatim.openstreetmap.org/reverse'

// Purpose: Keep requests below Nominatim's public-service rate limit.
let lastNominatimRequestAt = 0

async function waitForNominatimSlot() {
  const elapsed = Date.now() - lastNominatimRequestAt
  const remainingWait = Math.max(0, 1000 - elapsed)

  if (remainingWait > 0) {
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, remainingWait)
    })
  }

  lastNominatimRequestAt = Date.now()
}

async function fetchNominatim(url: URL): Promise<unknown> {
  await waitForNominatimSlot()

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Place search is temporarily unavailable.')
  }

  return response.json() as Promise<unknown>
}

export async function searchPlaces(
  query: string,
  location?: SearchLocation,
): Promise<NominatimResult[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    throw new Error('Enter a place name before searching.')
  }

  // Build the official Nominatim search URL.
  const searchUrl = new URL(NOMINATIM_SEARCH_URL)
  searchUrl.searchParams.set('q', trimmedQuery)
  searchUrl.searchParams.set('format', 'jsonv2')
  searchUrl.searchParams.set('limit', '8')
  searchUrl.searchParams.set('addressdetails', '1')
  searchUrl.searchParams.set('namedetails', '1')

  if (location) {
    // Bias results toward the user's current area without hard-blocking
    // results outside the area when a local place is not mapped.
    const radius = 0.2
    searchUrl.searchParams.set(
      'viewbox',
      [
        location.longitude - radius,
        location.latitude + radius,
        location.longitude + radius,
        location.latitude - radius,
      ].join(','),
    )

    if (location.countryCode) {
      // Restrict results to the detected country when reverse lookup worked.
      searchUrl.searchParams.set('countrycodes', location.countryCode)
    }
  }

  const rawResult = await fetchNominatim(searchUrl)

  if (!Array.isArray(rawResult)) {
    throw new Error('The place search returned an invalid response.')
  }

  return rawResult as NominatimResult[]
}

export async function reverseGeocode(
  location: UserLocation,
): Promise<SearchLocation> {
  const reverseUrl = new URL(NOMINATIM_REVERSE_URL)
  reverseUrl.searchParams.set('lat', String(location.latitude))
  reverseUrl.searchParams.set('lon', String(location.longitude))
  reverseUrl.searchParams.set('format', 'jsonv2')
  reverseUrl.searchParams.set('addressdetails', '1')

  const rawResult = await fetchNominatim(reverseUrl)

  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('Your location could not be identified.')
  }

  const result = rawResult as {
    display_name?: string
    address?: {
      city?: string
      town?: string
      municipality?: string
      village?: string
      country_code?: string
    }
  }

  const address = result.address

  return {
    ...location,
    city:
      address?.city ??
      address?.town ??
      address?.municipality ??
      address?.village ??
      null,
    countryCode: address?.country_code ?? null,
    displayName: result.display_name ?? null,
  }
}
