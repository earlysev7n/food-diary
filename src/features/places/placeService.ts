// Purpose: Read and write saved places through Supabase.

import { supabase } from '../../lib/supabase'
import type { Place, PlaceStatus } from './types'

export type CreatePlaceInput = {
  spaceId: string
  name: string
  address: string
  latitude: number
  longitude: number
  externalPlaceId: string
  status: PlaceStatus
  createdBy: string
}

export async function createPlace(
  input: CreatePlaceInput,
): Promise<Place> {
  // Save the selected Nominatim result inside the active Space.
  const { data, error } = await supabase
    .from('places')
    .insert({
      space_id: input.spaceId,
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      external_place_id: input.externalPlaceId,
      status: input.status,
      created_by: input.createdBy,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Place
}

export async function getPlaces(
  spaceId: string,
): Promise<Place[]> {
  // Load all places visible to the active Space.
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as Place[]
}

export async function updatePlaceStatus(
  placeId: string,
  status: PlaceStatus,
): Promise<Place> {
  // Change a place between wishlist and visited.
  const { data, error } = await supabase
    .from('places')
    .update({ status })
    .eq('id', placeId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Place
}

export async function togglePlaceFavorite(
  placeId: string,
  isFavorite: boolean,
): Promise<Place> {
  // Toggle the favorite flag for a saved place.
  const { data, error } = await supabase
    .from('places')
    .update({ is_favorite: isFavorite })
    .eq('id', placeId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Place
}
