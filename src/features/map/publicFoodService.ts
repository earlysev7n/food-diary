// Purpose: Load public OpenStreetMap food spots for the visible map area.

import type { PublicFoodSpot } from '../places/types'

const OVERPASS_URL = 'https://lz4.overpass-api.de/api/interpreter'
const MAX_QUERY_ZOOM = 11

export type FoodMapBounds = {
  north: number
  south: number
  east: number
  west: number
}

type OverpassElement = {
  id: number
  type: PublicFoodSpot['osmType']
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

type OverpassResponse = {
  elements?: OverpassElement[]
}

const FOOD_AMENITIES =
  'restaurant|cafe|fast_food|bar|pub|food_court|ice_cream|biergarten'
const FOOD_SHOPS = 'bakery|confectionery|tea|coffee'

function getCategory(tags: Record<string, string>) {
  const value = tags.amenity ?? tags.shop ?? 'food'

  return value
    .replace('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getAddress(tags: Record<string, string>) {
  const street = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ')
  const locality = [
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:postcode'],
  ]
    .filter(Boolean)
    .join(', ')

  return [street, locality].filter(Boolean).join(', ') || null
}

function toFoodSpot(element: OverpassElement): PublicFoodSpot | null {
  const tags = element.tags
  const coordinates = element.center ??
    (element.lat !== undefined && element.lon !== undefined
      ? { lat: element.lat, lon: element.lon }
      : null)

  if (!tags?.name || !coordinates) {
    return null
  }

  return {
    id: `${element.type}/${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: tags.name,
    category: getCategory(tags),
    address: getAddress(tags),
    latitude: coordinates.lat,
    longitude: coordinates.lon,
  }
}

function buildQuery(bounds: FoodMapBounds) {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`

  return `[out:json][timeout:15];
(
  nwr["amenity"~"^(${FOOD_AMENITIES})$"](${bbox});
  nwr["shop"~"^(${FOOD_SHOPS})$"](${bbox});
);
out tags center;`
}

export async function getPublicFoodSpots(
  bounds: FoodMapBounds,
  zoom: number,
  signal?: AbortSignal,
): Promise<PublicFoodSpot[]> {
  if (zoom < MAX_QUERY_ZOOM) {
    return []
  }

  const requestUrl = new URL(OVERPASS_URL)
  requestUrl.searchParams.set('data', buildQuery(bounds))

  const response = await fetch(requestUrl, { signal })

  if (!response.ok) {
    throw new Error('Public food spots are temporarily unavailable.')
  }

  const data = (await response.json()) as OverpassResponse

  if (!Array.isArray(data.elements)) {
    throw new Error('The public food map returned an invalid response.')
  }

  const spots = data.elements
    .map(toFoodSpot)
    .filter((spot): spot is PublicFoodSpot => spot !== null)

  return Array.from(
    new Map(spots.map((spot) => [spot.id, spot])).values(),
  )
}
