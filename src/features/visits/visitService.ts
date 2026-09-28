// Purpose: Load visits together with their place and dishes.

import { supabase } from '../../lib/supabase'
import type { Dish } from '../dishes/types'
import type { Visit, VisitPlace, VisitWithPlace } from './types'

export type CreateVisitInput = {
  spaceId: string
  placeId: string
  visitedAt: string
  overallRating: number | null
  note: string | null
  createdBy: string
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

export async function getVisits(
  spaceId: string,
): Promise<VisitWithPlace[]> {
  // Load each visit, its restaurant, and its dishes.
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
      ),
      dishes (
        id,
        space_id,
        visit_id,
        name,
        rating,
        comment,
        created_by,
        created_at
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
    dishes: Dish[]
  }

  const rows = (data ?? []) as unknown as VisitQueryRow[]

  return rows.map((row) => ({
    ...row,
    place: Array.isArray(row.place)
      ? row.place[0] ?? null
      : row.place,
  }))
}
