// Purpose: Define the TypeScript shape of a dish.

export interface Dish {
  id: string
  space_id: string
  visit_id: string
  name: string
  rating: number | null
  comment: string | null
  created_by: string
  created_at: string
}