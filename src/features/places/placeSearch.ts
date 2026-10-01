// Purpose: Search nearby restaurants and identify the user's city/country.

import type { UserLocation } from './location'

export type NominatimResult = {
  place_id: number
  osm_type?: 'node' | 'way' | 'relation'
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

export function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeForMatching(value: string) {
  return normalizeSearchQuery(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function getPlaceResultName(result: NominatimResult) {
  return (
    result.namedetails?.name?.trim() ??
    result.display_name.split(',')[0]?.trim() ??
    result.display_name
  )
}

function levenshteinDistance(left: string, right: string) {
  const previousRow = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  )

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previousRow[0]
    previousRow[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previousRow[rightIndex]
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1

      previousRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + 1,
        diagonal + substitutionCost,
      )
      diagonal = above
    }
  }

  return previousRow[right.length]
}

function textSimilarity(left: string, right: string) {
  if (left === right) {
    return 1
  }

  const longestLength = Math.max(left.length, right.length)

  if (longestLength === 0) {
    return 1
  }

  return 1 - levenshteinDistance(left, right) / longestLength
}

function scoreCandidate(query: string, candidate: string) {
  const normalizedQuery = normalizeForMatching(query)
  const normalizedCandidate = normalizeForMatching(candidate)

  if (!normalizedQuery || !normalizedCandidate) {
    return 0
  }

  if (normalizedCandidate === normalizedQuery) {
    return 1
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 0.98
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return 0.94
  }

  const queryTokens = normalizedQuery.split(' ')
  const candidateTokens = normalizedCandidate.split(' ')
  let bestTokenScore = textSimilarity(normalizedQuery, normalizedCandidate)

  for (const queryToken of queryTokens) {
    for (const candidateToken of candidateTokens) {
      bestTokenScore = Math.max(
        bestTokenScore,
        textSimilarity(queryToken, candidateToken) * 0.95,
      )
    }
  }

  return bestTokenScore
}

function getSearchResultScore(query: string, result: NominatimResult) {
  return Math.max(
    scoreCandidate(query, getPlaceResultName(result)),
    scoreCandidate(query, result.display_name.split(',')[0] ?? ''),
  )
}

export function rankSearchResults(
  query: string,
  results: NominatimResult[],
) {
  return results
    .map((result, index) => ({
      result,
      index,
      score: getSearchResultScore(query, result),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ result }) => result)
}

export function getSearchSuggestion(
  query: string,
  results: NominatimResult[],
) {
  const bestResult = rankSearchResults(query, results)[0]

  if (!bestResult) {
    return null
  }

  const name = getPlaceResultName(bestResult)
  const normalizedQuery = normalizeForMatching(query)
  const normalizedName = normalizeForMatching(name)
  const score = getSearchResultScore(query, bestResult)

  if (normalizedQuery === normalizedName || score < 0.72) {
    return null
  }

  return name
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
  const trimmedQuery = normalizeSearchQuery(query)

  if (!trimmedQuery) {
    throw new Error('Enter a place name before searching.')
  }

  if (trimmedQuery.length < 2) {
    throw new Error('Enter at least two characters to search.')
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
