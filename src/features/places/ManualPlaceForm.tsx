// Purpose: Save a place when the restaurant itself is not listed by Nominatim.

import { type FormEvent, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { uploadVisitPhoto } from '../photos/photoService'
import { useSpace } from '../spaces/useSpace'
import { createVisit } from '../visits/visitService'
import { VisitDraftFields } from '../visits/VisitDraftFields'
import { ManualLocationPicker } from './ManualLocationPicker'
import { createPlace, findDuplicatePlace } from './placeService'
import {
  getPlaceResultName,
  searchPlaces,
  type NominatimResult,
  type SearchLocation,
} from './placeSearch'
import type { PlaceStatus } from './types'

type ManualPlaceFormProps = {
  initialName: string
  location: SearchLocation
  onCancel: () => void
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function ManualPlaceForm({
  initialName,
  location,
  onCancel,
}: ManualPlaceFormProps) {
  const { session } = useAuth()
  const { activeSpace } = useSpace()
  const [name, setName] = useState(initialName)
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<PlaceStatus>('wishlist')
  const [visitedAt, setVisitedAt] = useState(getTodayDate())
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([])
  const [selectedAddress, setSelectedAddress] =
    useState<NominatimResult | null>(null)
  const [manualCoordinates, setManualCoordinates] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFindAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSelectedAddress(null)
    setManualCoordinates(null)

    if (address.trim().length < 3) {
      setError('Enter a more specific address or area.')
      return
    }

    setSearchingAddress(true)

    try {
      const results = await searchPlaces(address, location)
      setAddressResults(results)

      if (results.length === 0) {
        setMessage(
          'No map location found. Add a nearby landmark or a more specific Iloilo address.',
        )
      } else {
        const bestResult = results[0]
        setSelectedAddress(bestResult)
        setManualCoordinates({
          latitude: Number(bestResult.lat),
          longitude: Number(bestResult.lon),
        })
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to find that address.',
      )
    } finally {
      setSearchingAddress(false)
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

    if (!name.trim()) {
      setError('Enter the place name.')
      return
    }

    if (!manualCoordinates) {
      setError('Find an address or tap the map to place the pin.')
      return
    }

    const latitude = manualCoordinates.latitude
    const longitude = manualCoordinates.longitude

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('The selected address has invalid coordinates.')
      return
    }

    setSaving(true)

    try {
      const existingPlace = await findDuplicatePlace(activeSpace.id, {
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        externalPlaceId: null,
      })

      if (existingPlace && status === 'wishlist') {
        setError(
          'This place is already saved. Choose Visited to add another visit.',
        )
        return
      }

      const savedPlace =
        existingPlace ??
        (await createPlace({
          spaceId: activeSpace.id,
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          externalPlaceId: null,
          status,
          createdBy: session.user.id,
        }))

      if (status === 'visited') {
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

      setMessage(
        existingPlace
          ? `Another visit to "${savedPlace.name}" was added to your Diary.`
          : status === 'visited'
            ? `"${savedPlace.name}" was added to your Diary.`
            : `"${savedPlace.name}" was saved to your wishlist.`,
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save this manual place.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-4 rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#c75b32]">
            Manual place
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#34251f]">
            Add a place we can’t find
          </h2>
          <p className="mt-1 text-sm text-[#806f64]">
            The restaurant name can be missing from OpenStreetMap. We only need
            a nearby map location to place it on your private map.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl border border-[#ddc9bb] px-3 py-2 text-xs font-semibold text-[#59483f]"
        >
          Back
        </button>
      </div>

      <label className="mt-5 block text-sm font-medium text-[#59483f]">
        Place name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
          placeholder="Sisigan sa Doctor's"
        />
      </label>

      <form className="mt-4" onSubmit={handleFindAddress}>
        <label className="block text-sm font-medium text-[#59483f]">
          Address or nearby landmark
          <input
            required
            value={address}
            onChange={(event) => {
              setAddress(event.target.value)
              setAddressResults([])
              setSelectedAddress(null)
            }}
            className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
            placeholder="Doctor's Hospital, Molo, Iloilo City"
          />
        </label>

        <button
          type="submit"
          disabled={searchingAddress}
          className="mt-3 rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#59483f] disabled:opacity-60"
        >
          {searchingAddress ? 'Finding map location…' : 'Find map location'}
        </button>
      </form>

      {addressResults.length > 0 && (
        <ul className="mt-4 space-y-2">
          {addressResults.map((result) => {
            const isSelected = selectedAddress?.place_id === result.place_id

            return (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddress(result)
                    setManualCoordinates({
                      latitude: Number(result.lat),
                      longitude: Number(result.lon),
                    })
                  }}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm ${
                    isSelected
                      ? 'bg-[#fbe4d7] ring-2 ring-[#c75b32]'
                      : 'bg-[#fffaf5] hover:bg-[#f8eee7]'
                  }`}
                >
                  <span className="font-semibold text-[#34251f]">
                    {getPlaceResultName(result)}
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

      {selectedAddress && (
        <p className="mt-3 rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">
          Map location selected. The saved place name will remain “{name}”.
        </p>
      )}

      <ManualLocationPicker
        center={[location.longitude, location.latitude]}
        value={manualCoordinates}
        onChange={(coordinates) => {
          setSelectedAddress(null)
          setManualCoordinates(coordinates)
        }}
      />

      <label className="mt-4 block text-sm font-medium text-[#59483f]">
        Save this place as
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as PlaceStatus)}
          className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-white px-4 py-3"
        >
          <option value="wishlist">Want to try</option>
          <option value="visited">Visited</option>
        </select>
      </label>

      {status === 'visited' && (
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

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-4 w-full rounded-2xl bg-[#34251f] px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving
          ? 'Saving…'
          : status === 'visited'
            ? 'Save to Diary'
            : 'Save place'}
      </button>
    </section>
  )
}
