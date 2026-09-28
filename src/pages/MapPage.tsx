// Purpose: Load places for the active Space and pass them to the map.

import { useEffect, useState } from 'react'
import { getPlaces } from '../features/places/placeService'
import type { Place } from '../features/places/types'
import { useSpace } from '../features/spaces/useSpace'
import { MapView } from '../features/map/MapView'

export function MapPage() {
  const { activeSpace } = useSpace()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPlaces() {
      if (!activeSpace) {
        setPlaces([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Load only places belonging to the selected Space.
        const savedPlaces = await getPlaces(activeSpace.id)

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
  }, [activeSpace?.id])

  return (
    <section className="space-y-6">
      <header>
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

      <MapView places={places} />

      <p className="text-center text-sm text-[#806f64]">
        Green markers are visited, orange markers are wishlist places,
        and red markers are favorites.
      </p>
    </section>
  )
}