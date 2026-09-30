// Purpose: Show the saved visit timeline and its editable details.

import { VisitList } from '../features/visits/VisitList'

export function DiaryPage() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          Memories
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Our diary
        </h1>

        <p className="mt-2 text-[#806f64]">
          Your saved meals, memories, ratings, and photos in one timeline.
        </p>
      </header>

      <VisitList />
    </section>
  )
}
