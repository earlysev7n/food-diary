// Purpose: Calculate private, Space-scoped food statistics from existing tables.

import { supabase } from '../../lib/supabase'
import type { SpaceStats } from './types'

type PlaceRow = {
  id: string
  name: string
  status: 'wishlist' | 'visited'
}

type VisitRow = {
  id: string
  place_id: string
  visited_at: string
  overall_rating: number | null
}

type PhotoRow = {
  id: string
}

export async function getSpaceStats(
  spaceId: string,
): Promise<SpaceStats> {
  const [placesResult, visitsResult, photosResult] =
    await Promise.all([
      supabase
        .from('places')
        .select('id, name, status')
        .eq('space_id', spaceId),
      supabase
        .from('visits')
        .select('id, place_id, visited_at, overall_rating')
        .eq('space_id', spaceId)
        .order('visited_at', { ascending: false }),
      supabase
        .from('photos')
        .select('id')
        .eq('space_id', spaceId),
    ])

  const firstError =
    placesResult.error ??
    visitsResult.error ??
    photosResult.error

  if (firstError) {
    throw firstError
  }

  const places = (placesResult.data ?? []) as PlaceRow[]
  const visits = (visitsResult.data ?? []) as VisitRow[]
  const photos = (photosResult.data ?? []) as PhotoRow[]
  const placeNames = new Map(
    places.map((place) => [place.id, place.name]),
  )

  const ratings = visits
    .map((visit) => visit.overall_rating)
    .filter((rating): rating is number => rating !== null)

  const visitCounts = new Map<string, number>()

  for (const visit of visits) {
    visitCounts.set(
      visit.place_id,
      (visitCounts.get(visit.place_id) ?? 0) + 1,
    )
  }

  const mostVisitedPlaceId = [...visitCounts.entries()].sort(
    ([, firstCount], [, secondCount]) => secondCount - firstCount,
  )[0]?.[0]

  return {
    totalPlaces: places.length,
    visitedPlaces: places.filter((place) => place.status === 'visited')
      .length,
    wishlistPlaces: places.filter((place) => place.status === 'wishlist')
      .length,
    totalVisits: visits.length,
    totalPhotos: photos.length,
    averageVisitRating:
      ratings.length > 0
        ? Number(
            (
              ratings.reduce((total, rating) => total + rating, 0) /
              ratings.length
            ).toFixed(1),
          )
        : null,
    mostVisitedPlace: mostVisitedPlaceId
      ? placeNames.get(mostVisitedPlaceId) ?? null
      : null,
    recentVisits: visits.slice(0, 5).map((visit) => ({
      id: visit.id,
      placeName: placeNames.get(visit.place_id) ?? 'Unknown place',
      visitedAt: visit.visited_at,
      rating: visit.overall_rating,
    })),
  }
}
