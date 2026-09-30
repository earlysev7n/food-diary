// Purpose: Load visits together with their place details.

import { supabase } from '../../lib/supabase'
import type { Visit, VisitPlace, VisitWithPlace } from './types'

export type CreateVisitInput = {
  spaceId: string
  placeId: string
  visitedAt: string
  overallRating: number | null
  note: string | null
  createdBy: string
}

export type UpdateVisitInput = {
  spaceId: string
  visitId: string
  visitedAt: string
  overallRating: number | null
  note: string | null
}

export async function createVisit(
  input: CreateVisitInput,
): Promise<Visit> {
  // Save the visit record.
  const { data, error } = await supabase
    .from('visits')
    .insert({
      space_id: input.spaceId,
      place_id: input.placeId,
      visited_at: input.visitedAt,
      overall_rating: input.overallRating,
      note: input.note,
      created_by: input.createdBy,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // A saved visit automatically marks the place as visited.
  const { error: placeError } = await supabase
    .from('places')
    .update({ status: 'visited' })
    .eq('id', input.placeId)
    .eq('space_id', input.spaceId)

  if (placeError) {
    throw placeError
  }

  return data as Visit
}

export async function updateVisit(
  input: UpdateVisitInput,
): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .update({
      visited_at: input.visitedAt,
      overall_rating: input.overallRating,
      note: input.note,
    })
    .eq('id', input.visitId)
    .eq('space_id', input.spaceId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Visit
}

export async function deleteVisit(
  spaceId: string,
  visitId: string,
  placeId: string,
): Promise<void> {
  // Remove the visit's storage files before deleting the database rows.
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('space_id', spaceId)
    .eq('visit_id', visitId)

  if (photosError) {
    throw photosError
  }

  const storagePaths = (photos ?? []).map(
    (photo) => photo.storage_path as string,
  )

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('visit-photos')
      .remove(storagePaths)

    if (storageError) {
      throw storageError
    }
  }

  const { error: photoRowsError } = await supabase
    .from('photos')
    .delete()
    .eq('space_id', spaceId)
    .eq('visit_id', visitId)

  if (photoRowsError) {
    throw photoRowsError
  }

  const { error: visitError } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId)
    .eq('space_id', spaceId)

  if (visitError) {
    throw visitError
  }

  // Keep the restaurant saved, but return it to the wishlist when no visits remain.
  const { count, error: remainingError } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('space_id', spaceId)
    .eq('place_id', placeId)

  if (remainingError) {
    throw remainingError
  }

  if (count === 0) {
    const { error: placeError } = await supabase
      .from('places')
      .update({ status: 'wishlist' })
      .eq('id', placeId)
      .eq('space_id', spaceId)

    if (placeError) {
      throw placeError
    }
  }
}

export async function getVisits(
  spaceId: string,
): Promise<VisitWithPlace[]> {
  // Load each visit and its restaurant.
  const { data, error } = await supabase
    .from('visits')
    .select(`
      id,
      space_id,
      place_id,
      visited_at,
      overall_rating,
      note,
      created_by,
      created_at,
      place:places (
        id,
        name,
        address
      )
    `)
    .eq('space_id', spaceId)
    .order('visited_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  // Supabase can represent the related place as an object or a one-item
  // array depending on the relationship metadata, so normalize it here.
  type VisitQueryRow = Omit<VisitWithPlace, 'place'> & {
    place: VisitPlace | VisitPlace[] | null
  }

  const rows = (data ?? []) as unknown as VisitQueryRow[]

  return rows.map((row) => ({
    ...row,
    place: Array.isArray(row.place)
      ? row.place[0] ?? null
      : row.place,
  }))
}
