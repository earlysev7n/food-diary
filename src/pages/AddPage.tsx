// Purpose: Provide the Add tab for searching and saving places.

import { useLocation, useNavigate } from 'react-router-dom'
import { PlaceSearchForm } from '../features/places/PlaceSearchForm'
import type { Place, PublicFoodSpot } from '../features/places/types'

type AddPageLocationState = {
  wishlistPlace?: Place
  publicFoodSpot?: PublicFoodSpot
}

export function AddPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const wishlistPlace =
    (location.state as AddPageLocationState | null)?.wishlistPlace ?? null
  const publicFoodSpot =
    (location.state as AddPageLocationState | null)?.publicFoodSpot ?? null

  function handleSaved() {
    if (wishlistPlace) {
      navigate('/diary', { replace: true })
    } else if (publicFoodSpot) {
      navigate('/', { replace: true })
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          New memory
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {wishlistPlace
            ? 'Log a visit'
            : publicFoodSpot
              ? 'Save a food spot'
              : 'Add a food spot'}
        </h1>
      </header>

      <PlaceSearchForm
        initialPlace={wishlistPlace}
        initialFoodSpot={publicFoodSpot}
        onSaved={wishlistPlace || publicFoodSpot ? handleSaved : undefined}
      />
    </section>
  )
}
