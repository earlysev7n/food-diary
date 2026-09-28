// Purpose: Show only places saved with the wishlist status.

import { PlaceList } from '../features/places/PlaceList'

export function WishlistPage() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
          Next bites
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Want to try
        </h1>
      </header>

      <PlaceList
        title="Wishlist places"
        statusFilter="wishlist"
      />
    </section>
  )
}