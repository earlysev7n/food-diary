// Purpose: Let a user log a restaurant visit.

import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { getPlaces } from '../places/placeService'
import type { Place } from '../places/types'
import { useSpace } from '../spaces/useSpace'
import { createVisit } from './visitService'

type VisitFormProps = {
  onSaved?: () => void
}

function getTodayDate() {
  // Purpose: Create a value accepted by an HTML date input.
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function VisitForm({ onSaved }: VisitFormProps) {
  const { session } = useAuth()
  const { activeSpace } = useSpace()

  const [places, setPlaces] = useState<Place[]>([])
  const [placeId, setPlaceId] = useState('')
  const [visitedAt, setVisitedAt] = useState(getTodayDate())
  const [rating, setRating] = useState('')
  const [note, setNote] = useState('')
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPlaces() {
      if (!activeSpace) {
        setPlaces([])
        setLoadingPlaces(false)
        return
      }

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
          setLoadingPlaces(false)
        }
      }
    }

    void loadPlaces()

    return () => {
      mounted = false
    }
  }, [activeSpace?.id])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!activeSpace) {
      setError('Select a Space first.')
      return
    }

    if (!session?.user.id) {
      setError('You must be signed in.')
      return
    }

    if (!placeId) {
      setError('Choose a place for this visit.')
      return
    }

    setSaving(true)

    try {
      // Convert the optional rating into a number or null.
      const overallRating = rating ? Number(rating) : null

      await createVisit({
        spaceId: activeSpace.id,
        placeId,
        visitedAt,
        overallRating,
        note: note.trim() || null,
        createdBy: session.user.id,
      })

      setPlaceId('')
      setVisitedAt(getTodayDate())
      setRating('')
      setNote('')
      setMessage('Visit saved to your diary.')
      onSaved?.()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save this visit.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">
        Log a visit
      </h2>

      {!activeSpace && (
        <p className="mt-4 text-sm text-[#806f64]">
          Select or join a Space from Profile first.
        </p>
      )}

      {activeSpace && places.length === 0 && !loadingPlaces && (
        <p className="mt-4 text-sm text-[#806f64]">
          Add a food place before logging a visit.
        </p>
      )}

      {activeSpace && places.length > 0 && (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#59483f]">
            Place
            <select
              required
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3"
            >
              <option value="">Choose a place</option>

              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-[#59483f]">
            Visit date
            <input
              required
              type="date"
              value={visitedAt}
              onChange={(event) => setVisitedAt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3"
            />
          </label>

          <label className="block text-sm font-medium text-[#59483f]">
            Rating
            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3"
            >
              <option value="">No rating</option>
              <option value="1">1 / 5</option>
              <option value="2">2 / 5</option>
              <option value="3">3 / 5</option>
              <option value="4">4 / 5</option>
              <option value="5">5 / 5</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-[#59483f]">
            Memory or note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What do you remember about this visit?"
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#c75b32] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save visit'}
          </button>
        </form>
      )}

      {loadingPlaces && (
        <p className="mt-4 text-sm text-[#806f64]">
          Loading places…
        </p>
      )}
    </section>
  )
}