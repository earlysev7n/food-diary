// Purpose: Display the private photos attached to a visit.

import { useEffect, useState } from 'react'
import { getVisitPhotos } from './photoService'
import type { PhotoWithUrl } from './types'

type PhotoGalleryProps = {
  spaceId: string
  visitId: string
  refreshKey: number
}

export function PhotoGallery({
  spaceId,
  visitId,
  refreshKey,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    return () => {
      mounted = false
    }
  }, [spaceId, visitId, refreshKey])

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
        Photos ({photos.length})
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.signedUrl}
            alt="Food memory"
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover"
          />
        ))}
      </div>
    </div>
  )
}
