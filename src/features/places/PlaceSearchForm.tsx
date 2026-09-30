// Purpose: Let the user search nearby places, select a result, and save it.

import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { uploadVisitPhoto } from '../photos/photoService'
import { useSpace } from '../spaces/useSpace'
import { createVisit } from '../visits/visitService'
import { VisitDraftFields } from '../visits/VisitDraftFields'
import { createPlace, findDuplicatePlace } from './placeService'
import {
  reverseGeocode,
  searchPlaces,
  type NominatimResult,
  type SearchLocation,
} from './placeSearch'
import type { Place, PlaceStatus } from './types'
import { useUserLocation } from './useUserLocation'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

type PlaceSearchFormProps = {
  initialPlace?: Place | null
  onSaved?: (place: Place) => void
}

export function PlaceSearchForm({
  initialPlace = null,
  onSaved,
}: PlaceSearchFormProps) {
  const { session } = useAuth()
  const { activeSpace } = useSpace()
  const {
    location: coordinates,
    loading: locating,
    error: locationError,
    locate,
  } = useUserLocation()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [selected, setSelected] = useState<NominatimResult | null>(null)
  const [status, setStatus] = useState<PlaceStatus>(
    initialPlace ? 'visited' : 'wishlist',
  )
  const [visitedAt, setVisitedAt] = useState(getTodayDate())
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [location, setLocation] = useState<SearchLocation | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const isConvertingWishlist = initialPlace !== null

  function resetVisitDetails() {
    setVisitedAt(getTodayDate())
    setOverallRating(null)
    setNote('')
    setPhotoFiles([])
  }

  useEffect(() => {
    if (initialPlace || !coordinates) {
      return
    }

    // Keep a non-null snapshot for the asynchronous reverse lookup.
    const currentCoordinates = coordinates
    let mounted = true

    async function identifyLocation() {
      try {
        // Reverse lookup gives search a city and country context.
        const locationContext = await reverseGeocode(currentCoordinates)

        if (mounted) {
          setLocation(locationContext)
          setMessage(
            locationContext.city
              ? `Nearby search focused on ${locationContext.city}.`
              : 'Nearby search is ready.',
          )
        }
      } catch {
        // Coordinates still work even when city lookup fails.
        if (mounted) {
          setLocation({
            ...currentCoordinates,
            city: null,
            countryCode: null,
            displayName: null,
          })
          setMessage('Nearby search is ready.')
        }
      }
    }

    void identifyLocation()

    return () => {
      mounted = false
    }
  }, [coordinates, initialPlace])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSelected(null)
    setSearching(true)

    try {
      // The optional location biases results toward the user's area.
      const matches = await searchPlaces(query, location ?? undefined)
      setResults(matches)

      if (matches.length === 0) {
        setMessage('No places found. Try the exact name and city.')
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to search for places.',
      )
    } finally {
      setSearching(false)
    }
  }

  async function handleSave() {
    setError(null)
    setMessage(null)

    if (!activeSpace) {
      setError('Select a Space before saving a place.')
      return
    }

    if (!session?.user.id) {
      setError('You must be signed in to save a place.')
      return
    }

    setSaving(true)

    try {
      let savedPlace: Place
      let existingPlace: Place | null = null

      if (initialPlace) {
        savedPlace = initialPlace
      } else {
        if (!selected) {
          setError('Select a search result first.')
          return
        }

        const latitude = Number(selected.lat)
        const longitude = Number(selected.lon)

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setError('The selected place has invalid coordinates.')
          return
        }

        // Prefer the named place, then fall back to the first address segment.
        const placeName =
          selected.namedetails?.name ??
          selected.display_name.split(',')[0]

        const externalPlaceId = String(selected.place_id)
        existingPlace = await findDuplicatePlace(activeSpace.id, {
          name: placeName,
          address: selected.display_name,
          latitude,
          longitude,
          externalPlaceId,
        })

        if (existingPlace && status === 'wishlist') {
          setError(
            'This place is already saved. Choose Visited to add another visit.',
          )
          return
        }

        savedPlace =
          existingPlace ??
          (await createPlace({
            spaceId: activeSpace.id,
            name: placeName,
            address: selected.display_name,
            latitude,
            longitude,
            externalPlaceId,
            status,
            createdBy: session.user.id,
          }))
      }

      if (isConvertingWishlist || status === 'visited') {
        const savedVisit = await createVisit({
          spaceId: activeSpace.id,
          placeId: savedPlace.id,
          visitedAt,
          overallRating,
          note: note.trim() || null,
          createdBy: session.user.id,
        })

        await Promise.all(
          photoFiles.map((file) =>
            uploadVisitPhoto({
              file,
              spaceId: activeSpace.id,
              visitId: savedVisit.id,
              uploadedBy: session.user.id,
            }),
          ),
        )
      }

      setQuery('')
      setResults([])
      setSelected(null)
      setStatus('wishlist')
      resetVisitDetails()
      setMessage(
        isConvertingWishlist || status === 'visited'
          ? existingPlace
            ? `Another visit to "${savedPlace.name}" was added to your Diary.`
            : `"${savedPlace.name}" was added to your Diary.`
          : `"${savedPlace.name}" was saved to your wishlist.`,
      )
      onSaved?.(savedPlace)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save this place.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">
        {isConvertingWishlist ? 'Add visit details' : 'Find a food place'}
      </h2>

      {isConvertingWishlist ? (
        <div className="mt-4 rounded-2xl bg-[#f8eee7] p-4">
          <p className="text-sm font-semibold text-[#34251f]">
            Logging a visit to
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#34251f]">
            {initialPlace.name}
          </h3>
          <p className="mt-1 text-sm text-[#806f64]">
            {initialPlace.address ?? 'Address unavailable'}
          </p>
        </div>
      ) : (
        <>
          <form className="mt-4 flex gap-2" onSubmit={handleSearch}>
            <input
              required
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurant or food spot"
              className="min-w-0 flex-1 rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
            />

            <button
              type="submit"
              disabled={searching}
              className="rounded-2xl bg-[#c75b32] px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void locate()}
            disabled={locating}
            className="mt-3 rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#59483f] disabled:opacity-60"
          >
            {locating ? 'Finding you…' : 'Refresh my location'}
          </button>

          {location && (
            <p className="mt-2 text-xs text-[#806f64]">
              {location.city
                ? `Searching near ${location.city}`
                : 'Searching near your current location'}
            </p>
          )}

          {locationError && (
            <p className="mt-2 text-xs text-[#ad3f2d]">
              {locationError} Search will still work if you enter a city.
            </p>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">
          {message}
        </p>
      )}

      {!isConvertingWishlist && results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((result) => {
            const isSelected = selected?.place_id === result.place_id

            return (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => setSelected(result)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm ${
                    isSelected
                      ? 'bg-[#fbe4d7] ring-2 ring-[#c75b32]'
                      : 'bg-[#fffaf5] hover:bg-[#f8eee7]'
                  }`}
                >
                  <span className="font-semibold text-[#34251f]">
                    {result.namedetails?.name ??
                      result.display_name.split(',')[0]}
                  </span>

                  <span className="mt-1 block text-[#806f64]">
                    {result.display_name}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {(selected || initialPlace) && (
        <div className="mt-5 rounded-2xl bg-[#f8eee7] p-4">
          {!isConvertingWishlist && (
            <>
              <p className="text-sm font-semibold text-[#34251f]">
                Save this place as:
              </p>

              <select
                value={status}
                onChange={(event) => {
                  const nextStatus = event.target.value as PlaceStatus
                  setStatus(nextStatus)

                  if (nextStatus === 'wishlist') {
                    resetVisitDetails()
                  }
                }}
                className="mt-3 w-full rounded-2xl border border-[#ddc9bb] bg-white px-4 py-3"
              >
                <option value="wishlist">Want to try</option>
                <option value="visited">Visited</option>
              </select>
            </>
          )}

          {(isConvertingWishlist || status === 'visited') && (
            <VisitDraftFields
              visitedAt={visitedAt}
              onVisitedAtChange={setVisitedAt}
              rating={overallRating}
              onRatingChange={setOverallRating}
              note={note}
              onNoteChange={setNote}
              photos={photoFiles}
              onPhotosChange={setPhotoFiles}
            />
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="mt-3 w-full rounded-2xl bg-[#34251f] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? 'Saving…'
              : isConvertingWishlist || status === 'visited'
                ? 'Save to Diary'
                : 'Save place'}
          </button>
        </div>
      )}
    </section>
  )
}
