// Purpose: Let a user upload one photo to a visit.

import { useId, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { uploadVisitPhoto } from './photoService'

type PhotoUploadProps = {
  spaceId: string
  visitId: string
  onUploaded?: () => void
}

export function PhotoUpload({
  spaceId,
  visitId,
  onUploaded,
}: PhotoUploadProps) {
  const { session } = useAuth()
  const fileInputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpload() {
    setError(null)
    setMessage(null)

    if (!session?.user.id) {
      setError('You must be signed in.')
      return
    }

    if (!file) {
      setError('Choose a photo first.')
      return
    }

    setUploading(true)

    try {
      // Upload the selected image to the private visit folder.
      await uploadVisitPhoto({
        file,
        spaceId,
        visitId,
        uploadedBy: session.user.id,
      })

      setFile(null)
      setMessage('Photo uploaded.')
      onUploaded?.()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to upload photo.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#eadfd6] bg-white p-4">
      <p className="text-sm font-semibold text-[#34251f]">
        Add a photo
      </p>

      <label
        htmlFor={fileInputId}
        className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#ddc9bb] bg-[#fffaf5] px-4 py-4 text-sm font-semibold text-[#59483f] transition hover:bg-[#fff3e8]"
      >
        {file ? 'Change selected photo' : 'Choose a photo'}
      </label>

      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        onChange={(event) => {
          setError(null)
          setMessage(null)
          setFile(event.target.files?.[0] ?? null)
        }}
        className="sr-only"
      />

      {file && (
        <p className="mt-2 text-xs text-[#806f64]">
          Selected: {file.name}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-[#ad3f2d]">{error}</p>
      )}

      {message && (
        <p className="mt-2 text-sm text-[#367347]">{message}</p>
      )}

      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={uploading}
        className="mt-3 rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload photo'}
      </button>
    </div>
  )
}
