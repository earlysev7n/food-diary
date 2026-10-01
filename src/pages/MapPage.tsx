// Purpose: Load places for the active Space and pass them to the map.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlaces } from '../features/places/placeService'
import type { Place, PublicFoodSpot } from '../features/places/types'
import { useSpace } from '../features/spaces/useSpace'
import { MapView } from '../features/map/MapView'

export function MapPage() {
  const navigate = useNavigate()
  const { activeSpace } = useSpace()
  const activeSpaceId = activeSpace?.id
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPlaces() {
      if (!activeSpaceId) {
        setPlaces([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Load only places belonging to the selected Space.
        const savedPlaces = await getPlaces(activeSpaceId)

        if (mounted) {
          setPlaces(savedPlaces)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load map places.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadPlaces()

    return () => {
      mounted = false
    }
  }, [activeSpaceId])

  function handlePlaceAction(place: Place) {
    if (place.status === 'visited') {
      navigate('/diary')
      return
    }

    navigate('/add', {
      state: {
        wishlistPlace: place,
      },
    })
  }

  function handlePublicFoodSpotAction(spot: PublicFoodSpot) {
    navigate('/add', {
      state: {
        publicFoodSpot: spot,
      },
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <header className="shrink-0">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          Shared food diary
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#34251f]">
          Our food map
        </h1>

        <p className="mt-2 text-[#806f64]">
          Your saved food places will appear here.
        </p>
      </header>

      {error && (
        <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-[#806f64]">
          Loading your places…
        </p>
      )}

      <MapView
        places={places}
        onPlaceAction={handlePlaceAction}
        onPublicFoodSpotAction={handlePublicFoodSpotAction}
        className="min-h-0 flex-1"
      />

      <p className="shrink-0 text-center text-xs text-[#806f64] sm:text-sm">
        Gray markers are public food spots. Green markers are visited places.
        Orange markers are wishlist places.
      </p>
    </section>
  )
}
