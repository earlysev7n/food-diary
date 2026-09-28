import { type FormEvent, useState } from 'react'
import { useSpace } from './useSpace'
import { joinSpaceByInviteCode } from './spaceService'
import type { Space } from './types'

type JoinSpaceFormProps = {
  onJoined?: (space: Space) => void
}

export function JoinSpaceForm({ onJoined }: JoinSpaceFormProps) {
  const { setActiveSpace } = useSpace()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSubmitting(true)

    try {
      const space = await joinSpaceByInviteCode(code)

      setActiveSpace(space)
      setCode('')
      setMessage(`You joined "${space.name}".`)
      onJoined?.(space)
    } catch (caughtError) {
      if (
        typeof caughtError === 'object' &&
        caughtError !== null &&
        'message' in caughtError
      ) {
        setError(String(caughtError.message))
      } else {
        setError('Unable to join the Space.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-[#59483f]">
        Invite code
        <input
          required
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value.toLowerCase())}
          placeholder="e.g. a4f92c1b"
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
        className="rounded-2xl bg-[#34251f] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Joining…' : 'Join Space'}
      </button>
    </form>
  )
}