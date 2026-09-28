// Purpose: Define the small set of shared statistics shown on the Stats page.

export interface RecentVisitStat {
  id: string
  placeName: string
  visitedAt: string
  rating: number | null
}

export interface TopDishStat {
  name: string
  rating: number
}

export interface SpaceStats {
  totalPlaces: number
  visitedPlaces: number
  wishlistPlaces: number
  favoritePlaces: number
  totalVisits: number
  totalDishes: number
  totalPhotos: number
  averageVisitRating: number | null
  mostVisitedPlace: string | null
  topDish: TopDishStat | null
  recentVisits: RecentVisitStat[]
}
