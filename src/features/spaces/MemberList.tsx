import { useEffect, useState } from 'react'
import { getSpaceMembers } from './spaceService'
import type { SpaceMemberProfile } from './types'

type MemberListProps = {
  spaceId: string | null
}

export function MemberList({ spaceId }: MemberListProps) {
  const [members, setMembers] = useState<SpaceMemberProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMembers() {
      if (!spaceId) {
        setMembers([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const spaceMembers = await getSpaceMembers(spaceId)

        if (active) {
          setMembers(spaceMembers)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load Space members.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadMembers()

    return () => {
      active = false
    }
  }, [spaceId])

  if (!spaceId) {
    return null
  }

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">Members</h2>

      {loading && (
        <p className="mt-4 text-sm text-[#806f64]">Loading members…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-[#ad3f2d]">{error}</p>
      )}

      {!loading && !error && (
        <ul className="mt-4 space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-2xl bg-[#fffaf5] px-4 py-3"
            >
              <span className="font-medium text-[#34251f]">
                {member.display_name ||
                  member.username ||
                  `User ${member.user_id.slice(0, 8)}`}
              </span>

              <span className="text-xs capitalize text-[#806f64]">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}