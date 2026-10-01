// Purpose: Define the TypeScript shape of a saved food place.

export type PlaceStatus = 'wishlist' | 'visited'

export type PublicFoodSpot = {
  id: string
  osmType: 'node' | 'way' | 'relation'
  osmId: number
  name: string
  category: string
  address: string | null
  latitude: number
  longitude: number
}

export interface Place {
  id: string
  space_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  external_place_id: string | null
  status: PlaceStatus
  created_by: string
  created_at: string
}
