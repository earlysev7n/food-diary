// Purpose: Display wishlist places and let members visit or remove them.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpace } from '../spaces/useSpace'
import { deletePlace, getPlaces } from './placeService'
import type { Place } from './types'

type PlaceListProps = {
  title: string
}

export function PlaceList({
  title,
}: PlaceListProps) {
  const { activeSpace } = useSpace()
  const activeSpaceId = activeSpace?.id
  const navigate = useNavigate()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null)

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
        const savedPlaces = await getPlaces(activeSpaceId)

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
  }, [activeSpaceId, reloadKey])

  async function handleDeletePlace(place: Place) {
    if (!activeSpace) return

    const confirmed = window.confirm(
      `Remove "${place.name}" from your wishlist?`,
    )

    if (!confirmed) return

    setBusyPlaceId(place.id)
    setError(null)

    try {
      await deletePlace(activeSpace.id, place.id)
      setReloadKey((currentKey) => currentKey + 1)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to remove this place.',
      )
    } finally {
      setBusyPlaceId(null)
    }
  }

  const visiblePlaces = places.filter((place) => place.status === 'wishlist')

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
              className="relative rounded-2xl bg-[#fffaf5] p-4"
            >
              <button
                type="button"
                onClick={() => void handleDeletePlace(place)}
                disabled={busyPlaceId === place.id}
                aria-label={`Remove ${place.name} from wishlist`}
                title="Remove from wishlist"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-[#c9573a] hover:bg-[#fff0ed] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyPlaceId === place.id ? '…' : '×'}
              </button>

              <div className="pr-10">
                <h3 className="font-semibold text-[#34251f]">
                  {place.name}
                </h3>

                <p className="mt-1 text-sm text-[#806f64]">
                  {place.address ?? 'Address unavailable'}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/add', {
                    state: { wishlistPlace: place },
                  })
                }
                className="mt-4 rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a352c]"
              >
                Visited
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
