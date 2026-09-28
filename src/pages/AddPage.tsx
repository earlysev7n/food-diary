// Purpose: Provide the Add tab for searching and saving places.

import { useState } from 'react'
import { PlaceSearchForm } from '../features/places/PlaceSearchForm'
import { PlaceList } from '../features/places/PlaceList'

export function AddPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          New memory
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Add a food spot
        </h1>
      </header>

      <PlaceSearchForm
        onSaved={() => setRefreshKey((currentKey) => currentKey + 1)}
      />

      <PlaceList
        title="Saved food spots"
        refreshKey={refreshKey}
      />
    </section>
  )
}