// Purpose: Edit an existing visit from the Diary timeline.

import { type FormEvent, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { StarRating } from './StarRating'
import { updateVisit } from './visitService'
import type { VisitWithPlace } from './types'

type EditVisitFormProps = {
  spaceId: string
  visit: VisitWithPlace
  onSaved?: () => void
  onCancel?: () => void
}

export function EditVisitForm({
  spaceId,
  visit,
  onSaved,
  onCancel,
}: EditVisitFormProps) {
  const [visitedAt, setVisitedAt] = useState(visit.visited_at)
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const existingRating = userId
    ? visit.ratings.find((rating) => rating.user_id === userId)?.rating ??
      (visit.ratings.length === 0 && visit.created_by === userId
        ? visit.overall_rating
        : null)
    : null
  const [rating, setRating] = useState<number | null>(existingRating)
  const [note, setNote] = useState(visit.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!userId) {
        throw new Error('You must be signed in to save a rating.')
      }

      await updateVisit({
        spaceId,
        visitId: visit.id,
        visitedAt,
        userId,
        rating,
        note: note.trim() || null,
      })
      onSaved?.()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update this visit.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="mt-4 rounded-2xl border border-[#eadfd6] bg-white p-4"
      onSubmit={handleSubmit}
    >
      <p className="text-sm font-semibold text-[#34251f]">
        Edit visit
      </p>
      <p className="mt-1 text-xs text-[#806f64]">
        You can edit your rating. Other members can see it but cannot change
        it.
      </p>

      <label className="mt-3 block text-sm font-medium text-[#59483f]">
        Date visited
        <input
          required
          type="date"
          value={visitedAt}
          onChange={(event) => setVisitedAt(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#ddc9bb] bg-[#fffaf5] px-3 py-2"
        />
      </label>

      <div className="mt-3">
        <p className="text-sm font-medium text-[#59483f]">Your rating</p>
        <div className="mt-1">
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <label className="mt-3 block text-sm font-medium text-[#59483f]">
        Memory or note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-[#ddc9bb] bg-[#fffaf5] px-3 py-2"
        />
      </label>

      {error && <p className="mt-2 text-sm text-[#ad3f2d]">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-[#ddc9bb] px-4 py-2 text-sm font-semibold text-[#59483f] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
