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

export type FindDuplicatePlaceInput = {
  name: string
  address: string
  latitude: number
  longitude: number
  externalPlaceId: string
}

function normalizePlaceText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export async function findDuplicatePlace(
  spaceId: string,
  input: FindDuplicatePlaceInput,
): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('space_id', spaceId)

  if (error) {
    throw error
  }

  const normalizedName = normalizePlaceText(input.name)
  const normalizedAddress = normalizePlaceText(input.address)

  return (
    (data as Place[] | null)?.find((place) => {
      const sameExternalId =
        place.external_place_id === input.externalPlaceId
      const sameName = normalizePlaceText(place.name) === normalizedName
      const sameAddress =
        place.address !== null &&
        normalizePlaceText(place.address) === normalizedAddress
      const nearby =
        Math.abs(place.latitude - input.latitude) < 0.0005 &&
        Math.abs(place.longitude - input.longitude) < 0.0005

      return sameExternalId || (sameName && (sameAddress || nearby))
    }) ?? null
  )
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

export async function deletePlace(
  spaceId: string,
  placeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', placeId)
    .eq('space_id', spaceId)

  if (error) {
    throw error
  }
}
