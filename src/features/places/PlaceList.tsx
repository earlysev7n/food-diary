// Purpose: Display saved places and let members update status or favorites.

import { useEffect, useState } from 'react'
import { useSpace } from '../spaces/useSpace'
import {
  getPlaces,
  togglePlaceFavorite,
  updatePlaceStatus,
} from './placeService'
import type { Place, PlaceStatus } from './types'

type PlaceListProps = {
  title: string
  statusFilter?: PlaceStatus
  refreshKey?: number
}

export function PlaceList({
  title,
  statusFilter,
  refreshKey = 0,
}: PlaceListProps) {
  const { activeSpace } = useSpace()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null)

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
        const savedPlaces = await getPlaces(activeSpace.id)

        if (mounted) {
          setPlaces(savedPlaces)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load places.',
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
  }, [activeSpace?.id, refreshKey, reloadKey])

  async function handleStatusChange(
    placeId: string,
    nextStatus: PlaceStatus,
  ) {
    setBusyPlaceId(placeId)
    setError(null)

    try {
      await updatePlaceStatus(placeId, nextStatus)
      setReloadKey((currentKey) => currentKey + 1)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update the place.',
      )
    } finally {
      setBusyPlaceId(null)
    }
  }

  async function handleFavoriteToggle(place: Place) {
    setBusyPlaceId(place.id)
    setError(null)

    try {
      await togglePlaceFavorite(place.id, !place.is_favorite)
      setReloadKey((currentKey) => currentKey + 1)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update the favorite.',
      )
    } finally {
      setBusyPlaceId(null)
    }
  }

  const visiblePlaces = statusFilter
    ? places.filter((place) => place.status === statusFilter)
    : places

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">{title}</h2>

      {loading && (
        <p className="mt-4 text-sm text-[#806f64]">Loading places…</p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {!loading && !error && !activeSpace && (
        <p className="mt-4 text-sm text-[#806f64]">
          Select or join a Space from your Profile first.
        </p>
      )}

      {!loading &&
        !error &&
        activeSpace &&
        visiblePlaces.length === 0 && (
          <p className="mt-4 text-sm text-[#806f64]">
            No saved places yet.
          </p>
        )}

      {!loading && visiblePlaces.length > 0 && (
        <div className="mt-4 space-y-3">
          {visiblePlaces.map((place) => (
            <article
              key={place.id}
              className="rounded-2xl bg-[#fffaf5] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#34251f]">
                    {place.name}
                  </h3>

                  <p className="mt-1 text-sm text-[#806f64]">
                    {place.address ?? 'Address unavailable'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleFavoriteToggle(place)}
                  disabled={busyPlaceId === place.id}
                  aria-label={
                    place.is_favorite
                      ? `Remove ${place.name} from favorites`
                      : `Add ${place.name} to favorites`
                  }
                  className="text-2xl disabled:opacity-50"
                >
                  {place.is_favorite ? '★' : '☆'}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <select
                  value={place.status}
                  disabled={busyPlaceId === place.id}
                  onChange={(event) =>
                    void handleStatusChange(
                      place.id,
                      event.target.value as PlaceStatus,
                    )
                  }
                  className="rounded-xl border border-[#ddc9bb] bg-white px-3 py-2 text-sm"
                >
                  <option value="wishlist">Want to try</option>
                  <option value="visited">Visited</option>
                </select>

                <span className="text-xs text-[#806f64]">
                  {place.is_favorite ? 'Favorite' : 'Not a favorite'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}