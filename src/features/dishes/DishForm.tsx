// Purpose: Let a user add a dish to a specific visit.

import { type FormEvent, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { createDish } from './dishService'

type DishFormProps = {
  spaceId: string
  visitId: string
  onSaved?: () => void
}

export function DishForm({
  spaceId,
  visitId,
  onSaved,
}: DishFormProps) {
  const { session } = useAuth()

  const [name, setName] = useState('')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError(null)

    if (!session?.user.id) {
      setError('You must be signed in.')
      return
    }

    if (!name.trim()) {
      setError('Enter a dish name.')
      return
    }

    setSaving(true)

    try {
      // Convert the optional rating into a number or null.
      const dishRating = rating ? Number(rating) : null

      await createDish({
        spaceId,
        visitId,
        name,
        rating: dishRating,
        comment: comment.trim() || null,
        createdBy: session.user.id,
      })

      setName('')
      setRating('')
      setComment('')
      onSaved?.()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save this dish.',
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
        Add a dish
      </p>

      <input
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Dish name"
        className="mt-3 w-full rounded-xl border border-[#ddc9bb] bg-[#fffaf5] px-3 py-2"
      />

      <select
        value={rating}
        onChange={(event) => setRating(event.target.value)}
        className="mt-2 w-full rounded-xl border border-[#ddc9bb] bg-[#fffaf5] px-3 py-2"
      >
        <option value="">No rating</option>
        <option value="1">1 / 5</option>
        <option value="2">2 / 5</option>
        <option value="3">3 / 5</option>
        <option value="4">4 / 5</option>
        <option value="5">5 / 5</option>
      </select>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Dish comment"
        rows={2}
        className="mt-2 w-full resize-none rounded-xl border border-[#ddc9bb] bg-[#fffaf5] px-3 py-2"
      />

      {error && (
        <p className="mt-2 text-sm text-[#ad3f2d]">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-3 rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Add dish'}
      </button>
    </form>
  )
}