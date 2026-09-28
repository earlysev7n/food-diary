// Purpose: Save dishes through Supabase.

import { supabase } from '../../lib/supabase'
import type { Dish } from './types'

export type CreateDishInput = {
  spaceId: string
  visitId: string
  name: string
  rating: number | null
  comment: string | null
  createdBy: string
}

export async function createDish(
  input: CreateDishInput,
): Promise<Dish> {
  // Insert a dish into the selected visit.
  const { data, error } = await supabase
    .from('dishes')
    .insert({
      space_id: input.spaceId,
      visit_id: input.visitId,
      name: input.name.trim(),
      rating: input.rating,
      comment: input.comment,
      created_by: input.createdBy,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Dish
}