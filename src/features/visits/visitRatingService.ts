// Purpose: Save and load member-owned ratings for individual visits.

import { supabase } from '../../lib/supabase'

export interface VisitRating {
  id: string
  visit_id: string
  space_id: string
  user_id: string
  rating: number
  created_at: string
  updated_at: string
}

export type SaveVisitRatingInput = {
  spaceId: string
  visitId: string
  userId: string
  rating: number | null
}

export function isVisitRatingsTableMissing(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const errorRecord = error as {
    code?: string
    message?: string
  }
  const message = errorRecord.message?.toLowerCase() ?? ''

  return (
    errorRecord.code === '42P01' ||
    errorRecord.code === 'PGRST205' ||
    message.includes('visit_ratings')
  )
}

function validateRating(rating: number) {
  if (
    !Number.isFinite(rating) ||
    rating < 0.5 ||
    rating > 5 ||
    !Number.isInteger(rating * 2)
  ) {
    throw new Error('Ratings must use half-star steps from 0.5 to 5.')
  }
}

export async function getVisitRatings(
  spaceId: string,
  visitIds: string[],
): Promise<VisitRating[]> {
  if (visitIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('visit_ratings')
    .select(
      'id, visit_id, space_id, user_id, rating, created_at, updated_at',
    )
    .eq('space_id', spaceId)
    .in('visit_id', visitIds)
    .order('created_at', { ascending: true })

  if (error && !isVisitRatingsTableMissing(error)) {
    throw error
  }

  return (data ?? []).map((row) => ({
    ...(row as Omit<VisitRating, 'rating'> & { rating: number | string }),
    rating: Number(row.rating),
  }))
}

export async function saveVisitRating(
  input: SaveVisitRatingInput,
): Promise<VisitRating | null> {
  if (input.rating === null) {
    const { error } = await supabase
      .from('visit_ratings')
      .delete()
      .eq('space_id', input.spaceId)
      .eq('visit_id', input.visitId)
      .eq('user_id', input.userId)

    if (error) {
      if (isVisitRatingsTableMissing(error)) {
        throw new Error(
          'Member ratings are not enabled yet. Run the visit ratings migration in Supabase first.',
        )
      }
      throw error
    }

    return null
  }

  validateRating(input.rating)

  const { data, error } = await supabase
    .from('visit_ratings')
    .upsert(
      {
        space_id: input.spaceId,
        visit_id: input.visitId,
        user_id: input.userId,
        rating: input.rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'visit_id,user_id' },
    )
    .select()
    .single()

  if (error) {
    if (isVisitRatingsTableMissing(error)) {
      throw new Error(
        'Member ratings are not enabled yet. Run the visit ratings migration in Supabase first.',
      )
    }
    throw error
  }

  return {
    ...(data as Omit<VisitRating, 'rating'> & { rating: number | string }),
    rating: Number(data.rating),
  }
}
