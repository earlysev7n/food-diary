import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { CreateSpaceForm } from '../features/spaces/CreateSpaceForm'
import { JoinSpaceForm } from '../features/spaces/JoinSpaceForm'
import { MemberList } from '../features/spaces/MemberList'
import { SpaceList } from '../features/spaces/SpaceList'
import { useSpace } from '../features/spaces/useSpace'
import type { Space } from '../features/spaces/types'

export function ProfilePage() {
  const { signOut } = useAuth()
  const { activeSpace, setActiveSpace } = useSpace()
  const [error, setError] = useState<string | null>(null)
  const [spaceRefreshKey, setSpaceRefreshKey] = useState(0)

  async function handleSignOut() {
    const { error: signOutError } = await signOut()
    setError(signOutError?.message ?? null)
  }

  function handleSpaceReady(space: Space) {
    setActiveSpace(space)
    setSpaceRefreshKey((currentKey) => currentKey + 1)
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          Your space
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Profile
        </h1>
      </header>

      <div className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#34251f]">
          Create a shared Space
        </h2>

        <div className="mt-5">
          <CreateSpaceForm onCreated={handleSpaceReady} />
        </div>
      </div>

      <div className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#34251f]">
          Join a Space
        </h2>

        <div className="mt-5">
          <JoinSpaceForm onJoined={handleSpaceReady} />
        </div>
      </div>

      <SpaceList
        refreshKey={spaceRefreshKey}
        activeSpaceId={activeSpace?.id}
        onSelect={setActiveSpace}
      />

      {activeSpace && (
        <section className="rounded-3xl border border-[#eadfd6] bg-[#fbe4d7] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
            Active Space
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#34251f]">
            {activeSpace.name}
          </h2>
          <p className="mt-4 text-sm text-[#806f64]">
            Share this invite code:
          </p>
          <code className="mt-2 inline-block rounded-xl bg-white px-4 py-2 font-semibold tracking-widest text-[#34251f]">
            {activeSpace.invite_code}
          </code>

          <Link
            to="/stats"
            className="mt-5 inline-flex rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white"
          >
            View shared stats
          </Link>
        </section>
      )}

      <MemberList spaceId={activeSpace?.id ?? null} />

      <div className="rounded-3xl border border-dashed border-[#ddc9bb] bg-white/60 p-6 text-center">
        {error && (
          <p className="mb-4 text-sm text-[#ad3f2d]">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-2xl bg-[#34251f] px-5 py-3 text-sm font-semibold text-white"
        >
          Log out
        </button>
      </div>
    </section>
  )
}
