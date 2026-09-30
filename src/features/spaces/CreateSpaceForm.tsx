import { type FormEvent, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { createSpace } from './spaceService'
import type { Space } from './types'

type CreateSpaceFormProps = {
  onCreated?: (space: Space) => void
}

export function CreateSpaceForm({ onCreated }: CreateSpaceFormProps) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!session?.user.id) {
      setError('You must be signed in to create a Space.')
      return
    }

    setSubmitting(true)

    try {
      const space = await createSpace(name, session.user.id)

      setName('')
      setMessage(`"${space.name}" was created.`)
      onCreated?.(space)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create the Space.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-[#59483f]">
        Space name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Space name"
          className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
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
        disabled={submitting}
        className="rounded-2xl bg-[#c75b32] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create Space'}
      </button>
    </form>
  )
}