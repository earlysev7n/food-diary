// Purpose: Display visits and the dishes attached to each visit.

import { useEffect, useState } from 'react'
import { DishForm } from '../dishes/DishForm'
import { PhotoGallery } from '../photos/PhotoGallery'
import { PhotoUpload } from '../photos/PhotoUpload'
import { useSpace } from '../spaces/useSpace'
import { getVisits } from './visitService'
import type { VisitWithPlace } from './types'

type VisitListProps = {
  refreshKey: number
}

function formatVisitDate(dateValue: string) {
  // Purpose: Format the database date for display.
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(new Date(`${dateValue}T00:00:00`))
}

function formatRating(rating: number | null) {
  // Purpose: Display ratings as simple stars.
  return rating ? '★'.repeat(rating) : 'No rating'
}

export function VisitList({ refreshKey }: VisitListProps) {
  const { activeSpace } = useSpace()
  const [visits, setVisits] = useState<VisitWithPlace[]>([])
  const [dishRefreshKey, setDishRefreshKey] = useState(0)
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadVisits() {
      if (!activeSpace) {
        setVisits([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Load visits with their places and dishes.
        const savedVisits = await getVisits(activeSpace.id)

        if (mounted) {
          setVisits(savedVisits)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load your diary.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadVisits()

    return () => {
      mounted = false
    }
  }, [activeSpace?.id, refreshKey, dishRefreshKey, photoRefreshKey])

  return (
    <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#34251f]">
        Visit timeline
      </h2>

      {loading && (
        <p className="mt-4 text-sm text-[#806f64]">
          Loading your diary…
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {!loading && !error && !activeSpace && (
        <p className="mt-4 text-sm text-[#806f64]">
          Select a Space from your Profile first.
        </p>
      )}

      {!loading && !error && activeSpace && visits.length === 0 && (
        <p className="mt-4 text-sm text-[#806f64]">
          Your visits will appear here.
        </p>
      )}

      {!loading && visits.length > 0 && (
        <div className="mt-4 space-y-4">
          {visits.map((visit) => (
            <article
              key={visit.id}
              className="rounded-2xl bg-[#fffaf5] p-4"
            >
              <p className="text-sm font-semibold text-[#c75b32]">
                {formatVisitDate(visit.visited_at)}
              </p>

              <h3 className="mt-2 text-xl font-semibold text-[#34251f]">
                {visit.place?.name ?? 'Unknown place'}
              </h3>

              {visit.place?.address && (
                <p className="mt-1 text-sm text-[#806f64]">
                  {visit.place.address}
                </p>
              )}

              <p className="mt-3 text-lg tracking-widest text-[#d28b41]">
                {formatRating(visit.overall_rating)}
              </p>

              {visit.note && (
                <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-[#59483f]">
                  “{visit.note}”
                </p>
              )}

              {visit.dishes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[#34251f]">
                    Dishes
                  </p>

                  <ul className="mt-2 space-y-2">
                    {visit.dishes.map((dish) => (
                      <li
                        key={dish.id}
                        className="rounded-xl bg-white p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#34251f]">
                            {dish.name}
                          </span>

                          <span className="text-sm tracking-widest text-[#d28b41]">
                            {formatRating(dish.rating)}
                          </span>
                        </div>

                        {dish.comment && (
                          <p className="mt-1 text-sm text-[#806f64]">
                            {dish.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeSpace && (
                <>
                  <DishForm
                    spaceId={activeSpace.id}
                    visitId={visit.id}
                    onSaved={() =>
                      setDishRefreshKey((currentKey) => currentKey + 1)
                    }
                  />

                  {/* Purpose: Upload and display photos for this visit. */}
                  <PhotoUpload
                    spaceId={activeSpace.id}
                    visitId={visit.id}
                    onUploaded={() =>
                      setPhotoRefreshKey((currentKey) => currentKey + 1)
                    }
                  />

                  <PhotoGallery
                    spaceId={activeSpace.id}
                    visitId={visit.id}
                    refreshKey={photoRefreshKey}
                  />
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
