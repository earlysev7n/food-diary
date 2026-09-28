// Purpose: Show simple private statistics for the active Space.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpace } from '../features/spaces/useSpace'
import { getSpaceStats } from '../features/stats/statsService'
import type { SpaceStats } from '../features/stats/types'

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(`${dateValue}T00:00:00`))
}

function formatRating(rating: number | null) {
  return rating ? `${rating}/5` : 'No rating'
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl bg-[#fffaf5] p-4">
      <p className="text-sm text-[#806f64]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#34251f]">{value}</p>
    </article>
  )
}

export function StatsPage() {
  const { activeSpace } = useSpace()
  const activeSpaceId = activeSpace?.id
  const [stats, setStats] = useState<SpaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadStats() {
      if (!activeSpaceId) {
        setStats(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const nextStats = await getSpaceStats(activeSpaceId)

        if (mounted) {
          setStats(nextStats)
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load your statistics.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadStats()

    return () => {
      mounted = false
    }
  }, [activeSpaceId])

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          Food memories
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Shared stats
        </h1>
        <p className="mt-2 text-[#806f64]">
          A quick look at what your Space has tasted so far.
        </p>
      </header>

      {!activeSpace && (
        <div className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#806f64]">
            Select or join a Space before viewing statistics.
          </p>
          <Link
            to="/profile"
            className="mt-4 inline-flex rounded-xl bg-[#34251f] px-4 py-2 text-sm font-semibold text-white"
          >
            Open Profile
          </Link>
        </div>
      )}

      {loading && activeSpace && (
        <p className="text-sm text-[#806f64]">Loading your statistics…</p>
      )}

      {error && (
        <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
          {error}
        </p>
      )}

      {!loading && !error && stats && (
        <>
          <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#34251f]">
              Overview
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Places saved" value={stats.totalPlaces} />
              <StatCard label="Places visited" value={stats.visitedPlaces} />
              <StatCard label="Want to try" value={stats.wishlistPlaces} />
              <StatCard label="Favorites" value={stats.favoritePlaces} />
              <StatCard label="Visits" value={stats.totalVisits} />
              <StatCard label="Dishes" value={stats.totalDishes} />
              <StatCard label="Photos" value={stats.totalPhotos} />
              <StatCard
                label="Average rating"
                value={
                  stats.averageVisitRating
                    ? `${stats.averageVisitRating}/5`
                    : '—'
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#34251f]">
              Highlights
            </h2>

            <div className="mt-4 space-y-3 text-sm text-[#59483f]">
              <p className="rounded-2xl bg-[#fbe4d7] p-4">
                Most visited:{' '}
                <strong>
                  {stats.mostVisitedPlace ?? 'No visits yet'}
                </strong>
              </p>
              <p className="rounded-2xl bg-[#fffaf5] p-4">
                Highest-rated dish:{' '}
                <strong>
                  {stats.topDish
                    ? `${stats.topDish.name} (${stats.topDish.rating}/5)`
                    : 'No rated dishes yet'}
                </strong>
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#eadfd6] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#34251f]">
              Recent visits
            </h2>

            {stats.recentVisits.length === 0 ? (
              <p className="mt-4 text-sm text-[#806f64]">
                Your recent visits will appear here.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {stats.recentVisits.map((visit) => (
                  <li
                    key={visit.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf5] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[#34251f]">
                        {visit.placeName}
                      </p>
                      <p className="mt-1 text-sm text-[#806f64]">
                        {formatDate(visit.visitedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#c75b32]">
                      {formatRating(visit.rating)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )
}
