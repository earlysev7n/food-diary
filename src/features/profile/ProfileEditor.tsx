// Purpose: Show the signed-in user's profile and reveal editing controls on demand.

import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  getOwnProfile,
  saveOwnProfile,
  type UserProfile,
} from './profileService'

function getMetadataDisplayName(metadata: Record<string, unknown>) {
  return typeof metadata.display_name === 'string'
    ? metadata.display_name
    : ''
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileEditor({
  onSaved,
}: {
  onSaved?: () => void
}) {
  const { session } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const userId = session?.user.id
  const email = session?.user.email ?? ''
  const metadataName = session
    ? getMetadataDisplayName(session.user.user_metadata ?? {})
    : ''
  const visibleName = displayName || metadataName

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setDisplayName('')
      setLoading(false)
      return
    }

    const profileUserId = userId
    let mounted = true

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const savedProfile = await getOwnProfile(profileUserId)

        if (mounted) {
          setProfile(savedProfile)
          setDisplayName(
            savedProfile?.display_name ?? metadataName,
          )
          setAvatarPreviewUrl(savedProfile?.avatar_url ?? null)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load your profile.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [metadataName, userId])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(profile?.avatar_url ?? null)
      return
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreviewUrl(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile, profile?.avatar_url])

  function handleAvatarChange(file: File | null) {
    setAvatarFile(file)
    setError(null)
  }

  function handleCancel() {
    setDisplayName(profile?.display_name ?? metadataName)
    setAvatarFile(null)
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    if (!userId) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const savedProfile = await saveOwnProfile({
        userId,
        displayName,
        currentAvatarUrl: profile?.avatar_url,
        avatarFile,
      })

      setProfile(savedProfile)
      setDisplayName(savedProfile.display_name ?? '')
      setAvatarFile(null)
      setEditing(false)
      setMessage('Profile saved.')
      onSaved?.()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save your profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#806f64]">Loading your profile…</p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {avatarPreviewUrl ? (
          <img
            src={avatarPreviewUrl}
            alt={`${visibleName || 'Your'} profile`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fbe4d7] text-xl font-semibold text-[#c75b32]">
            {getInitials(visibleName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
            Your profile
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-[#34251f]">
            {visibleName || 'Finish your profile'}
          </h2>
          <p className="mt-1 truncate text-sm text-[#806f64]">{email}</p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setMessage(null)
            }}
            className="rounded-xl border border-[#ddc9bb] px-3 py-2 text-sm font-semibold text-[#59483f] hover:bg-[#fffaf5]"
          >
            Edit
          </button>
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-5 space-y-4 border-t border-[#eadfd6] pt-5">
          <label className="block text-sm font-medium text-[#59483f]">
            Display name
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
            />
          </label>

          <label className="block text-sm font-medium text-[#59483f]">
            Profile photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleAvatarChange(event.target.files?.[0] ?? null)
              }
              className="mt-2 block w-full rounded-2xl border border-dashed border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 text-sm text-[#806f64]"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-[#ddc9bb] px-4 py-2 text-sm font-semibold text-[#59483f] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
