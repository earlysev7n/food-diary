// Purpose: Define the saved visit types used by the Diary.

export interface Visit {
  id: string
  space_id: string
  place_id: string
  visited_at: string
  overall_rating: number | null
  note: string | null
  created_by: string
  created_at: string
}

export interface VisitPlace {
  id: string
  name: string
  address: string | null
}

export interface VisitWithPlace extends Visit {
  place: VisitPlace | null
}
