// Purpose: Display the private photos attached to a visit.

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { deleteVisitPhoto, getVisitPhotos } from './photoService'
import type { PhotoWithUrl } from './types'

type PhotoGalleryProps = {
  spaceId: string
  visitId: string
  refreshKey: number
  canDelete?: boolean
}

export function PhotoGallery({
  spaceId,
  visitId,
  refreshKey,
  canDelete = false,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPhotos() {
      setLoading(true)
      setError(null)

      try {
        // Generate temporary signed URLs for this visit's images.
        const visitPhotos = await getVisitPhotos(spaceId, visitId)

        if (mounted) {
          setPhotos(visitPhotos)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load photos.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadPhotos()

    const channel = supabase
      .channel(`visit-photos:${spaceId}:${visitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `visit_id=eq.${visitId}`,
        },
        () => {
          if (mounted) {
            void loadPhotos()
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [spaceId, visitId, refreshKey])

  async function handleDeletePhoto(photo: PhotoWithUrl) {
    const confirmed = window.confirm(
      'Delete this photo? This cannot be undone.',
    )

    if (!confirmed) return

    setError(null)
    setDeletingPhotoId(photo.id)

    try {
      await deleteVisitPhoto({
        spaceId,
        photoId: photo.id,
        storagePath: photo.storage_path,
      })
      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id),
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to delete this photo.',
      )
    } finally {
      setDeletingPhotoId(null)
    }
  }

  if (loading) {
    return (
      <p className="mt-3 text-sm text-[#806f64]">
        Loading photos…
      </p>
    )
  }

  if (error) {
    return (
      <p className="mt-3 text-sm text-[#ad3f2d]">{error}</p>
    )
  }

  if (photos.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-[#34251f]">
        Saved photos ({photos.length})
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            <img
              src={photo.signedUrl}
              alt="Food memory"
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover"
            />

            {canDelete && (
              <button
                type="button"
                onClick={() => void handleDeletePhoto(photo)}
                disabled={deletingPhotoId === photo.id}
                aria-label="Delete photo"
                title="Delete photo"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-[#34251f]/85 text-lg leading-none text-white shadow-sm hover:bg-[#ad3f2d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingPhotoId === photo.id ? '…' : '×'}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-[#ad3f2d]">{error}</p>
      )}
    </div>
  )
}
