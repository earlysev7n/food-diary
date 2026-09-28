// Purpose: Combine the visit form and diary timeline.

import { useState } from 'react'
import { VisitForm } from '../features/visits/VisitForm'
import { VisitList } from '../features/visits/VisitList'

export function DiaryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

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
          Record the meals and memories you want to keep.
        </p>
      </header>

      <VisitForm
        onSaved={() =>
          setRefreshKey((currentKey) => currentKey + 1)
        }
      />

      <VisitList refreshKey={refreshKey} />
    </section>
  )
}