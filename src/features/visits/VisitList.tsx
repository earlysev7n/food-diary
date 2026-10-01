// Purpose: Display saved visits, memories, and photos in chronological order.

import { useEffect, useState } from 'react'
import { PhotoGallery } from '../photos/PhotoGallery'
import { PhotoUpload } from '../photos/PhotoUpload'
import { useSpace } from '../spaces/useSpace'
import { EditVisitForm } from './EditVisitForm'
import { deleteVisit, getVisits } from './visitService'
import type { VisitWithPlace } from './types'

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

export function VisitList() {
  const { activeSpace } = useSpace()
  const [visits, setVisits] = useState<VisitWithPlace[]>([])
  const [visitRefreshKey, setVisitRefreshKey] = useState(0)
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0)
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null)
  const [deletingVisitId, setDeletingVisitId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function handleDeleteVisit(visit: VisitWithPlace) {
    if (!activeSpace) return

    const confirmed = window.confirm(
      `Delete this visit to "${visit.place?.name ?? 'this place'}"? This removes its photos and cannot be undone.`,
    )

    if (!confirmed) return

    setError(null)
    setDeletingVisitId(visit.id)

    try {
      await deleteVisit(activeSpace.id, visit.id, visit.place_id)
      setEditingVisitId(null)
      setVisitRefreshKey((currentKey) => currentKey + 1)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to delete this visit.',
      )
    } finally {
      setDeletingVisitId(null)
    }
  }

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
        // Load visits with their place details.
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
  }, [
    activeSpace?.id,
    visitRefreshKey,
  ])

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
              className="relative rounded-2xl bg-[#fffaf5] p-4"
            >
              <button
                type="button"
                onClick={() => void handleDeleteVisit(visit)}
                disabled={deletingVisitId === visit.id}
                aria-label={`Delete visit to ${visit.place?.name ?? 'this place'}`}
                title="Delete visit"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-[#c9573a] hover:bg-[#fff0ed] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingVisitId === visit.id ? '…' : '×'}
              </button>

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

              <button
                type="button"
                onClick={() =>
                  setEditingVisitId((currentId) =>
                    currentId === visit.id ? null : visit.id,
                  )
                }
                className="mt-3 rounded-xl border border-[#ddc9bb] px-3 py-2 text-sm font-semibold text-[#59483f] hover:bg-white"
              >
                {editingVisitId === visit.id ? 'Close editor' : 'Edit visit'}
              </button>

              {editingVisitId === visit.id && activeSpace && (
                <EditVisitForm
                  spaceId={activeSpace.id}
                  visit={visit}
                  onSaved={() => {
                    setEditingVisitId(null)
                    setVisitRefreshKey((currentKey) => currentKey + 1)
                  }}
                  onCancel={() => setEditingVisitId(null)}
                />
              )}

              {visit.note && (
                <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-[#59483f]">
                  “{visit.note}”
                </p>
              )}

              {activeSpace && (
                <PhotoGallery
                  spaceId={activeSpace.id}
                  visitId={visit.id}
                  refreshKey={photoRefreshKey}
                />
              )}

              {activeSpace && editingVisitId === visit.id && (
                <PhotoUpload
                  spaceId={activeSpace.id}
                  visitId={visit.id}
                  onUploaded={() =>
                    setPhotoRefreshKey((currentKey) => currentKey + 1)
                  }
                />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
