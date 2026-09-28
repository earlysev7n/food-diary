import { useEffect, useState } from 'react'
import { getMySpaces } from './spaceService'
import type { Space } from './types'

type SpaceListProps = {
  refreshKey: number
  activeSpaceId?: string
  onSelect: (space: Space) => void
}

export function SpaceList({
  refreshKey,
  activeSpaceId,
  onSelect,
}: SpaceListProps) {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSpaces() {
      setLoading(true)
      setError(null)

      try {
        const userSpaces = await getMySpaces()

        if (active) {
          setSpaces(userSpaces)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load your Spaces.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSpaces()

    return () => {
      active = false
    }
  }, [refreshKey])

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">
        Your Spaces
      </h2>

      {loading && (
        <p className="mt-4 text-sm text-[#806f64]">Loading Spaces…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-[#ad3f2d]">{error}</p>
      )}

      {!loading && !error && spaces.length === 0 && (
        <p className="mt-4 text-sm text-[#806f64]">
          You haven’t joined any Spaces yet.
        </p>
      )}

      {!loading && !error && spaces.length > 0 && (
        <ul className="mt-4 space-y-3">
          {spaces.map((space) => {
            const isActive = space.id === activeSpaceId

            return (
              <li key={space.id}>
                <button
                  type="button"
                  onClick={() => onSelect(space)}
                  aria-pressed={isActive}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? 'bg-[#fbe4d7] ring-2 ring-[#c75b32]'
                      : 'bg-[#fffaf5] hover:bg-[#f8eee7]'
                  }`}
                >
                  <p className="font-semibold text-[#34251f]">
                    {space.name}
                  </p>
                  <p className="mt-1 text-xs text-[#806f64]">
                    {isActive ? 'Active Space' : 'Tap to select'}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}